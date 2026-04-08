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
POSTGRES_DB=training_db
POSTGRES_USER=training_user
POSTGRES_PASSWORD=EuNnqQ6PWENrtmAli05IUg==
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
