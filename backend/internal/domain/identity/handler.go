package identity

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/user", h.GetUser)
	r.Post("/user", h.CreateUser)
	r.Put("/user", h.UpdateUser)
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	user, err := h.repo.GetUser(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(user)
}

type CreateUserRequest struct {
	Name          string   `json:"name"`
	HeightCM      *float64 `json:"height_cm"`
	DOB           *string  `json:"dob"`
	Sex           *string  `json:"sex"`
	ActivityLevel *string  `json:"activity_level"`
	WeightGoal    *string  `json:"weight_goal"`
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := h.repo.CreateUser(r.Context(), req.Name, req.HeightCM, req.DOB, req.Sex, req.ActivityLevel, req.WeightGoal)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(user)
}

func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
    existing, err := h.repo.GetUser(r.Context())
    if err != nil {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }

	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := h.repo.UpdateUser(r.Context(), existing.ID, req.Name, req.HeightCM, req.DOB, req.Sex, req.ActivityLevel, req.WeightGoal)
	if err != nil {
        http.Error(w, "Failed to update user: " + err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(user)
}