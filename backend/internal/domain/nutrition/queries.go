package nutrition

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

func (r *Repository) CreateMeal(ctx context.Context, userID int, name *string, eatenAt time.Time) (*Meal, error) {
	query := `INSERT INTO meals (user_id, name, eaten_at) VALUES (?, ?, ?)`
	res, err := r.db.Pool.ExecContext(ctx, query, userID, name, eatenAt)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	var m Meal
	m.ID = int(id)
	m.UserID = userID
	m.Name = name
	m.EatenAt = eatenAt
	err = r.db.Pool.QueryRowContext(ctx, "SELECT created_at FROM meals WHERE id = ?", id).Scan(&m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *Repository) AddFoodEntry(ctx context.Context, mealID int, name string, cals int, p, c, f float64, qty *string) (*FoodEntry, error) {
	query := `
        INSERT INTO food_entries (meal_id, name, calories, protein_g, carbs_g, fat_g, quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `
	res, err := r.db.Pool.ExecContext(ctx, query, mealID, name, cals, p, c, f, qty)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	var fe FoodEntry
	fe.ID = int(id)
	fe.MealID = mealID
	fe.Name = name
	fe.Calories = cals
	fe.ProteinG = p
	fe.CarbsG = c
	fe.FatG = f
	fe.Quantity = qty
	err = r.db.Pool.QueryRowContext(ctx, "SELECT created_at FROM food_entries WHERE id = ?", id).Scan(&fe.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &fe, nil
}

func (r *Repository) ListMeals(ctx context.Context, userID, limit int) ([]Meal, error) {
	query := `
        SELECT id, name, eaten_at, created_at
        FROM meals
        WHERE user_id = ?
        ORDER BY eaten_at DESC
        LIMIT ?
    `
	rows, err := r.db.Pool.QueryContext(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	meals := []Meal{}
	for rows.Next() {
		var m Meal
		m.UserID = userID
		if err := rows.Scan(&m.ID, &m.Name, &m.EatenAt, &m.CreatedAt); err != nil {
			return nil, err
		}
		meals = append(meals, m)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return meals, nil
}

func (r *Repository) GetEntriesForMeal(ctx context.Context, mealID int) ([]FoodEntry, error) {
	query := `
        SELECT id, meal_id, name, calories, protein_g, carbs_g, fat_g, quantity, created_at
        FROM food_entries
        WHERE meal_id = ?
        ORDER BY id ASC
    `
	rows, err := r.db.Pool.QueryContext(ctx, query, mealID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	entries := []FoodEntry{}
	for rows.Next() {
		var fe FoodEntry
		if err := rows.Scan(&fe.ID, &fe.MealID, &fe.Name, &fe.Calories, &fe.ProteinG, &fe.CarbsG, &fe.FatG, &fe.Quantity, &fe.CreatedAt); err != nil {
			return nil, err
		}
		entries = append(entries, fe)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return entries, nil
}

func (r *Repository) DeleteMeal(ctx context.Context, mealID int) error {
	_, err := r.db.Pool.ExecContext(ctx, "DELETE FROM meals WHERE id = ?", mealID)
	return err
}

func (r *Repository) DeleteFoodEntry(ctx context.Context, entryID int) error {
	_, err := r.db.Pool.ExecContext(ctx, "DELETE FROM food_entries WHERE id = ?", entryID)
	return err
}

func (r *Repository) UpdateMeal(ctx context.Context, mealID int, name string) error {
	_, err := r.db.Pool.ExecContext(ctx, "UPDATE meals SET name = ? WHERE id = ?", name, mealID)
	return err
}

func (r *Repository) ListFoodLibrary(ctx context.Context) ([]FoodLibraryItem, error) {
	query := `SELECT id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, created_at FROM food_library ORDER BY name ASC`
	rows, err := r.db.Pool.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []FoodLibraryItem{}
	for rows.Next() {
		var i FoodLibraryItem
		if err := rows.Scan(&i.ID, &i.Name, &i.CaloriesPer100g, &i.ProteinPer100g, &i.CarbsPer100g, &i.FatPer100g, &i.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *Repository) CreateFoodLibraryItem(ctx context.Context, item FoodLibraryItem) (*FoodLibraryItem, error) {
	query := `INSERT INTO food_library (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES (?, ?, ?, ?, ?)`
	res, err := r.db.Pool.ExecContext(ctx, query, item.Name, item.CaloriesPer100g, item.ProteinPer100g, item.CarbsPer100g, item.FatPer100g)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	item.ID = int(id)
	return &item, nil
}

func (r *Repository) LogWater(ctx context.Context, userID int, amount int) error {
	_, err := r.db.Pool.ExecContext(ctx, "INSERT INTO water_logs (user_id, amount_ml) VALUES (?, ?)", userID, amount)
	return err
}

func (r *Repository) GetWaterForDay(ctx context.Context, userID int, day string) (int, error) {
	var total int
	err := r.db.Pool.QueryRowContext(ctx, "SELECT COALESCE(SUM(amount_ml), 0) FROM water_logs WHERE user_id = ? AND date(recorded_at) = ?", userID, day).Scan(&total)
	return total, err
}
