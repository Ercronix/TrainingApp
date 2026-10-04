# Project Map

## Purpose
Full-stack fitness tracker: plan training splits/workouts, log sessions, track progress and weekly sets per muscle.

## Requirements
- Mobile (Android) and web clients.
- Sessions must work offline and survive app restarts.
- Per-user data isolation.

## Components
- Frontend (`frontend/`): Expo / React Native, Expo Router screens in `app/`, HTTP via `services/api.ts`, server state via TanStack Query hooks in `hooks/`, client state via Zustand in `store/`, NativeWind styling.
- Backend (`backend/training-backend/`): Spring Boot, layered controller -> service -> repository (JPA), DTOs in `dto/`, exceptions in `exception/`, JWT security in `security/`.
- Database: PostgreSQL, schema owned by Flyway migrations (`src/main/resources/db/migration`, latest V15).

## Main Flow
```
Screen (app/*.tsx)
  -> hook (hooks/*, TanStack Query; offline cache in AsyncStorage)
  -> services/api.ts (axios + JWT, refresh on 401)
  -> [HTTP /api/**] -> Controller -> Service (auth/ownership check) -> Repository -> Postgres
```
Domain: User -> TrainingSplit -> Workout -> Exercise -> LibraryExercise (per user; muscles from global exercise_catalog). TrainingLog -> ExerciseLog (session).

### UX branch (feat/ux-improvements), implemented
- Home tab `app/(tabs)/index.tsx` ("TRAIN"): active split, split picker (`components/SplitPicker.tsx`), Next up computed client-side from cached history, resume card, empty states. Split list moved to `app/splits.tsx`; shared `components/WorkoutRow.tsx`.
- Log screen `app/log-exercise.tsx`: one-tap set logging, steppers, per-exercise step size (`store/stepSizeStore.ts`, client-only), saves full set list on each change (instant for log/undo, 600 ms debounce for value edits, flush on close); drafts cleared on session complete.

## Data and Trust Boundaries
- Auth: short-lived JWT access tokens (subject = user id) + rotating single-use refresh tokens in DB.
- Ownership checks live in services.
- Tokens on client: SecureStore (native) / localStorage (web).

## Build and Deployment
- Frontend: `npm run start`, checks `npx tsc --noEmit`, `npm run lint`.
- Backend: `./gradlew bootRun`, `./gradlew test` (needs Postgres).
- CI: `.github/workflows/ci.yml`; Android APK: `.github/workflows/android-build.yml` (EAS local build).
- Deploy: root `docker-compose.yml` (Postgres, backend prod profile, Nginx serving Expo web export on 8082).

## Unknowns
- Not yet inspected in detail beyond CLAUDE.md and directory listing.
