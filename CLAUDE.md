# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Full-stack fitness tracker: Expo/React Native client (`frontend/`, mobile + web) and a Spring Boot REST API (`backend/training-backend/`) on PostgreSQL.

## Commands

### Frontend (`frontend/`)
- `npm ci` then `npm run start` (Expo dev server; `w` for web). `npm run web` for web only.
- Checks CI runs (there is no test suite): `npx tsc --noEmit` and `npm run lint` (ESLint,
  `eslint-config-expo` flat config). Lint currently passes with 5 warnings; warnings don't fail CI.
- Imports use the `@/` alias for the `frontend/` root.

### Backend (`backend/training-backend/`, Java 21, Gradle wrapper)
- Local DB: `cd backend && docker compose up -d` (needs `backend/.env` with `POSTGRES_DB/USER/PASSWORD`).
- Run: `./gradlew bootRun` (port 8080). The `local` profile is active by default and reads `application-local.properties`, which is gitignored and holds `jwt.secret`, the datasource password and CORS origins.
- Tests: `./gradlew test`. Single test: `./gradlew test --tests 'de.mornhinweg.trainingbackend.controller.AuthControllerTest'` (append `.methodName` for one method).
- Tests are `@SpringBootTest` and need a running Postgres with Flyway migrations. Without `application-local.properties`, provide `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET` and `CORS_ALLOWED_ORIGINS` as env vars (see `.github/workflows/ci.yml`).

### Android builds
- `.github/workflows/android-build.yml` (manual `workflow_dispatch` with a profile input) runs `eas build --local` on the Actions runner and attaches the `.apk` to a GitHub release. Signing credentials come from EAS (`EXPO_TOKEN` secret). Build profiles live in `frontend/eas.json`.

### Deployment
- Root `docker-compose.yml` + `.env` (see `.env.example`) runs Postgres, the backend with the `prod` profile, and an Expo web export served by Nginx on port 8082. Nginx proxies `/api` to the backend.

## Architecture

### Backend
- Layered: `controller` → `service` → `repository` (Spring Data JPA), with request/response DTOs under `dto/<domain>/`. Lombok is used throughout.
- Domain hierarchy: `User` → `TrainingSplit` (one active per user; tracks a current block) → `Workout` (a named training day) → `Exercise` (the workout's plan: sets/reps/weight, ordered by `orderIndex`). Each `Exercise` links to a per-user `LibraryExercise` that holds its name, notes, video and rep unit. Entries are shared across workouts and unique per user ignoring case, and progress and "previous session" values are aggregated per library entry. A `TrainingLog` is a session started from a workout and holds `ExerciseLog`s.
- Authorization is per user and lives in the services. Each service method resolves the user from the `Authentication` argument and checks ownership through the split (e.g. `findByIdAndUserId`, or `workout.getSplit().getUser()`). New endpoints must do the same.
- Errors: throw the exceptions in `exception/` (`ResourceNotFoundException`, `UnauthorizedException`, `ConflictException`, `BadRequestException`). `GlobalExceptionHandler` maps them to HTTP responses.
- Auth: short-lived JWT access tokens (`JwtAuthenticationFilter`) plus single-use, rotating refresh tokens stored in the DB (`RefreshTokenService`). `/api/auth/**` is public and everything else under `/api/**` requires a token.
- Schema is owned by Flyway (`src/main/resources/db/migration/V<n>__*.sql`) with `ddl-auto=validate`. Schema changes need a new migration and matching entity changes; never edit an applied migration.

### Frontend
- Expo Router file-based routes in `app/`: `(auth)` for login/register, `(tabs)` for the main tabs, and other screens and modals registered in `app/_layout.tsx`. `providers/AuthProvider.tsx` redirects between the auth and tab groups based on auth state.
- All HTTP calls go through the domain objects in `services/api.ts` (`authApi`, `splitsApi`, `workoutsApi`, `exercisesApi`, `libraryApi`, `trainingLogsApi`, `statsApi`). The API base URL is `EXPO_PUBLIC_API_URL` (default `localhost:8080`) on web, but native builds always use the hard-coded production URL. The axios interceptor attaches the access token and, on a 401, refreshes once (concurrent 401s share a single refresh) and retries.
- Tokens are stored via `services/storage.ts` (SecureStore on native, localStorage on web).
- Server state uses TanStack Query through per-feature hooks in `hooks/`. Query keys are in `constants/queryKeys.ts`. Zustand stores in `store/` hold only client state (auth, theme, dialogs).
- **Offline support** (`services/queryClient.ts`): the query cache is persisted to AsyncStorage for 7 days, and NetInfo drives `onlineManager`. Mutations that must survive offline and app restarts (currently `updateExerciseLog`) need a `mutationKey` plus a `setMutationDefaults` entry registering their `mutationFn`. They are replayed via `resumePausedMutations` after the cache is restored, and the hook updates the UI optimistically. On startup without a network, `AuthProvider` keeps the user signed in using the cached user. The query cache is cleared whenever the session ends.
- Styling: NativeWind (Tailwind) classes backed by CSS variables. `constants/theme.ts` defines themes and palettes (dark/light and a custom accent), `getThemeVars` injects them at the root, and `tailwind.config.js` maps color names to `var(--color-*)`. Use theme color classes (`bg-surface`, `text-accent`, etc.) rather than hard-coded colors.
- Dialogs: use `alert`/`confirm` from `utils/confirm.ts` (themed, and they work on web) rather than React Native's `Alert.alert`.
