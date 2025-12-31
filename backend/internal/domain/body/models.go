package body

import (
	"time"
)

type BodyMetric struct {
	ID             int       `json:"id"`
	UserID         int       `json:"user_id"`
	RecordedAt     time.Time `json:"recorded_at"`
	WeightKG       *float64  `json:"weight_kg"`
	BodyFatPercent *float64  `json:"body_fat_percent"`
	CreatedAt      time.Time `json:"created_at"`
}
