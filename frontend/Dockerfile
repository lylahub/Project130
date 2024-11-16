# Stage 1: Build the React app
FROM node:18-alpine as build
WORKDIR /app

# Copy package.json and lock files separately for better caching
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies
RUN npm install

# Copy all project files to the container
COPY frontend/ ./

# Build the application
RUN npm run build

# Stage 2: Serve the React app
FROM node:18-alpine
WORKDIR /app

# Install a lightweight static file server
RUN npm install -g serve

# Copy the build folder from the first stage
COPY --from=build /app/build /app

# Expose the port for Google Cloud Run
EXPOSE 8080

# Serve the React app on the port provided by Google Cloud Run or fallback to 8080
CMD ["sh", "-c", "serve -s . -l ${PORT:-8080}"]

