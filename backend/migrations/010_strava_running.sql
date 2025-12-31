-- Strava-like Running Expansion
ALTER TABLE runs ADD COLUMN cadence INTEGER;
ALTER TABLE runs ADD COLUMN relative_effort INTEGER; -- 1-10 scale
ALTER TABLE runs ADD COLUMN shoe_id INTEGER;

CREATE TABLE IF NOT EXISTS shoes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);