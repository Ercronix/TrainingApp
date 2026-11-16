#!/usr/bin/env bash
# Stop what up.sh / browser.mjs started, by killing whatever listens on each port (matching
# command lines with pkill -f also hits any shell whose command mentions the pattern).
# The database container keeps running: it holds the dev data.
#   down.sh                backend + web + chrome
#   down.sh web            only those parts
WEB_PORT="${WEB_PORT:-8082}"

stop_port() { # name, port
  local pids
  pids=$(ss -ltnpH "sport = :$2" | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u)
  if [[ -z $pids ]]; then echo "$1 not running"; return; fi
  kill $pids
  for _ in $(seq 50); do ss -ltnH "sport = :$2" | grep -q . || break; sleep 0.2; done
  echo "stopped $1 (port $2)"
}

parts=("$@")
[[ ${#parts[@]} -eq 0 ]] && parts=(backend web chrome)
for p in "${parts[@]}"; do
  case $p in
    backend) stop_port backend 8080 ;; # the Gradle client exits once its bootRun ends
    web) stop_port web "$WEB_PORT" ;;
    chrome) stop_port chrome 9333 ;;
    *) echo "unknown part: $p (backend|web|chrome)" >&2; exit 2 ;;
  esac
done
