# Build stage (Bun for install/build, Node for Vite build)
FROM oven/bun:1.1.13-alpine AS bunbase

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

FROM node:18-alpine AS builder

WORKDIR /app

COPY --from=bunbase /app /app

# Build the application using production-friendly TypeScript config
RUN npm run build

# Production stage - use nginx for serving static files
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

