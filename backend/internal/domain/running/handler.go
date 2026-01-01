package running

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
	r.Get("/runs", h.ListRuns)
	r.Post("/runs", h.CreateRun)
	r.Delete("/runs/{id}", h.DeleteRun)
	r.Get("/shoes", h.ListShoes)
	r.Post("/shoes", h.CreateShoe)
}

func (h *Handler) ListRuns(w http.ResponseWriter, r *http.Request) {
    userID := auth.GetUserID(r.Context())
	runs, err := h.repo.ListRuns(r.Context(), userID, 100)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(runs)
}

type CreateRunRequest struct {
	StartTime       time.Time `json:"start_time"`
	DurationSeconds int       `json:"duration_seconds"`
	DistanceMeters  float64   `json:"distance_meters"`
	ElevationGain   float64   `json:"elevation_gain_meters"`
	AvgHeartRate    *int      `json:"avg_heart_rate"`
	Cadence         *int      `json:"cadence"`
	RelativeEffort  *int      `json:"relative_effort"`
	ShoeID          *int      `json:"shoe_id"`
	Steps           *int      `json:"steps"`
	RouteData       *string   `json:"route_data"`
	RunType         *string   `json:"run_type"`
	Notes           *string   `json:"notes"`
}

func (h *Handler) CreateRun(w http.ResponseWriter, r *http.Request) {
	var req CreateRunRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.StartTime.IsZero() {
		req.StartTime = time.Now()
	}

    userID := auth.GetUserID(r.Context())
	run, err := h.repo.CreateRun(r.Context(), userID, req.StartTime, req.DurationSeconds, req.DistanceMeters, req.ElevationGain, req.AvgHeartRate, req.Cadence, req.RelativeEffort, req.ShoeID, req.Steps, req.RouteData, req.RunType, req.Notes)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(run)
}

func (h *Handler) DeleteRun(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)
	if err := h.repo.DeleteRun(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) ListShoes(w http.ResponseWriter, r *http.Request) {
    userID := auth.GetUserID(r.Context())
	shoes, err := h.repo.ListShoes(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(shoes)
}

func (h *Handler) CreateShoe(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Brand string `json:"brand"`
		Model string `json:"model"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
    userID := auth.GetUserID(r.Context())
	shoe, err := h.repo.CreateShoe(r.Context(), userID, req.Brand, req.Model)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(shoe)
}