# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Compile TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled code
COPY --from=builder /app/dist ./dist

# Directory for persistent config
RUN mkdir -p /root/.research-assistant

# Environment variables
ENV NODE_ENV=production

# Entry point
CMD ["node", "dist/index.js"]
