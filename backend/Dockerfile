# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package.json files and install dependencies
COPY ./backend/package*.json ./
# Add relative path to backend
RUN npm install

# Copy the src folder
COPY ./backend/src ./src

# Copy the environment file from the root directory
COPY ./.env .env

# Expose the backend port
EXPOSE 3001

# Start the backend server
CMD ["npm", "start"]
