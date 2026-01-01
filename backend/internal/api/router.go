package api

import (
	"io/fs"
	"net/http"
	"strings"

	"fitness-buddy/internal/database"
	"fitness-buddy/internal/domain/analytics"
	"fitness-buddy/internal/domain/body"
	"fitness-buddy/internal/domain/identity"
	"fitness-buddy/internal/domain/nutrition"
	"fitness-buddy/internal/domain/resistance"
	"fitness-buddy/internal/domain/running"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func NewRouter(db *database.DB, frontendFS fs.FS) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)
	r.Use(JWTMiddleware)

	identityRepo := identity.NewRepository(db)
	authHandler := NewAuthHandler(identityRepo)

	r.Route("/api", func(r chi.Router) {
		// Set Content-Type for all API responses
		r.Use(func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				next.ServeHTTP(w, r)
			})
		})
		r.Get("/auth/google/login", authHandler.HandleGoogleLogin)
		r.Get("/auth/google/callback", authHandler.HandleGoogleCallback)
		r.Get("/auth/logout", authHandler.HandleLogout)

		identityHandler := identity.NewHandler(identityRepo)
		identityHandler.RegisterRoutes(r)

		resistanceRepo := resistance.NewRepository(db)
		resistanceHandler := resistance.NewHandler(resistanceRepo)
		resistanceHandler.RegisterRoutes(r)

		runningRepo := running.NewRepository(db)
		runningHandler := running.NewHandler(runningRepo)
		runningHandler.RegisterRoutes(r)

		nutritionRepo := nutrition.NewRepository(db)
		nutritionHandler := nutrition.NewHandler(nutritionRepo)
		nutritionHandler.RegisterRoutes(r)

		bodyRepo := body.NewRepository(db)
		bodyHandler := body.NewHandler(bodyRepo)
		bodyHandler.RegisterRoutes(r)

		analyticsRepo := analytics.NewRepository(db)
		analyticsHandler := analytics.NewHandler(analyticsRepo)
		analyticsHandler.RegisterRoutes(r)
	})

	// Serve Frontend
	if frontendFS != nil {
		fileServer := http.FileServer(http.FS(frontendFS))
		r.Handle("/*", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// If the request doesn't have an extension (like .js or .css),
			// serve index.html to support React Router's SPA routing.
			if !strings.Contains(r.URL.Path, ".") && r.URL.Path != "/" {
				r.URL.Path = "/"
			}
			fileServer.ServeHTTP(w, r)
		}))
	}

	return r
}
