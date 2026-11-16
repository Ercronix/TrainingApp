---
name: run-app
description: Start the TrainingApp locally (Postgres, Spring Boot backend, Expo web) and drive it in headless Chrome to screenshot screens, tap through flows, read the page text and catch console errors; seed a user with realistic history; notes for the Android emulator. Use to run the app, see a UI change, reproduce a bug, or check a change end to end.
---

# Run and drive the app

Scripts are in `.claude/skills/run-app/scripts/` (paths below are relative to that directory).
Logs and screenshots go to `/tmp/trainingapp-run/` (override with `RUN_APP_DIR`).

## 0. On a new machine

Needs Docker, Node, Java 21 and Chrome or Chromium (found on PATH as `google-chrome-stable`,
`google-chrome`, `chromium` or `chromium-browser`; otherwise set `CHROME_BIN`), plus `ss` (iproute2).
Two gitignored files must exist: `backend/.env` (`POSTGRES_DB/USER/PASSWORD`) and
`backend/training-backend/src/main/resources/application-local.properties` (`jwt.secret`, the
datasource password, and `cors.allowed.origins` including `http://localhost:8082`). Run
`npm ci` in `frontend/` once.

## 1. Start the stack

```bash
./up.sh            # db + backend + web; or e.g. ./up.sh db backend
```

Idempotent: a part whose port is already listening is reused (Postgres 5432, backend 8080,
web 8082). It waits until the backend answers and the web bundle is built (about 15 s warm,
up to a few minutes on a cold Gradle/Metro cache). On failure it prints the log tail; full
logs are `backend.log` and `web.log`.

- Web runs on **8082**, which must be in the backend's `cors.allowed.origins`. For another port set
  `WEB_PORT` for both `up.sh` and `browser.mjs` and add that origin to the CORS list.
- Metro watches files, so frontend edits hot reload. Backend changes need `./down.sh backend && ./up.sh backend`.
- After `npx expo install <pkg>`, restart web (`./down.sh web && ./up.sh web`), or the bundle fails to resolve it.
- In a git worktree, copy `backend/.env` and `backend/training-backend/src/main/resources/application-local.properties`
  from the main checkout first (both gitignored). Only one backend/web can use the ports at a time.

## 2. Give it data (optional)

```bash
node seed.mjs                       # registers seed_xxxxxx / password123 and prints it
node seed.mjs --login emutest:emutest123 --weeks 8 --per-week 4
```

Creates an active "Upper / Lower" split with catalog exercises (muscles and drawings) and
completed sessions spread over past weeks with rising weights, so stats, records, charts, the
calendar and "previous session" values have content. It moves session dates back with SQL in the
`training-db` container, so it only works against the local dev DB. Each run adds another split
and sessions; use a new user for a clean slate.

## 3. Drive the web app

```bash
node browser.mjs --login new shot:train
node browser.mjs --login seed_ab12cd:password123 tap-text:History wait:500 shot:history text
node browser.mjs --login new --url /some/route swipe:350,500,40,500 shot:after-swipe
```

Each run opens a fresh, isolated browser context (390×844 phone viewport, touch input, headless
Chrome on port 9333, started on demand), optionally signs in by seeding the tokens into
localStorage, opens `--url` and waits for the network to go idle, then runs the steps in order:

| step | does |
|---|---|
| `shot:<name>` | screenshot to `/tmp/trainingapp-run/shots/<name>.png` (look at it with Read) |
| `tap:<x>,<y>` / `tap-text:<text>` | touch tap; `tap-text` hits the smallest visible element whose text matches (exact, else contains, case-insensitive) |
| `type:<text>` | insert text into the focused input (tap the input first) |
| `swipe:<x1>,<y1>,<x2>,<y2>[,<ms>]` | touch drag; a horizontal swipe changes tabs |
| `wait:<ms>` / `settle` | sleep / wait for network idle |
| `goto:<route>` | navigate and settle |
| `text` | print `document.body.innerText`: cheaper than a screenshot for checking content |
| `eval:<js>` | print the value of a page expression |
| `offline` / `online` | emulate losing the network (offline queue, cached data). Only after the app has loaded: a `goto` while offline shows Chrome's offline page, since the web build has no service worker |

Options: `--size 390x844`, `--dpr 2` (crisper, bigger screenshots), `--out <dir>`.
Console errors and exceptions are printed at the end. Always-present noise to ignore: the
`expo-notifications` push token warning, `pointerEvents`/`TouchableMixin` deprecations and
`Unknown event handler property onResponder...` errors.

Prefer `text` and `eval` to check content and screenshots to check layout. Tab bar labels
(`Train`, `Stats`, `History`, `Profile`) work with `tap-text`.
Inputs have no text, so find them by placeholder, then `tap` and `type`:
`eval:[...document.querySelectorAll("input")].map(i=>{const r=i.getBoundingClientRect();return [i.placeholder,r.x+r.width/2,r.y+r.height/2]})`
(the login screen's username/password fields are at 195,387 / 195,487).

Known web-only quirk: after tapping an action on a screen with a plain `FlatList`, the next
swipe can fail because Chrome delivers a stale touchmove. That isn't an app bug.

## 4. Stop

```bash
./down.sh          # backend + web + chrome; or e.g. ./down.sh web
```

It stops whatever listens on each port. Don't use `pkill -f bootRun`/`expo start`: it also matches
the calling shell when its command line contains that text and kills it (exit 144). The
`training-db` container stays up because it holds the dev data.

## Android emulator (native-only bugs)

Web can't show native-only problems (style props overriding className, Animated/transform
issues, the native pager going blank). The SDK path and AVD name differ per machine
(`emulator -list-avds`); one setup that works is SDK in `~/Android/Sdk`, AVD `pixel7_api35`:

- `emulator -avd <avd> -no-window -no-audio -no-snapshot -gpu swiftshader_indirect`
- With `./up.sh` running: `adb reverse tcp:8082 tcp:8082 && adb reverse tcp:8080 tcp:8080`, then
  `adb shell am start -a android.intent.action.VIEW -d exp://127.0.0.1:8082` (Expo Go 54.0.8).
- Native builds always call the production API: temporarily point `services/api.ts` at
  `http://10.0.2.2:8080/api` and revert afterwards. In Expo Go the splash never hides because of
  `SplashScreen.preventAutoHideAsync()` in `app/_layout.tsx`; comment it out temporarily.
- Wait about 25 s after a cold start before input. Expo Go sometimes crashes on launch; relaunch.
  Screenshot with `adb exec-out screencap -p > file.png` (call `adb` directly, not through a
  variable, so the allowlisted rule matches). Gesture-handler changes need a force-stop and relaunch.
- Users live in each machine's own dev DB. If `emutest` / `emutest123` doesn't exist there yet,
  create it with `node seed.mjs --login emutest:emutest123` (it registers the user if needed).

## Backend tests

`./gradlew test` in `backend/training-backend` starts its own Postgres through Testcontainers
(Docker must be running) and doesn't need the dev database or `application-local.properties`.
