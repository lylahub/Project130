FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the entire frontend folder to the container
COPY frontend/ ./

# Expose the port used by the React development server
EXPOSE 3000

# Start the React development server
CMD ["npm", "start"]
