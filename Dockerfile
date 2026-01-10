FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY backend/package*.json ./backend/
WORKDIR /usr/src/app/backend
RUN npm install --production

# Bundle app source
WORKDIR /usr/src/app
COPY backend ./backend
COPY frontend ./frontend
COPY assets ./assets

# Expose port
EXPOSE 8080

# Environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Start command
WORKDIR /usr/src/app/backend
CMD [ "npm", "start" ]
