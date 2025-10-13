# Use latest Bun Alpine image for performance
FROM oven/bun:1-alpine AS base

WORKDIR /app

# Install ca-certificates and update DNS resolver for external connections
RUN apk add --no-cache ca-certificates && update-ca-certificates

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Create a non-root user and set permissions (Alpine style, merged RUN)
RUN addgroup -g 1001 -S nodejs \
    && adduser bun nodejs \
    && chown -R bun:nodejs /app
USER bun

EXPOSE 5050

# Start the application
CMD ["bun", "run", "src/index.ts"]