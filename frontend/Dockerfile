FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy craco.config.js for craco build
COPY frontend/craco.config.js ./
# Ensure craco.config.js is copied

# Copy public and src directories
COPY frontend/public ./public
COPY frontend/src ./src

# Run the build process
RUN npm run build

# Expose the frontend port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
