#!/bin/bash

# CodeYudh Production Deployment Script

set -e  # Exit on any error

echo "🚀 Starting CodeYudh deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available (try both commands)
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose functionality
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please update Docker to include Compose V2."
    exit 1
fi

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker compose down

# Remove old images (optional)
read -p "Do you want to remove old Docker images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Removing old images..."
    docker system prune -f
fi

# Build and start services
echo "🔨 Building and starting services..."
docker compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 20

# Check if services are running
echo "🔍 Checking service status..."
docker compose ps

echo ""
echo "✅ Deployment completed!"
echo "🌐 Frontend: http://localhost"
echo "🔧 API: http://localhost:3000"
echo "📊 Database: External (check your .env)"
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop: docker compose down"
echo ""

