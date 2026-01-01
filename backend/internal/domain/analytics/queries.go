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
        WITH dates AS (
            SELECT generate_series($1::date, $2::date, '1 day'::interval)::date AS day
        ),
        nutrition AS (
            SELECT 
                m.eaten_at::date AS day, 
                SUM(fe.calories) AS calories,
                SUM(fe.protein_g) AS protein,
                SUM(fe.carbs_g) AS carbs,
                SUM(fe.fat_g) AS fat
            FROM meals m
            JOIN food_entries fe ON m.id = fe.meal_id
            WHERE m.user_id = $3
            GROUP BY 1
        ),
        running AS (
            SELECT 
                start_time::date AS day, 
                SUM(distance_meters) AS distance,
                SUM(distance_meters / 1000.0 * 70 * 1.036) AS calories
            FROM runs
            WHERE user_id = $4
            GROUP BY 1
        ),
        lifting AS (
            SELECT 
                ws.start_time::date AS day, 
                SUM(s.weight_kg * s.reps) AS volume,
                SUM(6 * EXTRACT(EPOCH FROM (ws.end_time - ws.start_time)) / 60.0) AS calories
            FROM workout_sessions ws
            JOIN workout_sets s ON ws.id = s.session_id
            WHERE ws.user_id = $5 AND ws.end_time IS NOT NULL
            GROUP BY 1
        ),
        water AS (
            SELECT 
                recorded_at::date AS day,
                SUM(amount_ml) AS total_ml
            FROM water_logs
            WHERE user_id = $6
            GROUP BY 1
        ),
        body AS (
            SELECT DISTINCT ON (recorded_at::date)
                recorded_at::date AS day,
                weight_kg
            FROM body_metrics
            WHERE user_id = $7
            ORDER BY recorded_at::date, recorded_at DESC
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
