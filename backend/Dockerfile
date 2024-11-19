FROM node:18-alpine
WORKDIR /app

# Install dependencies
COPY ./backend/package*.json ./
RUN npm install

# Copy the source code
COPY ./backend/src ./src

# Set environment variables dynamically
ARG ENV_VARS
ENV ENV_VARS=${ENV_VARS}

# Create a .env file from the build argument
RUN echo "$ENV_VARS" > .env

# Expose the backend port
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
