package analytics

import (
	"context"
	"fitness-buddy/internal/database"
	"time"
)

type Repository struct {
	db *database.DB
}

func NewRepository(db *database.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetDailySummaries(ctx context.Context, userID int, startDate, endDate time.Time) ([]DailySummary, error) {
    query := `
        WITH RECURSIVE dates(day) AS (
            SELECT date(?) 
            UNION ALL
            SELECT date(day, '+1 day')
            FROM dates
            WHERE day < date(?)
        ),
        nutrition AS (
            SELECT 
                date(m.eaten_at) AS day, 
                SUM(fe.calories) AS calories,
                SUM(fe.protein_g) AS protein,
                SUM(fe.carbs_g) AS carbs,
                SUM(fe.fat_g) AS fat
            FROM meals m
            JOIN food_entries fe ON m.id = fe.meal_id
            WHERE m.user_id = ?
            GROUP BY 1
        ),
        running AS (
            SELECT 
                date(start_time) AS day, 
                SUM(distance_meters) AS distance,
                SUM(distance_meters / 1000.0 * 70 * 1.036) AS calories -- Fallback to 70kg if weight missing
            FROM runs
            WHERE user_id = ?
            GROUP BY 1
        ),
        lifting AS (
            SELECT 
                date(ws.start_time) AS day, 
                SUM(s.weight_kg * s.reps) AS volume,
                SUM(6 * (strftime('%s', ws.end_time) - strftime('%s', ws.start_time)) / 60.0) AS calories
            FROM workout_sessions ws
            JOIN workout_sets s ON ws.id = s.session_id
            WHERE ws.user_id = ? AND ws.end_time IS NOT NULL
            GROUP BY 1
        ),
        water AS (
            SELECT 
                date(recorded_at) AS day,
                SUM(amount_ml) AS total_ml
            FROM water_logs
            WHERE user_id = ?
            GROUP BY 1
        ),
        body AS (
            SELECT 
                date(recorded_at) AS day,
                weight_kg
            FROM body_metrics
            WHERE user_id = ?
            GROUP BY 1 -- Simplified: get one weight per day
        )
        SELECT 
            d.day,
            COALESCE(n.calories, 0),
            COALESCE(n.protein, 0),
            COALESCE(n.carbs, 0),
            COALESCE(n.fat, 0),
            COALESCE(r.distance, 0),
            COALESCE(l.volume, 0),
            COALESCE(r.calories, 0) + COALESCE(l.calories, 0),
            COALESCE(w.total_ml, 0),
            COALESCE(b.weight_kg, 0)
        FROM dates d
        LEFT JOIN nutrition n ON d.day = n.day
        LEFT JOIN running r ON d.day = r.day
        LEFT JOIN lifting l ON d.day = l.day
        LEFT JOIN water w ON d.day = w.day
        LEFT JOIN body b ON d.day = b.day
        ORDER BY d.day DESC
    `
    
    rows, err := r.db.Pool.QueryContext(ctx, query, startDate, endDate, userID, userID, userID, userID, userID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    summaries := []DailySummary{}
    for rows.Next() {
        var s DailySummary
        if err := rows.Scan(&s.Date, &s.TotalCalories, &s.TotalProtein, &s.TotalCarbs, &s.TotalFat, &s.RunDistance, &s.WorkoutVolumeKG, &s.ExerciseCalories, &s.WaterML, &s.WeightKG); err != nil {
            return nil, err
        }
        summaries = append(summaries, s)
    }
    return summaries, nil
}