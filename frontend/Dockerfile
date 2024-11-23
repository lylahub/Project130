# frontend/Dockerfile

FROM node:18-alpine

WORKDIR /app

# Copy package.json files and install dependencies first
COPY package*.json ./
RUN npm install

# Copy public and src directories after dependencies are installed
COPY public ./public
COPY src ./src

# Run the build process
RUN npm run build

# Expose the frontend port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
