# TrainingApp

TrainingApp is a full-stack fitness tracking app for planning workouts, running training sessions, and analyzing progress over time.

It was built as a portfolio project to demonstrate end-to-end product development: mobile/web frontend, secure backend API, relational data modeling, authentication, and analytics-oriented UX.

## Main Features

- User registration/login with JWT access tokens and rotating refresh tokens.
- Training split management (create, update, activate, delete).
- Workout management per split.
- Exercise management per workout, including reordering.
- Shared exercise library: an exercise used in several workouts shares its notes, video and progress history.
- Live training logs:
  - start session
  - update exercise completion, reps, sets, weight, notes
  - complete or delete session
- Offline support: cached data stays available, and exercise log edits made offline sync once the connection returns.
- History view with search + date filters.
- Dashboard metrics:
  - streak tracking
  - weekly/monthly/yearly sessions
  - volume calculation
  - total training time
  - most active day

## Tech Stack

### Frontend

- Expo + React Native + TypeScript
- Expo Router
- TanStack Query
- Axios
- Zustand
- NativeWind

### Backend

- Java 21
- Spring Boot
- Spring Security + JWT
- Spring Data JPA
- Flyway
- PostgreSQL

## Architecture

- `frontend/`: client app (mobile + web).
- `backend/training-backend/`: REST API, auth, business logic, persistence.
- `backend/docker-compose.yml`: local PostgreSQL container setup.
- `docker-compose.yml` (repo root): production deployment (PostgreSQL, backend, Expo web build behind Nginx).
  The backend container has a Docker healthcheck on Spring Boot Actuator's readiness probe (`/actuator/health/readiness`), and the Nginx frontend only starts once it reports healthy, i.e. after Flyway has migrated. Health is the only Actuator endpoint, shows just the status and stays internal, since Nginx only proxies `/api`.
- JWT-protected API routes (`/api/**`, except `/api/auth/**`).
- Brute-force protection: login is rate limited per client IP and per username, registration and token refresh per IP (429 with `Retry-After`; limits under `auth.rate-limit.*` in `application.properties`). Behind Nginx the client IP is taken from `X-Forwarded-For` of trusted proxies only (`AUTH_RATE_LIMIT_TRUSTED_PROXIES`, see `.env.example`).
- Flyway migrations in `backend/training-backend/src/main/resources/db/migration` manage the schema.

## Run Locally

### Prerequisites

- Node.js 22 (what CI uses) and npm
- Java 21 (Gradle itself comes with the wrapper)
- Docker, for the local PostgreSQL and the backend tests

### 1) Create the local config (once per machine)

Two files hold local secrets and are gitignored, so every machine needs its own copy. Copy the examples:

```bash
cp backend/.env.example backend/.env
cp backend/training-backend/src/main/resources/application-local.properties.example \
   backend/training-backend/src/main/resources/application-local.properties
```

Then edit them:

- Pick a database password and put it in both files (`POSTGRES_PASSWORD` and `spring.datasource.password`).
- Set `jwt.secret` to a random string of at least 32 characters (`openssl rand -hex 32`).
- `cors.allowed.origins` must list the URL the web app runs on. The example allows Expo's
  `http://localhost:8081` and `http://localhost:8082`.

### 2) Start PostgreSQL

```bash
cd backend
docker compose up -d
```

The data lives in a Docker volume, so each machine has its own dev database and accounts.

### 3) Start backend

```bash
cd backend/training-backend
./gradlew bootRun
```

Backend runs on `http://localhost:8080`. Flyway creates the schema on first start.

### 4) Start frontend

```bash
cd frontend
npm ci
npm run start
```

Open on web (`w`) or mobile via Expo QR code. Native builds always call the production API (see Environment Notes).

### With Claude Code

The `run-app` skill (`.claude/skills/run-app/`) starts the database, backend and web build, can seed a user with weeks of training history (`node .claude/skills/run-app/scripts/seed.mjs`) and drives the web app in headless Chrome for screenshots. It needs Chrome or Chromium and the config from step 1.

## Build Android APK

The mobile app always points at the production API, so no extra config is needed before building.

All EAS build profiles in `frontend/eas.json` (`development`, `preview`, `production`) produce an installable `.apk` rather than an `.aab`.

### Option A: GitHub Actions (recommended)

Run the **Android Build** workflow from the Actions tab and pick a profile. It builds on the Actions runner with `eas build --local` (signing credentials come from EAS through the `EXPO_TOKEN` repository secret) and attaches the `.apk` to a new GitHub release. Non-production builds are marked as pre-releases.

### Option B: EAS Build (cloud)

```bash
cd frontend
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

EAS prints a download link once the build finishes.

### Option C: Local build (no EAS account)

```bash
cd frontend
npx expo prebuild --platform android
cd android
JAVA_HOME=/path/to/jdk-21 ./gradlew assembleRelease   # or assembleDebug for an unsigned debug APK
```

Use the `./gradlew` wrapper, not a system-installed `gradle` — the project pins Gradle 8.14.3, which requires JDK 21 or older (it will fail on newer JDKs like 24+). Set `JAVA_HOME` for the command if your system default Java is newer.

Output APK: `frontend/android/app/build/outputs/apk/release/app-release.apk` (or `.../debug/app-debug.apk` for the debug variant). An unsigned release build will need a signing config before it can be installed; the debug variant installs as-is.

## Environment Notes

- Frontend API base URL is defined in `frontend/services/api.ts`. On web it comes from `EXPO_PUBLIC_API_URL` (default `http://localhost:8080/api`); native builds use the production URL.
- For real mobile device testing against a local backend, update the non-web API URL to your machine's LAN IP.
- Backend uses Spring profile `local` by default, which reads the gitignored `application-local.properties` (JWT secret, datasource password, CORS origins).

## Tests and CI

```bash
cd frontend
npx tsc --noEmit     # typecheck (app)
npx tsc --noEmit -p e2e  # typecheck (end-to-end tests)
npm run lint         # ESLint; warnings fail CI
npm test             # Jest unit tests for utils/ (*.test.ts next to each module)
npm run e2e          # Playwright end-to-end tests (needs PostgreSQL running, see below)

cd backend/training-backend
./gradlew test       # Spring Boot tests
```

The backend tests start their own throwaway PostgreSQL through Testcontainers, so they only need Docker running. They don't touch the dev database and don't need `application-local.properties`.

### End-to-end tests

`frontend/e2e/` holds Playwright tests that drive the web app in Chromium (phone viewport with touch) against the real backend: sign-up and sign-in, building a split, a full session up to the history, and sets logged offline that sync once the network is back. `npm run e2e` starts what it needs itself (`frontend/playwright.config.ts`):

- the backend with `./gradlew bootRun` on port 8090, in its own `e2e` profile with test secrets and high rate limits, so `application-local.properties` is not read;
- a production web export (`expo export`) pointed at that backend and served on port 8093.

Both use other ports than the dev stack. PostgreSQL must already run: locally the dev database from step 2 (the password is read from `backend/.env`; or set `E2E_DB_URL`, `E2E_DB_USER`, `E2E_DB_PASSWORD`). Each test registers its own `e2e_...` user, so the tests run in parallel and leave those users behind in the dev database. Outside CI, servers already listening on 8090/8093 are reused; stop them after backend or frontend changes. The first run needs Playwright's Chromium: `npx playwright install chromium`. `npm run e2e:ui` opens Playwright's UI mode; failures keep a trace and a screenshot in `frontend/e2e/.results/`.

The CI workflow (`.github/workflows/ci.yml`) runs all of these on every push and pull request to `main`. Dependabot (`.github/dependabot.yml`) opens weekly dependency update PRs; Expo-pinned packages are left out and upgraded together with `npx expo install --fix` on an SDK bump.

## API Docs

The backend generates an OpenAPI 3.1 spec with springdoc and serves Swagger UI next to it:

- Local: Swagger UI at http://localhost:8080/api/docs, spec at http://localhost:8080/api/docs/openapi.json
- Production: the same `/api/docs` and `/api/docs/openapi.json` paths on the app's host, since Nginx proxies `/api` to the backend

To try endpoints in Swagger UI, call `POST /api/auth/login` (or `/register`), copy `token` from the response and paste it into "Authorize". Every endpoint needs it except the token endpoints under `/api/auth` and the stretch reminder's "Done" link.

The docs are on in every profile. Switch them off with `springdoc.api-docs.enabled=false` and `springdoc.swagger-ui.enabled=false` (or the `SPRINGDOC_API_DOCS_ENABLED` / `SPRINGDOC_SWAGGER_UI_ENABLED` environment variables).

Endpoints are grouped by domain:

- **Auth** (`/api/auth`): register, log in, refresh and revoke tokens, the current user
- **Account** (`/api/account`): change username, email or password, delete the account
- **Splits** (`/api/splits`): training splits, the active one and switching it
- **Workouts** (`/api/workouts`): the training days of a split
- **Workout exercises** (`/api/workouts/{workoutId}/exercises`, `/api/exercises/{id}/progress`): a workout's planned exercises, their order and progress
- **Library** (`/api/library-exercises`): the user's exercise library and progress per entry
- **Exercise catalog** (`/api/exercise-catalog`): the global catalog and its SVG illustrations
- **Training logs** (`/api/training-logs`): sessions, their exercise logs and the history
- **Stats** (`/api/stats`): dashboard statistics
- **Stretch** (`/api/stretch`): the stretching routine, check-ins and the daily reminder
