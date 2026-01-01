package auth

import (
	"context"
)

type contextKey string

const (
	UserIDKey contextKey = "userID"
)

func GetUserID(ctx context.Context) int {
	if id, ok := ctx.Value(UserIDKey).(int); ok {
		return id
	}
	return 1 // Fallback to guest user
}

func WithUserID(ctx context.Context, userID int) context.Context {
	return context.WithValue(ctx, UserIDKey, userID)
}
