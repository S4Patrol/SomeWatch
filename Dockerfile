# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY seanime-web/package*.json ./seanime-web/
RUN cd seanime-web && npm ci
COPY seanime-web/ ./seanime-web/
RUN cd seanime-web && npm run build

# Stage 2: Build the backend (Using Debian-based Go for better C++ compatibility)
FROM golang:bookworm AS backend-builder
# Install build essentials for CGO and C++
RUN apt-get update && apt-get install -y g++ gcc libc6-dev
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Copy frontend build
COPY --from=frontend-builder /app/seanime-web/out ./web
# Build the Go binary
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-s -w" -o seanime main.go

# Stage 3: Final lightweight image (Using Debian-based slim image)
FROM debian:bookworm-slim
# Install necessary runtime libraries
RUN apt-get update && apt-get install -y ca-certificates tzdata sqlite3 libstdc++6 libgcc-s1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Copy the built executable
COPY --from=backend-builder /app/seanime .

# Railway passes the PORT env variable.
CMD ["sh", "-c", "./seanime --host 0.0.0.0 --port ${PORT:-43211} --datadir /app/data"]
