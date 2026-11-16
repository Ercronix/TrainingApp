#!/usr/bin/env bash
# Start the local stack and wait until each part is ready. Idempotent: anything already
# listening on its port is left alone.
#   up.sh            db + backend + web (default)
#   up.sh db backend only those parts
# Logs: $RUN_APP_DIR (default /tmp/trainingapp-run)/{backend,web}.log
set -euo pipefail

ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
LOGS="${RUN_APP_DIR:-/tmp/trainingapp-run}"
WEB_PORT="${WEB_PORT:-8082}" # must be an origin in cors.allowed.origins (application-local.properties)
mkdir -p "$LOGS"

listening() { ss -ltn "sport = :$1" | grep -q LISTEN; }

wait_for() { # name, timeout seconds, command...
  local name=$1 timeout=$2; shift 2
  for ((i = 0; i < timeout; i++)); do
    if "$@" >/dev/null 2>&1; then echo "$name ready"; return 0; fi
    sleep 1
  done
  echo "$name not ready after ${timeout}s" >&2
  return 1
}

start_db() {
  if listening 5432; then echo "db already up (5432)"; return; fi
  [[ -f "$ROOT/backend/.env" ]] || { echo "backend/.env missing (POSTGRES_DB/USER/PASSWORD)" >&2; exit 1; }
  (cd "$ROOT/backend" && docker compose up -d)
  wait_for db 60 docker exec training-db pg_isready -q
}

start_backend() {
  if listening 8080; then echo "backend already up (8080)"; return; fi
  [[ -f "$ROOT/backend/training-backend/src/main/resources/application-local.properties" ]] ||
    echo "warning: application-local.properties missing (copy it from the main checkout in a worktree)" >&2
  # exec, so no shell stays behind holding the caller's stdout (a `| tail` would never end)
  (cd "$ROOT/backend/training-backend" && exec setsid nohup ./gradlew bootRun </dev/null >"$LOGS/backend.log" 2>&1) &
  # /api/auth/me answers 401 without a token once the app is up
  wait_for backend 180 bash -c "curl -s -o /dev/null -w '%{http_code}' localhost:8080/api/auth/me | grep -q 401" ||
    { tail -30 "$LOGS/backend.log" >&2; exit 1; }
}

start_web() {
  if listening "$WEB_PORT"; then echo "web already up ($WEB_PORT)"; return; fi
  [[ -d "$ROOT/frontend/node_modules" ]] || (cd "$ROOT/frontend" && npm ci)
  # No CI=1: it disables file watching, so edits would need a restart
  (cd "$ROOT/frontend" && exec setsid nohup npx expo start --web --port "$WEB_PORT" </dev/null >"$LOGS/web.log" 2>&1) &
  wait_for "web server" 120 curl -sf "localhost:$WEB_PORT" || { tail -30 "$LOGS/web.log" >&2; exit 1; }
  # The first request triggers the bundle build; wait for it so the first screenshot isn't blank
  wait_for "web bundle" 180 bash -c "curl -sf localhost:$WEB_PORT | grep -o 'src=\"[^\"]*\\.bundle[^\"]*\"' | head -1 | cut -d'\"' -f2 | xargs -I{} curl -sf -o /dev/null 'localhost:$WEB_PORT{}'"
}

parts=("$@")
[[ ${#parts[@]} -eq 0 ]] && parts=(db backend web)
for p in "${parts[@]}"; do
  case $p in
    db) start_db ;;
    backend) start_backend ;;
    web) start_web ;;
    *) echo "unknown part: $p (db|backend|web)" >&2; exit 2 ;;
  esac
done
echo "logs in $LOGS"
