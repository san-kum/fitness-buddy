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
	query := `SELECT id, name, email, google_id, phone_number, firebase_uid, height_cm, dob, sex, activity_level, weight_goal, created_at, updated_at FROM users WHERE id = ?`
	row := r.db.Pool.QueryRowContext(ctx, query, userID)

	var u User
	err := row.Scan(&u.ID, &u.Name, &u.Email, &u.GoogleID, &u.PhoneNumber, &u.FirebaseUID, &u.HeightCM, &u.DOB, &u.Sex, &u.ActivityLevel, &u.WeightGoal, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) GetOrCreateUserByGoogleID(ctx context.Context, googleID, email, name string) (*User, error) {
	query := `SELECT id, name, email, google_id, phone_number, firebase_uid, height_cm, dob, sex, activity_level, weight_goal, created_at, updated_at FROM users WHERE google_id = ?`
	row := r.db.Pool.QueryRowContext(ctx, query, googleID)

	var u User
	err := row.Scan(&u.ID, &u.Name, &u.Email, &u.GoogleID, &u.PhoneNumber, &u.FirebaseUID, &u.HeightCM, &u.DOB, &u.Sex, &u.ActivityLevel, &u.WeightGoal, &u.CreatedAt, &u.UpdatedAt)
	if err == nil {
		return &u, nil
	}

	// Create new user if not found
	insertQuery := `INSERT INTO users (name, email, google_id) VALUES (?, ?, ?)`
	res, err := r.db.Pool.ExecContext(ctx, insertQuery, name, email, googleID)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return r.GetUserByID(ctx, int(id))
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
	query := `SELECT id, name, email, google_id, phone_number, firebase_uid, height_cm, dob, sex, activity_level, weight_goal, created_at, updated_at FROM users WHERE id = ?`
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
	query := `SELECT id, name, email, google_id, phone_number, firebase_uid, height_cm, dob, sex, activity_level, weight_goal, created_at, updated_at FROM users WHERE firebase_uid = ?`
	row := r.db.Pool.QueryRowContext(ctx, query, firebaseUID)

	var u User
	err := row.Scan(&u.ID, &u.Name, &u.Email, &u.GoogleID, &u.PhoneNumber, &u.FirebaseUID, &u.HeightCM, &u.DOB, &u.Sex, &u.ActivityLevel, &u.WeightGoal, &u.CreatedAt, &u.UpdatedAt)
	if err == nil {
		return &u, nil
	}

	// Try to find by phone number
	query = `SELECT id, name, email, google_id, phone_number, firebase_uid, height_cm, dob, sex, activity_level, weight_goal, created_at, updated_at FROM users WHERE phone_number = ?`
	row = r.db.Pool.QueryRowContext(ctx, query, phoneNumber)
	err = row.Scan(&u.ID, &u.Name, &u.Email, &u.GoogleID, &u.PhoneNumber, &u.FirebaseUID, &u.HeightCM, &u.DOB, &u.Sex, &u.ActivityLevel, &u.WeightGoal, &u.CreatedAt, &u.UpdatedAt)
	if err == nil {
		// Update firebase_uid if not set
		if u.FirebaseUID == nil {
			_, _ = r.db.Pool.ExecContext(ctx, `UPDATE users SET firebase_uid = ? WHERE id = ?`, firebaseUID, u.ID)
		}
		return &u, nil
	}

	// Create new user
	useName := name
	if useName == "" {
		useName = "User"
	}
	insertQuery := `INSERT INTO users (name, phone_number, firebase_uid) VALUES (?, ?, ?)`
	res, err := r.db.Pool.ExecContext(ctx, insertQuery, useName, phoneNumber, firebaseUID)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return r.GetUserByID(ctx, int(id))
}
