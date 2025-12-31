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
	return exercises, nil
}

func (r *Repository) CreateExercise(ctx context.Context, name, category string, equipment *string) (*Exercise, error) {
	query := `INSERT INTO exercises (name, category, equipment) VALUES (?, ?, ?)`
	res, err := r.db.Pool.ExecContext(ctx, query, name, category, equipment)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

    // SQLite doesn't return created_at easily without fetch.
    // Let's just create the struct manually with current time or fetch.
    // Fetch is safer for DB truth.
    
    var e Exercise
    e.ID = int(id)
    e.Name = name
    e.Category = category
    e.Equipment = equipment
    // Fetch created_at
    err = r.db.Pool.QueryRowContext(ctx, "SELECT created_at FROM exercises WHERE id = ?", id).Scan(&e.CreatedAt)
    if err != nil {
        return nil, err
    }
	return &e, nil
}

func (r *Repository) CreateSession(ctx context.Context, userID int, startTime time.Time, notes *string) (*WorkoutSession, error) {
	query := `INSERT INTO workout_sessions (user_id, start_time, notes) VALUES (?, ?, ?)`
	res, err := r.db.Pool.ExecContext(ctx, query, userID, startTime, notes)
	if err != nil {
		return nil, err
	}
    id, err := res.LastInsertId()
    if err != nil {
        return nil, err
    }

	var s WorkoutSession
	s.ID = int(id)
	s.UserID = userID
	s.StartTime = startTime
	s.Notes = notes
    err = r.db.Pool.QueryRowContext(ctx, "SELECT created_at FROM workout_sessions WHERE id = ?", id).Scan(&s.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *Repository) FinishSession(ctx context.Context, id int, endTime time.Time) error {
    query := `UPDATE workout_sessions SET end_time = ? WHERE id = ?`
    _, err := r.db.Pool.ExecContext(ctx, query, endTime, id)
    return err
}

func (r *Repository) AddSet(ctx context.Context, sessionID, exerciseID int, weight float64, reps int, rpe *float64, performedAt time.Time) (*WorkoutSet, error) {
    countQuery := `SELECT COUNT(*) FROM workout_sets WHERE session_id = ?`
    var count int
    if err := r.db.Pool.QueryRowContext(ctx, countQuery, sessionID).Scan(&count); err != nil {
        return nil, err
    }
    setOrder := count + 1

	query := `
        INSERT INTO workout_sets (session_id, exercise_id, set_order, weight_kg, reps, rpe, performed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `
	res, err := r.db.Pool.ExecContext(ctx, query, sessionID, exerciseID, setOrder, weight, reps, rpe, performedAt)
    if err != nil {
        return nil, err
    }
    id, err := res.LastInsertId()
    if err != nil {
        return nil, err
    }

	var s WorkoutSet
    s.ID = int(id)
	s.SessionID = sessionID
	s.ExerciseID = exerciseID
	s.SetOrder = setOrder
	s.WeightKG = weight
	s.Reps = reps
	s.RPE = rpe
	s.PerformedAt = performedAt
    
    // Fetch created_at
    err = r.db.Pool.QueryRowContext(ctx, "SELECT created_at FROM workout_sets WHERE id = ?", id).Scan(&s.CreatedAt)
    if err != nil {
        return nil, err
    }
    
	return &s, nil
}

func (r *Repository) ListSessions(ctx context.Context, userID int, limit int) ([]WorkoutSession, error) {
    query := `
        SELECT id, start_time, end_time, notes, created_at
        FROM workout_sessions
        WHERE user_id = ?
        ORDER BY start_time DESC
        LIMIT ?
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
    return sessions, nil
}

func (r *Repository) CreateRoutine(ctx context.Context, userID int, name string, notes *string, exerciseIDs []int) (*Routine, error) {
    tx, err := r.db.Pool.Begin()
    if err != nil {
        return nil, err
    }
    defer tx.Rollback()

    // Create Routine
    res, err := tx.ExecContext(ctx, "INSERT INTO routines (user_id, name, notes) VALUES (?, ?, ?)", userID, name, notes)
    if err != nil {
        return nil, err
    }
    routineID, err := res.LastInsertId()
    if err != nil {
        return nil, err
    }

    // Add Exercises
    for i, exID := range exerciseIDs {
        _, err := tx.ExecContext(ctx, "INSERT INTO routine_exercises (routine_id, exercise_id, exercise_order) VALUES (?, ?, ?)", routineID, exID, i+1)
        if err != nil {
            return nil, err
        }
    }

    if err := tx.Commit(); err != nil {
        return nil, err
    }

    return r.GetRoutine(ctx, int(routineID))
}

func (r *Repository) ListRoutines(ctx context.Context, userID int) ([]Routine, error) {
    query := `SELECT id, name, notes, created_at FROM routines WHERE user_id = ? ORDER BY name ASC`
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

    // Populate exercises for each routine? Or separate fetch?
    // Efficient way: Fetch all routine_exercises for these routines.
    // Simpler: Loop and fetch (N+1 but minimal scale).
    // Let's loop.
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
    err := r.db.Pool.QueryRowContext(ctx, "SELECT id, user_id, name, notes, created_at FROM routines WHERE id = ?", id).Scan(&rt.ID, &rt.UserID, &rt.Name, &rt.Notes, &rt.CreatedAt)
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
        WHERE re.routine_id = ?
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
    return exs, nil
}

func (r *Repository) GetSetsForSession(ctx context.Context, sessionID int) ([]WorkoutSet, error) {
    query := `
        SELECT s.id, s.session_id, s.exercise_id, e.name, s.set_order, s.weight_kg, s.reps, s.rpe, s.performed_at, s.created_at
        FROM workout_sets s
        JOIN exercises e ON s.exercise_id = e.id
        WHERE s.session_id = ?
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
    return sets, nil
}

func (r *Repository) UpdateSet(ctx context.Context, setID int, weight float64, reps int, rpe *float64) error {
    query := `UPDATE workout_sets SET weight_kg = ?, reps = ?, rpe = ? WHERE id = ?`
    _, err := r.db.Pool.ExecContext(ctx, query, weight, reps, rpe, setID)
    return err
}

func (r *Repository) DeleteSet(ctx context.Context, setID int) error {
    query := `DELETE FROM workout_sets WHERE id = ?`
    _, err := r.db.Pool.ExecContext(ctx, query, setID)
    return err
}

func (r *Repository) DeleteRoutine(ctx context.Context, id int) error {
    _, err := r.db.Pool.ExecContext(ctx, "DELETE FROM routines WHERE id = ?", id)
    return err
}

func (r *Repository) DeleteSession(ctx context.Context, id int) error {
    _, err := r.db.Pool.ExecContext(ctx, "DELETE FROM workout_sessions WHERE id = ?", id)
    return err
}