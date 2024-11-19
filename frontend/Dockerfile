# Stage 1: Build the React app
FROM node:18-alpine as build
WORKDIR /app

# Install dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

# Copy all project files and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve the React app
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Copy built app from Stage 1
COPY --from=build /app/build .

# Expose port 80 (default for nginx)
EXPOSE 80

# Use nginx to serve the static files
ENTRYPOINT ["nginx", "-g", "daemon off;"]
