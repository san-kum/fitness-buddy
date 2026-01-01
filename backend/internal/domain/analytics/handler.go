package analytics

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
	r.Get("/analytics/daily", h.GetDailySummaries)
}

func (h *Handler) GetDailySummaries(w http.ResponseWriter, r *http.Request) {
    // Parse query params
    startStr := r.URL.Query().Get("start")
    endStr := r.URL.Query().Get("end")
    
    // Defaults: last 30 days
    endDate := time.Now()
    startDate := endDate.AddDate(0, 0, -30)
    
    if startStr != "" {
        if t, err := time.Parse("2006-01-02", startStr); err == nil {
            startDate = t
        }
    }
    if endStr != "" {
         if t, err := time.Parse("2006-01-02", endStr); err == nil {
            endDate = t
        }
    }
    
    userID := auth.GetUserID(r.Context())
    summaries, err := h.repo.GetDailySummaries(r.Context(), userID, startDate, endDate)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    json.NewEncoder(w).Encode(summaries)
}
