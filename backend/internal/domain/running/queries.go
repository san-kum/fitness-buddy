package running

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

func (r *Repository) CreateRun(ctx context.Context, userID int, startTime time.Time, duration int, distance, elevation float64, avgHR, cadence, effort, shoeID, steps *int, routeData, runType, notes *string) (*Run, error) {
	query := `
        INSERT INTO runs (user_id, start_time, duration_seconds, distance_meters, elevation_gain_meters, avg_heart_rate, cadence, relative_effort, shoe_id, steps, route_data, run_type, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
	res, err := r.db.Pool.ExecContext(ctx, query, userID, startTime, duration, distance, elevation, avgHR, cadence, effort, shoeID, steps, routeData, runType, notes)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return r.GetRunByID(ctx, int(id))
}

func (r *Repository) GetRunByID(ctx context.Context, id int) (*Run, error) {
	query := `
        SELECT r.id, r.user_id, r.start_time, r.duration_seconds, r.distance_meters, r.elevation_gain_meters, 
               r.avg_heart_rate, r.cadence, r.relative_effort, r.shoe_id, s.brand || ' ' || s.model as shoe_name, r.steps, r.route_data, r.run_type, r.notes, r.created_at
        FROM runs r
        LEFT JOIN shoes s ON r.shoe_id = s.id
        WHERE r.id = ?
    `
	var run Run
	err := r.db.Pool.QueryRowContext(ctx, query, id).Scan(
		&run.ID, &run.UserID, &run.StartTime, &run.DurationSeconds, &run.DistanceMeters, &run.ElevationGainMeters,
		&run.AvgHeartRate, &run.Cadence, &run.RelativeEffort, &run.ShoeID, &run.ShoeName, &run.Steps, &run.RouteData, &run.RunType, &run.Notes, &run.CreatedAt,
	)
	return &run, err
}

func (r *Repository) ListRuns(ctx context.Context, userID, limit int) ([]Run, error) {
	query := `
        SELECT r.id, r.start_time, r.duration_seconds, r.distance_meters, r.elevation_gain_meters, 
               r.avg_heart_rate, r.cadence, r.relative_effort, r.shoe_id, s.brand || ' ' || s.model as shoe_name, r.steps, r.route_data, r.run_type, r.notes, r.created_at
        FROM runs r
        LEFT JOIN shoes s ON r.shoe_id = s.id
        WHERE r.user_id = ?
        ORDER BY r.start_time DESC
        LIMIT ?
    `
	rows, err := r.db.Pool.QueryContext(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	runs := []Run{}
	for rows.Next() {
		var run Run
		run.UserID = userID
		if err := rows.Scan(&run.ID, &run.StartTime, &run.DurationSeconds, &run.DistanceMeters, &run.ElevationGainMeters, &run.AvgHeartRate, &run.Cadence, &run.RelativeEffort, &run.ShoeID, &run.ShoeName, &run.Steps, &run.RouteData, &run.RunType, &run.Notes, &run.CreatedAt); err != nil {
			return nil, err
		}
		runs = append(runs, run)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return runs, nil
}

func (r *Repository) ListShoes(ctx context.Context, userID int) ([]Shoe, error) {
	rows, err := r.db.Pool.QueryContext(ctx, "SELECT id, user_id, brand, model, is_active, created_at FROM shoes WHERE user_id = ?", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	shoes := []Shoe{}
	for rows.Next() {
		var s Shoe
		if err := rows.Scan(&s.ID, &s.UserID, &s.Brand, &s.Model, &s.IsActive, &s.CreatedAt); err != nil {
			return nil, err
		}
		shoes = append(shoes, s)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return shoes, nil
}

func (r *Repository) CreateShoe(ctx context.Context, userID int, brand, model string) (*Shoe, error) {
	res, err := r.db.Pool.ExecContext(ctx, "INSERT INTO shoes (user_id, brand, model) VALUES (?, ?, ?)", userID, brand, model)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	return &Shoe{ID: int(id), UserID: userID, Brand: brand, Model: model, IsActive: true}, nil
}

func (r *Repository) DeleteRun(ctx context.Context, id int) error {
	_, err := r.db.Pool.ExecContext(ctx, "DELETE FROM runs WHERE id = ?", id)
	return err
}
