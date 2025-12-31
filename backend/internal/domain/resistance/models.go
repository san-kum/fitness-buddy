package resistance

import (
	"time"
)

type Exercise struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Category  string    `json:"category"`
	Equipment *string   `json:"equipment"`
	CreatedAt time.Time `json:"created_at"`
}

type WorkoutSession struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	StartTime time.Time `json:"start_time"`
	EndTime   *time.Time `json:"end_time"`
	Notes     *string   `json:"notes"`
	CreatedAt time.Time `json:"created_at"`
    
    // Derived/Joined fields for response
    Sets      []WorkoutSet `json:"sets,omitempty"`
}

type WorkoutSet struct {
	ID          int       `json:"id"`
	SessionID   int       `json:"session_id"`
	ExerciseID  int       `json:"exercise_id"`
	ExerciseName string   `json:"exercise_name,omitempty"` // For convenience
	SetOrder    int       `json:"set_order"`
	WeightKG    float64   `json:"weight_kg"`
	Reps        int       `json:"reps"`
	RPE         *float64  `json:"rpe"`
	PerformedAt time.Time `json:"performed_at"`
	CreatedAt   time.Time `json:"created_at"`
}

type Routine struct {
    ID        int               `json:"id"`
    UserID    int               `json:"user_id"`
    Name      string            `json:"name"`
    Notes     *string           `json:"notes"`
    CreatedAt time.Time         `json:"created_at"`
    Exercises []RoutineExercise `json:"exercises,omitempty"`
}

type RoutineExercise struct {
    ID            int    `json:"id"`
    RoutineID     int    `json:"routine_id"`
    ExerciseID    int    `json:"exercise_id"`
    ExerciseName  string `json:"exercise_name"` // Joined
    ExerciseOrder int    `json:"exercise_order"`
}