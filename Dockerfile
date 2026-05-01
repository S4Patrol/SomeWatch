FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
# Using npm ci for clean and deterministic installs based on package-lock.json
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
# This will output to the "out" directory based on rsbuild.config.ts
RUN npm run build

# Use a lightweight web server for the production image
FROM nginx:alpine

# Copy the build output from the builder stage
COPY --from=builder /app/out /usr/share/nginx/html

# Overwrite default nginx config to serve the SPA (Single Page Application)
# This ensures client-side routing works by falling back to index.html
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
