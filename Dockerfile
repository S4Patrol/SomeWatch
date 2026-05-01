    # Stage 1: Build the frontend
    FROM node:20-alpine AS frontend-builder
    WORKDIR /app
    COPY seanime-web/package*.json ./seanime-web/
    RUN cd seanime-web && npm ci
    COPY seanime-web/ ./seanime-web/
    RUN cd seanime-web && npm run build

    # Stage 2: Build the backend
    FROM golang:alpine AS backend-builder
    RUN apk add --no-cache gcc g++ musl-dev
    WORKDIR /app
    COPY go.mod go.sum ./
    RUN go mod download
    COPY . .
    # Copy frontend build to the web directory where Go expects it to be embedded
    COPY --from=frontend-builder /app/seanime-web/out ./web
    # Build the Go binary
    RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-s -w" -o seanime main.go

    # Stage 3: Final lightweight image
    FROM alpine:latest
    RUN apk add --no-cache ca-certificates tzdata sqlite libstdc++ libgcc
    WORKDIR /app
    # Copy the built executable
    COPY --from=backend-builder /app/seanime .

    # Railway handles volumes externally, so we just set up the CMD

    # Railway passes the PORT env variable.
    # We will use a shell to substitute the PORT variable. 
    # We also bind to 0.0.0.0 to allow external connections, and set a datadir.
    CMD ["sh", "-c", "./seanime --host 0.0.0.0 --port ${PORT:-43211} --datadir /app/data"]
