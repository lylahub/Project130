# backend/Dockerfile

# Use a Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the entire src folder to the container's working directory
COPY src ./src

# Expose the backend port (replace 3001 if different)
EXPOSE 3001

# Start the backend server
CMD ["npm", "start"]
