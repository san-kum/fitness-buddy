package running

import (
	"time"
)

type Run struct {
	ID                 int       `json:"id"`
	UserID             int       `json:"user_id"`
	StartTime          time.Time `json:"start_time"`
	DurationSeconds    int       `json:"duration_seconds"`
	DistanceMeters     float64   `json:"distance_meters"`
	ElevationGainMeters float64  `json:"elevation_gain_meters"`
	AvgHeartRate       *int      `json:"avg_heart_rate"`
	Cadence            *int      `json:"cadence"`
	Steps              *int      `json:"steps"`
	RelativeEffort     *int      `json:"relative_effort"`
	ShoeID             *int      `json:"shoe_id"`
	ShoeName           *string   `json:"shoe_name,omitempty"`
	Notes              *string   `json:"notes"`
	RunType            string    `json:"run_type"`
	RouteData          *string   `json:"route_data"` // JSON string of [lat, lng, alt, time]
	ExternalID         *string   `json:"external_id"`
	CreatedAt          time.Time `json:"created_at"`
}

type Shoe struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Brand     string    `json:"brand"`
	Model     string    `json:"model"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}
