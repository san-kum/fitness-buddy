#!/bin/bash

# Kill any existing server on port 8080 (rough check)
echo "Cleaning up existing processes..."
fuser -k 8080/tcp > /dev/null 2>&1
fuser -k 5173/tcp > /dev/null 2>&1

echo "Checking Backend dependencies..."
cd backend
go mod tidy
cd ..

echo "Checking Frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies (this may take a while)..."
    npm install
fi
cd ..

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

echo "------------------------------------------"
echo "Fitness Buddy is starting up!"
echo "Backend running on http://localhost:8080"
echo "Frontend running on http://localhost:5173"
echo "------------------------------------------"
echo "Press Ctrl+C to stop both services."

trap "kill $BACKEND_PID $FRONTEND_PID; echo 'Shutting down...'; exit" SIGINT SIGTERM

wait
