package main

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"

	"fitness-buddy/internal/api"
	"fitness-buddy/internal/database"
	"fitness-buddy/migrations"
	"github.com/joho/godotenv"
)

//go:embed all:dist
var frontendFS embed.FS

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		dbUrl = "fitness_buddy.db"
	}

	db, err := database.New(dbUrl)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Run migrations
	log.Println("Running migrations...")
	entries, err := migrations.FS.ReadDir(".")
	if err != nil {
		log.Fatalf("Failed to read migrations directory: %v", err)
	}

	for _, entry := range entries {
		if !entry.IsDir() && entry.Name() != "migrations.go" {
			log.Printf("Applying %s...", entry.Name())
			content, err := migrations.FS.ReadFile(entry.Name())
			if err != nil {
				log.Fatalf("Failed to read migration file %s: %v", entry.Name(), err)
			}
            
            sqlContent := string(content)
            
            // Dialect Translation for SQLite
            if !strings.HasPrefix(dbUrl, "postgres") && !strings.HasPrefix(dbUrl, "postgresql") {
                sqlContent = strings.ReplaceAll(sqlContent, "SERIAL PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
                sqlContent = strings.ReplaceAll(sqlContent, "TIMESTAMPTZ", "DATETIME")
                sqlContent = strings.ReplaceAll(sqlContent, "CURRENT_TIMESTAMP", "CURRENT_TIMESTAMP")
                sqlContent = strings.ReplaceAll(sqlContent, "ON CONFLICT DO NOTHING", "") // SQLite has different syntax but we use OR IGNORE usually. 
                // Let's handle seeding specifically
                sqlContent = strings.ReplaceAll(sqlContent, "INSERT INTO", "INSERT OR IGNORE INTO")
            }

			if _, err := db.Pool.ExecContext(context.Background(), sqlContent); err != nil {
				log.Printf("Migration warning for %s: %v", entry.Name(), err)
			}
		}
	}

	// Seed default user if not exists
	var userCount int
	db.Pool.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
	if userCount == 0 {
		log.Println("Seeding default user...")
		_, err := db.Pool.Exec("INSERT INTO users (name, height_cm, sex) VALUES ('User', 175, 'M')")
		if err != nil {
			log.Printf("Failed to seed user: %v", err)
		}
	}

	// Prepare frontend filesystem
	fSys, err := fs.Sub(frontendFS, "dist")
	if err != nil {
		log.Fatal(err)
	}

	r := api.NewRouter(db, fSys)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Fitness Buddy System initialized on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
