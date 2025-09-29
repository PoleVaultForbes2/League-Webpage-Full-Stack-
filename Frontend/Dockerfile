# Frontend Dockerfile
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the frontend app
RUN npm run build

# Serve frontend with a lightweight server
RUN npm install -g serve
EXPOSE 80

CMD ["serve", "-s", "dist", "-l", "80"]
