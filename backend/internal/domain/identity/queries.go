package identity

import (
	"context"
	"fitness-buddy/internal/database"
)

type Repository struct {
	db *database.DB
}

func NewRepository(db *database.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetUser(ctx context.Context) (*User, error) {
	query := `SELECT id, name, height_cm, dob, sex, activity_level, weight_goal, created_at, updated_at FROM users ORDER BY id LIMIT 1`
	row := r.db.Pool.QueryRowContext(ctx, query)

	var u User
	err := row.Scan(&u.ID, &u.Name, &u.HeightCM, &u.DOB, &u.Sex, &u.ActivityLevel, &u.WeightGoal, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) CreateUser(ctx context.Context, name string, height *float64, dob *string, sex *string, activity *string, goal *string) (*User, error) {
	query := `INSERT INTO users (name, height_cm, dob, sex, activity_level, weight_goal) VALUES (?, ?, ?, ?, ?, ?)`
	res, err := r.db.Pool.ExecContext(ctx, query, name, height, dob, sex, activity, goal)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return r.GetUserByID(ctx, int(id))
}

func (r *Repository) UpdateUser(ctx context.Context, id int, name string, height *float64, dob *string, sex *string, activity *string, goal *string) (*User, error) {
    current, err := r.GetUserByID(ctx, id)
    if err != nil {
        return nil, err
    }
    
    newName := current.Name
    if name != "" {
        newName = name
    }
    
    newHeight := current.HeightCM
    if height != nil {
        newHeight = height
    }
    
    newDob := current.DOB
    if dob != nil {
        newDob = dob
    }
    
    newSex := current.Sex
    if sex != nil {
        newSex = sex
    }

    newActivity := current.ActivityLevel
    if activity != nil {
        newActivity = activity
    }

    newGoal := current.WeightGoal
    if goal != nil {
        newGoal = goal
    }

	query := `UPDATE users SET name = ?, height_cm = ?, dob = ?, sex = ?, activity_level = ?, weight_goal = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
	_, err = r.db.Pool.ExecContext(ctx, query, newName, newHeight, newDob, newSex, newActivity, newGoal, id)
	if err != nil {
		return nil, err
	}
	return r.GetUserByID(ctx, id)
}

func (r *Repository) GetUserByID(ctx context.Context, id int) (*User, error) {
	query := `SELECT id, name, height_cm, dob, sex, activity_level, weight_goal, created_at, updated_at FROM users WHERE id = ?`
	row := r.db.Pool.QueryRowContext(ctx, query, id)

	var u User
	err := row.Scan(&u.ID, &u.Name, &u.HeightCM, &u.DOB, &u.Sex, &u.ActivityLevel, &u.WeightGoal, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}
