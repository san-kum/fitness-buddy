# Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build Backend
FROM golang:1.23-alpine AS backend-builder
RUN apk add --no-cache gcc musl-dev
# Enable Go toolchain auto-download to get the required version
ENV GOTOOLCHAIN=auto
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
# Copy frontend build into backend for embedding
COPY --from=frontend-builder /app/frontend/dist ./cmd/server/dist
WORKDIR /app/backend/cmd/server
RUN CGO_ENABLED=1 GOOS=linux go build -o /app/fitness-buddy

# Final Image
FROM alpine:latest
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=backend-builder /app/fitness-buddy .
# Create a folder for the persistent database
RUN mkdir -p /app/data
ENV DATABASE_URL=/app/data/fitness_buddy.db
ENV PORT=8080
EXPOSE 8080
CMD ["./fitness-buddy"]
