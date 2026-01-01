package body

import (
	"encoding/json"
	"net/http"
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
	r.Get("/body/metrics", h.ListMetrics)
	r.Post("/body/metrics", h.CreateMetric)
}

func (h *Handler) ListMetrics(w http.ResponseWriter, r *http.Request) {
    userID := auth.GetUserID(r.Context())
    metrics, err := h.repo.ListMetrics(r.Context(), userID, 50)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    json.NewEncoder(w).Encode(metrics)
}

type CreateMetricRequest struct {
    RecordedAt     time.Time `json:"recorded_at"`
    WeightKG       *float64  `json:"weight_kg"`
    BodyFatPercent *float64  `json:"body_fat_percent"`
}

func (h *Handler) CreateMetric(w http.ResponseWriter, r *http.Request) {
    var req CreateMetricRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    if req.RecordedAt.IsZero() {
        req.RecordedAt = time.Now()
    }

    userID := auth.GetUserID(r.Context())
    bm, err := h.repo.CreateMetric(r.Context(), userID, req.RecordedAt, req.WeightKG, req.BodyFatPercent)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    json.NewEncoder(w).Encode(bm)
}
