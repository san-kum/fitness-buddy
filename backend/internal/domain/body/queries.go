package body

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

func (r *Repository) CreateMetric(ctx context.Context, userID int, recordedAt time.Time, weight *float64, bodyFat *float64) (*BodyMetric, error) {
	query := `
        INSERT INTO body_metrics (user_id, recorded_at, weight_kg, body_fat_percent)
        VALUES ($1, $2, $3, $4)
        RETURNING id, created_at
    `
	var bm BodyMetric
	bm.UserID = userID
	bm.RecordedAt = recordedAt
	bm.WeightKG = weight
	bm.BodyFatPercent = bodyFat
	err := r.db.Pool.QueryRowContext(ctx, query, userID, recordedAt, weight, bodyFat).Scan(&bm.ID, &bm.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &bm, nil
}

func (r *Repository) ListMetrics(ctx context.Context, userID, limit int) ([]BodyMetric, error) {
	query := `
        SELECT id, recorded_at, weight_kg, body_fat_percent, created_at
        FROM body_metrics
        WHERE user_id = $1
        ORDER BY recorded_at DESC
        LIMIT $2
    `
	rows, err := r.db.Pool.QueryContext(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	metrics := []BodyMetric{}
	for rows.Next() {
		var bm BodyMetric
		bm.UserID = userID
		if err := rows.Scan(&bm.ID, &bm.RecordedAt, &bm.WeightKG, &bm.BodyFatPercent, &bm.CreatedAt); err != nil {
			return nil, err
		}
		metrics = append(metrics, bm)
	}
	return metrics, nil
}
