package database

import (
	"database/sql"
	"fmt"
	"strings"

	_ "github.com/mattn/go-sqlite3"
	_ "github.com/jackc/pgx/v5/stdlib"
)

type DB struct {
	Pool *sql.DB
}

func New(connString string) (*DB, error) {
    var driver, dsn string

    if strings.HasPrefix(connString, "postgres://") || strings.HasPrefix(connString, "postgresql://") {
        driver = "pgx"
        dsn = connString
    } else {
        driver = "sqlite3"
        if connString == "" {
            connString = "fitness_buddy.db"
        }
        dsn = connString + "?_busy_timeout=5000&_journal_mode=WAL&_foreign_keys=on&_parseTime=true&_loc=Local"
    }

	db, err := sql.Open(driver, dsn)
	if err != nil {
		return nil, fmt.Errorf("unable to open database: %w", err)
	}

    if driver == "sqlite3" {
        db.SetMaxOpenConns(1)
    }

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	return &DB{Pool: db}, nil
}

func (db *DB) Close() {
	db.Pool.Close()
}