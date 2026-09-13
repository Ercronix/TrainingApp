# TrainingApp

TrainingApp is a full-stack fitness tracking app for planning workouts, running training sessions, and analyzing progress over time.

It was built as a portfolio project to demonstrate end-to-end product development: mobile/web frontend, secure backend API, relational data modeling, authentication, and analytics-oriented UX.

## Main Features

- User registration/login with token-based auth.
- Training split management (create, update, activate, delete).
- Workout management per split.
- Exercise management per workout, including reordering.
- Live training logs:
  - start session
  - update exercise completion, reps, sets, weight, notes
  - complete or delete session
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
- JWT-protected API routes (`/api/**`, except `/api/auth/**`).
- Flyway migrations manage schema evolution (`V1` to `V9`).

## Run Locally

### Prerequisites

- Node.js 18+ and npm
- Java 21
- Docker (recommended for local PostgreSQL)

### 1) Start PostgreSQL

Create `backend/.env`:

```env
POSTGRES_DB= ""
POSTGRES_USER= ""
POSTGRES_PASSWORD= ""
```

Then run:

```bash
cd backend
docker compose up -d
```

### 2) Start backend

```bash
cd backend/training-backend
./gradlew bootRun
```

Backend runs on `http://localhost:8080`.

### 3) Start frontend

```bash
cd frontend
npm install
npm run start
```

Open on web (`w`) or mobile via Expo QR code.

## Build Android APK

The mobile app always points at the production API, so no extra config is needed before building.

### Option A: EAS Build (cloud, recommended)

```bash
cd frontend
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

The `preview` profile (`frontend/eas.json`) uses internal distribution, which produces an installable `.apk` rather than an `.aab`. EAS prints a download link once the build finishes.

### Option B: Local build (no EAS account)

```bash
cd frontend
npx expo prebuild --platform android
cd android
JAVA_HOME=/path/to/jdk-21 ./gradlew assembleRelease   # or assembleDebug for an unsigned debug APK
```

Use the `./gradlew` wrapper, not a system-installed `gradle` — the project pins Gradle 8.14.3, which requires JDK 21 or older (it will fail on newer JDKs like 24+). Set `JAVA_HOME` for the command if your system default Java is newer.

Output APK: `frontend/android/app/build/outputs/apk/release/app-release.apk` (or `.../debug/app-debug.apk` for the debug variant). An unsigned release build will need a signing config before it can be installed; the debug variant installs as-is.

## Environment Notes

- Frontend API base URL is defined in `frontend/services/api.ts`.
- For real mobile device testing, update the non-web API URL to your machine's LAN IP.
- Backend uses Spring profile `local` by default.

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/splits`
- `GET/POST/PUT/DELETE /api/workouts`
- `GET/POST/PUT/PATCH/DELETE /api/workouts/{workoutId}/exercises`
- `GET /api/exercises/{exerciseId}/progress`
- `POST/GET/PUT/DELETE /api/training-logs`
