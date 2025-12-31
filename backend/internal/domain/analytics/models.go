package analytics

type DailySummary struct {
    Date             string  `json:"date"` // YYYY-MM-DD
    TotalCalories    int     `json:"total_calories"`
    TotalProtein     float64 `json:"total_protein"`
    TotalCarbs       float64 `json:"total_carbs"`
    TotalFat         float64 `json:"total_fat"`
    RunDistance      float64 `json:"run_distance"`
    WorkoutVolumeKG  float64 `json:"workout_volume_kg"`
    ExerciseCalories int     `json:"exercise_calories"`
    WaterML          int     `json:"water_ml"`
    WeightKG         float64 `json:"weight_kg"`
}

type WeeklySummary struct {
    WeekStart       string  `json:"week_start"` // YYYY-MM-DD
    TotalDistance   float64 `json:"total_distance"`
    TotalVolumeKG   float64 `json:"total_volume_kg"`
    AvgCalories     int     `json:"avg_calories"`
}
