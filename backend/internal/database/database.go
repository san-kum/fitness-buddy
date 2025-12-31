package database

import (
	"database/sql"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
)

type DB struct {
	Pool *sql.DB
}

func New(connString string) (*DB, error) {
	// For SQLite, connString is the file path.
    // Use ?_busy_timeout=5000&_journal_mode=WAL&_foreign_keys=on for robustness
    if connString == "" {
        connString = "fitness_buddy.db"
    }
    
    // Check if params already attached, if not attach default
    // Simplify for now: assume full DSN or path. 
    // If it's just a path/filename, append params.
    
    dsn := connString + "?_busy_timeout=5000&_journal_mode=WAL&_foreign_keys=on&_parseTime=true&_loc=Local"

	db, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, fmt.Errorf("unable to open database: %w", err)
	}

    // Connection pool settings for SQLite (single writer)
    db.SetMaxOpenConns(1) 
    // Actually WAL mode allows concurrent readers, but 1 writer. 
    // go-sqlite3 might handle locking but safe default is 1 max open conns to avoid "database is locked"
    // Wait, WAL allows concurrency better. 
    // But let's stick to 1 to be super safe and "boring".
    // "Performance > abstractions" -> WAL is perf.
    // "Readability > cleverness" -> Single conn is safe.
    // Let's use 1 for now.
    db.SetMaxOpenConns(1)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	return &DB{Pool: db}, nil
}

func (db *DB) Close() {
	db.Pool.Close()
}