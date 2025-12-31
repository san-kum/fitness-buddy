package nutrition

import (
	"time"
)

type Meal struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Name      *string   `json:"name"`
	EatenAt   time.Time `json:"eaten_at"`
	CreatedAt time.Time `json:"created_at"`
    
    // Derived
    Entries   []FoodEntry `json:"entries,omitempty"`
}

type FoodEntry struct {
	ID        int       `json:"id"`
	MealID    int       `json:"meal_id"`
	Name      string    `json:"name"`
	Calories  int       `json:"calories"`
	ProteinG  float64   `json:"protein_g"`
	CarbsG    float64   `json:"carbs_g"`
	FatG      float64   `json:"fat_g"`
	Quantity  *string   `json:"quantity"`
	CreatedAt time.Time `json:"created_at"`
}

type FoodLibraryItem struct {
	ID              int       `json:"id"`
	Name            string    `json:"name"`
	CaloriesPer100g float64   `json:"calories_per_100g"`
	ProteinPer100g  float64   `json:"protein_per_100g"`
	CarbsPer100g    float64   `json:"carbs_per_100g"`
	FatPer100g      float64   `json:"fat_per_100g"`
	CreatedAt       time.Time `json:"created_at"`
}

type WaterLog struct {
    ID         int       `json:"id"`
    UserID     int       `json:"user_id"`
    AmountML   int       `json:"amount_ml"`
    RecordedAt time.Time `json:"recorded_at"`
}
