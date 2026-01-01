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

func (r *Repository) GetUser(ctx context.Context, userID int) (*User, error) {
	query := `SELECT id, name, email, google_id, phone_number, firebase_uid, height_cm, dob, sex, activity_level, weight_goal, created_at, updated_at FROM users WHERE id = $1`
	row := r.db.Pool.QueryRowContext(ctx, query, userID)

	var u User
	err := row.Scan(&u.ID, &u.Name, &u.Email, &u.GoogleID, &u.PhoneNumber, &u.FirebaseUID, &u.HeightCM, &u.DOB, &u.Sex, &u.ActivityLevel, &u.WeightGoal, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) GetOrCreateUserByGoogleID(ctx context.Context, googleID, email, name string) (*User, error) {
	query := `SELECT id, name, email, google_id, phone_number, firebase_uid, height_cm, dob, sex, activity_level, weight_goal, created_at, updated_at FROM users WHERE google_id = $1`
	row := r.db.Pool.QueryRowContext(ctx, query, googleID)

	var u User
	err := row.Scan(&u.ID, &u.Name, &u.Email, &u.GoogleID, &u.PhoneNumber, &u.FirebaseUID, &u.HeightCM, &u.DOB, &u.Sex, &u.ActivityLevel, &u.WeightGoal, &u.CreatedAt, &u.UpdatedAt)
	if err == nil {
		return &u, nil
	}

	// Create new user if not found - use RETURNING for PostgreSQL
	var newID int
	insertQuery := `INSERT INTO users (name, email, google_id) VALUES ($1, $2, $3) RETURNING id`
	err = r.db.Pool.QueryRowContext(ctx, insertQuery, name, email, googleID).Scan(&newID)
	if err != nil {
		return nil, err
	}

	return r.GetUserByID(ctx, newID)
}

func (r *Repository) CreateUser(ctx context.Context, name string, height *float64, dob *string, sex *string, activity *string, goal *string) (*User, error) {
	var newID int
	query := `INSERT INTO users (name, height_cm, dob, sex, activity_level, weight_goal) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
	err := r.db.Pool.QueryRowContext(ctx, query, name, height, dob, sex, activity, goal).Scan(&newID)
	if err != nil {
		return nil, err
	}

	return r.GetUserByID(ctx, newID)
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

	query := `UPDATE users SET name = $1, height_cm = $2, dob = $3, sex = $4, activity_level = $5, weight_goal = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7`
	_, err = r.db.Pool.ExecContext(ctx, query, newName, newHeight, newDob, newSex, newActivity, newGoal, id)
	if err != nil {
		return nil, err
	}
	return r.GetUserByID(ctx, id)
}

func (r *Repository) GetUserByID(ctx context.Context, id int) (*User, error) {
	query := `SELECT id, name, email, google_id, phone_number, firebase_uid, height_cm, dob, sex, activity_level, weight_goal, created_at, updated_at FROM users WHERE id = $1`
	row := r.db.Pool.QueryRowContext(ctx, query, id)

	var u User
	err := row.Scan(&u.ID, &u.Name, &u.Email, &u.GoogleID, &u.PhoneNumber, &u.FirebaseUID, &u.HeightCM, &u.DOB, &u.Sex, &u.ActivityLevel, &u.WeightGoal, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) GetOrCreateUserByPhone(ctx context.Context, phoneNumber, firebaseUID, name string) (*User, error) {
	// Try to find by Firebase UID first
	query := `SELECT id, name, email, google_id, phone_number, firebase_uid, height_cm, dob, sex, activity_level, weight_goal, created_at, updated_at FROM users WHERE firebase_uid = $1`
	row := r.db.Pool.QueryRowContext(ctx, query, firebaseUID)

	var u User
	err := row.Scan(&u.ID, &u.Name, &u.Email, &u.GoogleID, &u.PhoneNumber, &u.FirebaseUID, &u.HeightCM, &u.DOB, &u.Sex, &u.ActivityLevel, &u.WeightGoal, &u.CreatedAt, &u.UpdatedAt)
	if err == nil {
		return &u, nil
	}

	// Try to find by phone number
	query = `SELECT id, name, email, google_id, phone_number, firebase_uid, height_cm, dob, sex, activity_level, weight_goal, created_at, updated_at FROM users WHERE phone_number = $1`
	row = r.db.Pool.QueryRowContext(ctx, query, phoneNumber)
	err = row.Scan(&u.ID, &u.Name, &u.Email, &u.GoogleID, &u.PhoneNumber, &u.FirebaseUID, &u.HeightCM, &u.DOB, &u.Sex, &u.ActivityLevel, &u.WeightGoal, &u.CreatedAt, &u.UpdatedAt)
	if err == nil {
		// Update firebase_uid if not set
		if u.FirebaseUID == nil {
			_, _ = r.db.Pool.ExecContext(ctx, `UPDATE users SET firebase_uid = $1 WHERE id = $2`, firebaseUID, u.ID)
		}
		return &u, nil
	}

	// Create new user
	useName := name
	if useName == "" {
		useName = "User"
	}
	var newID int
	insertQuery := `INSERT INTO users (name, phone_number, firebase_uid) VALUES ($1, $2, $3) RETURNING id`
	err = r.db.Pool.QueryRowContext(ctx, insertQuery, useName, phoneNumber, firebaseUID).Scan(&newID)
	if err != nil {
		return nil, err
	}

	return r.GetUserByID(ctx, newID)
}
