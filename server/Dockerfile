# Use minimal Bun Alpine image for performance
FROM oven/bun:1.1.13-alpine AS base

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Create a non-root user and set permissions (Alpine style, merged RUN)
RUN addgroup -g 1001 -S nodejs \
    && adduser -u 1001 -S bun -G nodejs \
    && chown -R bun:nodejs /app
USER bun

EXPOSE 5050

# Start the application
CMD ["bun", "run", "src/index.ts"]

