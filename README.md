# Fitness Buddy

A personal instrumentation system for fitness tracking.
Hevy + Strava + MyFitnessPal combined.

## Tech Stack

- **Backend**: Go (Chi, pgx) - Modular Monolith
- **Frontend**: React (Vite, Tailwind, TypeScript)
- **Database**: PostgreSQL

## Getting Started

### Prerequisites

- PostgreSQL installed and running.
- Go 1.22+
- Node.js 20+

### Database Setup

Create a database named `fitness_buddy` (or whatever you prefer).

```bash
createdb fitness_buddy
```

### Backend

1. Navigate to `backend`:
   ```bash
   cd backend
   ```
2. Create `.env` file:
   ```bash
   echo "DATABASE_URL=postgres://user:password@localhost:5432/fitness_buddy" > .env
   ```
   Replace `user:password` with your Postgres credentials.

3. Run the server:
   ```bash
   go run cmd/server/main.go
   ```
   Migrations will run automatically on startup.

### Frontend

1. Navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```

Open http://localhost:5173 to view the app.

## Features

- **Identity**: Single user profile.
- **Resistance**: Workout logging (Sets, Reps, RPE).
- **Running**: Manual run logging.
- **Nutrition**: Meal and macro tracking.
- **Analytics**: Daily summaries and trends.

## Architecture

- **Append-only**: No historical data mutation. Corrections are new rows.
- **Single User**: No auth theater.
- **Modular**: Clean domain boundaries in backend.
