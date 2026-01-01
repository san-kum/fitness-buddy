package nutrition

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
    "fitness-buddy/internal/auth"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/meals", h.ListMeals)
	r.Post("/meals", h.CreateMeal)
	r.Put("/meals/{id}", h.UpdateMeal)
	r.Delete("/meals/{id}", h.DeleteMeal)
	r.Post("/meals/{id}/entries", h.AddFoodEntry)
	r.Delete("/meals/entries/{id}", h.DeleteFoodEntry)
	r.Get("/nutrition/library", h.ListFoodLibrary)
	r.Post("/nutrition/library", h.CreateFoodLibraryItem)
    r.Post("/nutrition/water", h.LogWater)
}

func (h *Handler) LogWater(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Amount int `json:"amount_ml"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    userID := auth.GetUserID(r.Context())
    if err := h.repo.LogWater(r.Context(), userID, req.Amount); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    w.WriteHeader(http.StatusOK)
}

func (h *Handler) UpdateMeal(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)

	var req struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.repo.UpdateMeal(r.Context(), id, req.Name); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) DeleteMeal(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)
	if err := h.repo.DeleteMeal(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) DeleteFoodEntry(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)
	if err := h.repo.DeleteFoodEntry(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) ListMeals(w http.ResponseWriter, r *http.Request) {
    userID := auth.GetUserID(r.Context())
	meals, err := h.repo.ListMeals(r.Context(), userID, 20)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for i := range meals {
		entries, err := h.repo.GetEntriesForMeal(r.Context(), meals[i].ID)
		if err == nil {
			meals[i].Entries = entries
		}
	}

	json.NewEncoder(w).Encode(meals)
}

type CreateMealRequest struct {
	Name    *string   `json:"name"`
	EatenAt time.Time `json:"eaten_at"`
}

func (h *Handler) CreateMeal(w http.ResponseWriter, r *http.Request) {
	var req CreateMealRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req.EatenAt = time.Now()
	}
	if req.EatenAt.IsZero() {
		req.EatenAt = time.Now()
	}

    userID := auth.GetUserID(r.Context())
	m, err := h.repo.CreateMeal(r.Context(), userID, req.Name, req.EatenAt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(m)
}

type AddFoodEntryRequest struct {
	Name     string  `json:"name"`
	Calories int     `json:"calories"`
	ProteinG float64 `json:"protein_g"`
	CarbsG   float64 `json:"carbs_g"`
	FatG     float64 `json:"fat_g"`
	Quantity *string `json:"quantity"`
}

func (h *Handler) AddFoodEntry(w http.ResponseWriter, r *http.Request) {
	mealIDStr := chi.URLParam(r, "id")
	mealID, _ := strconv.Atoi(mealIDStr)

	var req AddFoodEntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	fe, err := h.repo.AddFoodEntry(r.Context(), mealID, req.Name, req.Calories, req.ProteinG, req.CarbsG, req.FatG, req.Quantity)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(fe)
}

func (h *Handler) ListFoodLibrary(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.ListFoodLibrary(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(items)
}

func (h *Handler) CreateFoodLibraryItem(w http.ResponseWriter, r *http.Request) {
	var item FoodLibraryItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	newItem, err := h.repo.CreateFoodLibraryItem(r.Context(), item)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(newItem)
}