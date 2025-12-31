package identity

import (
	"time"
)

type User struct {
	ID            int       `json:"id"`
	Name          string    `json:"name"`
	HeightCM      *float64  `json:"height_cm"`
	DOB           *string   `json:"dob"`
	Sex           *string   `json:"sex"`
	ActivityLevel *string   `json:"activity_level"`
	WeightGoal    *string   `json:"weight_goal"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}