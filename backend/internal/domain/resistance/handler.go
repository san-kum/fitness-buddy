package resistance

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
	r.Get("/exercises", h.ListExercises)
	r.Post("/exercises", h.CreateExercise)
	r.Get("/sessions", h.ListSessions)
	r.Post("/sessions", h.CreateSession)
	r.Post("/sessions/{id}/finish", h.FinishSession)
	r.Post("/sessions/{id}/sets", h.AddSet)
	r.Put("/sets/{id}", h.UpdateSet)
	r.Delete("/sets/{id}", h.DeleteSet)
	r.Get("/routines", h.ListRoutines)
	r.Post("/routines", h.CreateRoutine)
	r.Delete("/routines/{id}", h.DeleteRoutine)
	r.Delete("/sessions/{id}", h.DeleteSession)
}

func (h *Handler) DeleteRoutine(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid routine ID", http.StatusBadRequest)
		return
	}
	if err := h.repo.DeleteRoutine(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid session ID", http.StatusBadRequest)
		return
	}
	if err := h.repo.DeleteSession(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) ListExercises(w http.ResponseWriter, r *http.Request) {
	exercises, err := h.repo.ListExercises(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(exercises)
}

type CreateExerciseRequest struct {
	Name      string  `json:"name"`
	Category  string  `json:"category"`
	Equipment *string `json:"equipment"`
}

func (h *Handler) CreateExercise(w http.ResponseWriter, r *http.Request) {
	var req CreateExerciseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	e, err := h.repo.CreateExercise(r.Context(), req.Name, req.Category, req.Equipment)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(e)
}

func (h *Handler) ListSessions(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	sessions, err := h.repo.ListSessions(r.Context(), userID, 20)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// For each session, fetch sets (N+1 problem but fine for 20 items in personal app)
	for i := range sessions {
		sets, err := h.repo.GetSetsForSession(r.Context(), sessions[i].ID)
		if err == nil {
			sessions[i].Sets = sets
		}
	}

	json.NewEncoder(w).Encode(sessions)
}

type CreateSessionRequest struct {
	StartTime time.Time `json:"start_time"`
	Notes     *string   `json:"notes"`
}

func (h *Handler) CreateSession(w http.ResponseWriter, r *http.Request) {
	var req CreateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req.StartTime = time.Now()
	}
	if req.StartTime.IsZero() {
		req.StartTime = time.Now()
	}

	userID := auth.GetUserID(r.Context())
	s, err := h.repo.CreateSession(r.Context(), userID, req.StartTime, req.Notes)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(s)
}

type FinishSessionRequest struct {
	EndTime time.Time `json:"end_time"`
}

func (h *Handler) FinishSession(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid session ID", http.StatusBadRequest)
		return
	}

	var req FinishSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req.EndTime = time.Now()
	}
	if req.EndTime.IsZero() {
		req.EndTime = time.Now()
	}

	if err := h.repo.FinishSession(r.Context(), id, req.EndTime); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

type AddSetRequest struct {
	ExerciseID  int        `json:"exercise_id"`
	WeightKG    float64    `json:"weight_kg"`
	Reps        int        `json:"reps"`
	RPE         *float64   `json:"rpe"`
	PerformedAt *time.Time `json:"performed_at"`
}

func (h *Handler) AddSet(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "id")
	sessionID, err := strconv.Atoi(sessionIDStr)
	if err != nil {
		http.Error(w, "Invalid session ID", http.StatusBadRequest)
		return
	}

	var req AddSetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	performedAt := time.Now()
	if req.PerformedAt != nil {
		performedAt = *req.PerformedAt
	}

	s, err := h.repo.AddSet(r.Context(), sessionID, req.ExerciseID, req.WeightKG, req.Reps, req.RPE, performedAt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(s)
}

func (h *Handler) UpdateSet(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid set ID", http.StatusBadRequest)
		return
	}

	var req AddSetRequest // Reuse struct
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.repo.UpdateSet(r.Context(), id, req.WeightKG, req.Reps, req.RPE); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) DeleteSet(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid set ID", http.StatusBadRequest)
		return
	}

	if err := h.repo.DeleteSet(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) ListRoutines(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	routines, err := h.repo.ListRoutines(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(routines)
}

type CreateRoutineRequest struct {
	Name        string  `json:"name"`
	Notes       *string `json:"notes"`
	ExerciseIDs []int   `json:"exercise_ids"`
}

func (h *Handler) CreateRoutine(w http.ResponseWriter, r *http.Request) {
	var req CreateRoutineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := auth.GetUserID(r.Context())
	rt, err := h.repo.CreateRoutine(r.Context(), userID, req.Name, req.Notes, req.ExerciseIDs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(rt)
}
