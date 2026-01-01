package resistance

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

func (r *Repository) ListExercises(ctx context.Context) ([]Exercise, error) {
	query := `SELECT id, name, category, equipment, created_at FROM exercises ORDER BY name ASC`
	rows, err := r.db.Pool.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	exercises := []Exercise{}
	for rows.Next() {
		var e Exercise
		if err := rows.Scan(&e.ID, &e.Name, &e.Category, &e.Equipment, &e.CreatedAt); err != nil {
			return nil, err
		}
		exercises = append(exercises, e)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *Repository) CreateExercise(ctx context.Context, name, category string, equipment *string) (*Exercise, error) {
	query := `INSERT INTO exercises (name, category, equipment) VALUES ($1, $2, $3) RETURNING id, created_at`
	var e Exercise
	e.Name = name
	e.Category = category
	e.Equipment = equipment
	err := r.db.Pool.QueryRowContext(ctx, query, name, category, equipment).Scan(&e.ID, &e.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *Repository) CreateSession(ctx context.Context, userID int, startTime time.Time, notes *string) (*WorkoutSession, error) {
	query := `INSERT INTO workout_sessions (user_id, start_time, notes) VALUES ($1, $2, $3) RETURNING id, created_at`
	var s WorkoutSession
	s.UserID = userID
	s.StartTime = startTime
	s.Notes = notes
	err := r.db.Pool.QueryRowContext(ctx, query, userID, startTime, notes).Scan(&s.ID, &s.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *Repository) FinishSession(ctx context.Context, id int, endTime time.Time) error {
	query := `UPDATE workout_sessions SET end_time = $1 WHERE id = $2`
	_, err := r.db.Pool.ExecContext(ctx, query, endTime, id)
	return err
}

func (r *Repository) AddSet(ctx context.Context, sessionID, exerciseID int, weight float64, reps int, rpe *float64, performedAt time.Time) (*WorkoutSet, error) {
	countQuery := `SELECT COUNT(*) FROM workout_sets WHERE session_id = $1`
	var count int
	if err := r.db.Pool.QueryRowContext(ctx, countQuery, sessionID).Scan(&count); err != nil {
		return nil, err
	}
	setOrder := count + 1

	query := `
        INSERT INTO workout_sets (session_id, exercise_id, set_order, weight_kg, reps, rpe, performed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at
    `
	var s WorkoutSet
	s.SessionID = sessionID
	s.ExerciseID = exerciseID
	s.SetOrder = setOrder
	s.WeightKG = weight
	s.Reps = reps
	s.RPE = rpe
	s.PerformedAt = performedAt

	err := r.db.Pool.QueryRowContext(ctx, query, sessionID, exerciseID, setOrder, weight, reps, rpe, performedAt).Scan(&s.ID, &s.CreatedAt)
	if err != nil {
		return nil, err
	}

	return &s, nil
}

func (r *Repository) ListSessions(ctx context.Context, userID int, limit int) ([]WorkoutSession, error) {
	query := `
        SELECT id, start_time, end_time, notes, created_at
        FROM workout_sessions
        WHERE user_id = $1
        ORDER BY start_time DESC
        LIMIT $2
    `
	rows, err := r.db.Pool.QueryContext(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	sessions := []WorkoutSession{}
	for rows.Next() {
		var s WorkoutSession
		s.UserID = userID
		if err := rows.Scan(&s.ID, &s.StartTime, &s.EndTime, &s.Notes, &s.CreatedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return sessions, nil
}

func (r *Repository) CreateRoutine(ctx context.Context, userID int, name string, notes *string, exerciseIDs []int) (*Routine, error) {
	tx, err := r.db.Pool.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Create Routine
	var routineID int
	err = tx.QueryRowContext(ctx, "INSERT INTO routines (user_id, name, notes) VALUES ($1, $2, $3) RETURNING id", userID, name, notes).Scan(&routineID)
	if err != nil {
		return nil, err
	}

	// Add Exercises
	for i, exID := range exerciseIDs {
		_, err := tx.ExecContext(ctx, "INSERT INTO routine_exercises (routine_id, exercise_id, exercise_order) VALUES ($1, $2, $3)", routineID, exID, i+1)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return r.GetRoutine(ctx, routineID)
}

func (r *Repository) ListRoutines(ctx context.Context, userID int) ([]Routine, error) {
	query := `SELECT id, name, notes, created_at FROM routines WHERE user_id = $1 ORDER BY name ASC`
	rows, err := r.db.Pool.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	routines := []Routine{}
	for rows.Next() {
		var rt Routine
		rt.UserID = userID
		if err := rows.Scan(&rt.ID, &rt.Name, &rt.Notes, &rt.CreatedAt); err != nil {
			return nil, err
		}
		routines = append(routines, rt)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	for i := range routines {
		exs, err := r.GetRoutineExercises(ctx, routines[i].ID)
		if err == nil {
			routines[i].Exercises = exs
		}
	}

	return routines, nil
}

func (r *Repository) GetRoutine(ctx context.Context, id int) (*Routine, error) {
	var rt Routine
	err := r.db.Pool.QueryRowContext(ctx, "SELECT id, user_id, name, notes, created_at FROM routines WHERE id = $1", id).Scan(&rt.ID, &rt.UserID, &rt.Name, &rt.Notes, &rt.CreatedAt)
	if err != nil {
		return nil, err
	}

	rt.Exercises, _ = r.GetRoutineExercises(ctx, id)
	return &rt, nil
}

func (r *Repository) GetRoutineExercises(ctx context.Context, routineID int) ([]RoutineExercise, error) {
	query := `
        SELECT re.id, re.routine_id, re.exercise_id, e.name, re.exercise_order 
        FROM routine_exercises re
        JOIN exercises e ON re.exercise_id = e.id
        WHERE re.routine_id = $1
        ORDER BY re.exercise_order ASC
    `
	rows, err := r.db.Pool.QueryContext(ctx, query, routineID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	exs := []RoutineExercise{}
	for rows.Next() {
		var re RoutineExercise
		if err := rows.Scan(&re.ID, &re.RoutineID, &re.ExerciseID, &re.ExerciseName, &re.ExerciseOrder); err != nil {
			return nil, err
		}
		exs = append(exs, re)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return exs, nil
}

func (r *Repository) GetSetsForSession(ctx context.Context, sessionID int) ([]WorkoutSet, error) {
	query := `
        SELECT s.id, s.session_id, s.exercise_id, e.name, s.set_order, s.weight_kg, s.reps, s.rpe, s.performed_at, s.created_at
        FROM workout_sets s
        JOIN exercises e ON s.exercise_id = e.id
        WHERE s.session_id = $1
        ORDER BY s.set_order ASC
    `
	rows, err := r.db.Pool.QueryContext(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	sets := []WorkoutSet{}
	for rows.Next() {
		var s WorkoutSet
		if err := rows.Scan(&s.ID, &s.SessionID, &s.ExerciseID, &s.ExerciseName, &s.SetOrder, &s.WeightKG, &s.Reps, &s.RPE, &s.PerformedAt, &s.CreatedAt); err != nil {
			return nil, err
		}
		sets = append(sets, s)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return sets, nil
}

func (r *Repository) UpdateSet(ctx context.Context, setID int, weight float64, reps int, rpe *float64) error {
	query := `UPDATE workout_sets SET weight_kg = $1, reps = $2, rpe = $3 WHERE id = $4`
	_, err := r.db.Pool.ExecContext(ctx, query, weight, reps, rpe, setID)
	return err
}

func (r *Repository) DeleteSet(ctx context.Context, setID int) error {
	query := `DELETE FROM workout_sets WHERE id = $1`
	_, err := r.db.Pool.ExecContext(ctx, query, setID)
	return err
}

func (r *Repository) DeleteRoutine(ctx context.Context, id int) error {
	_, err := r.db.Pool.ExecContext(ctx, "DELETE FROM routines WHERE id = $1", id)
	return err
}

func (r *Repository) DeleteSession(ctx context.Context, id int) error {
	_, err := r.db.Pool.ExecContext(ctx, "DELETE FROM workout_sessions WHERE id = $1", id)
	return err
}
