-- Identity
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    height_cm REAL,
    dob TEXT, -- ISO8601
    sex TEXT CHECK (sex IN ('M', 'F', 'Other')),
    activity_level TEXT DEFAULT 'Sedentary',
    weight_goal TEXT DEFAULT 'Maintain',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Resistance Training
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    equipment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workout_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workout_sets (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    set_order INTEGER NOT NULL,
    weight_kg REAL NOT NULL,
    reps INTEGER NOT NULL,
    rpe REAL,
    performed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Running
CREATE TABLE IF NOT EXISTS runs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    start_time TIMESTAMPTZ NOT NULL,
    duration_seconds INTEGER NOT NULL,
    distance_meters REAL NOT NULL,
    elevation_gain_meters REAL DEFAULT 0,
    avg_heart_rate INTEGER,
    notes TEXT,
    external_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Nutrition
CREATE TABLE IF NOT EXISTS meals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT,
    eaten_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS food_entries (
    id SERIAL PRIMARY KEY,
    meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein_g REAL NOT NULL DEFAULT 0,
    carbs_g REAL NOT NULL DEFAULT 0,
    fat_g REAL NOT NULL DEFAULT 0,
    quantity TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Body Metrics
CREATE TABLE IF NOT EXISTS body_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    recorded_at TIMESTAMPTZ NOT NULL,
    weight_kg REAL,
    body_fat_percent REAL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_start ON workout_sessions(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_workout_sets_session ON workout_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_runs_user_start ON runs(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_meals_user_eaten ON meals(user_id, eaten_at);
CREATE INDEX IF NOT EXISTS idx_body_metrics_user_recorded ON body_metrics(user_id, recorded_at);