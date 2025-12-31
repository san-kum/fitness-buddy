#!/bin/bash

# Kill any existing server on port 8080 (rough check)
fuser -k 8080/tcp > /dev/null 2>&1

echo "Starting Backend..."
cd backend
go run cmd/server/main.go &
BACKEND_PID=$!
cd ..

echo "Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "App running!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

wait
