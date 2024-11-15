# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY frontend/ ./

# Expose the React development server port
EXPOSE 3000

# Start the React app
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "3000"]
