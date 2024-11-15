# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package.json files and install dependencies
COPY ./backend/package*.json ./
RUN npm install

# Copy the src folder
COPY ./backend/src ./src

# Accept environment variables as build arguments
ARG ENV_VARS
ENV ENV_VARS=${ENV_VARS}

# Create .env file from the build argument
RUN echo "$ENV_VARS" > .env

# Expose the backend port
EXPOSE 8080

# Start the backend server
CMD ["npm", "start"]
