#!/bin/bash

# Load environment variables from the parent directory's .env file
if [ -f "../.env" ]; then
    export $(grep -v '^#' ../.env | xargs)
    echo "✅ Loaded environment variables from ../.env"
else
    echo "❌ No .env file found in parent directory"
    echo "Please create a .env file in the parent directory with your database URI and other configuration"
    exit 1
fi

# Build the Docker image if it doesn't exist
echo "🏗️  Building Docker image..."
docker build -t codeyudh-server .

# Run the container with environment variables
echo "🚀 Starting container..."
docker run -p 5050:5050 \
  -e PORT=5050 \
  -e DB_URI="$DB_URI" \
  -e CORS_ORIGIN="$CORS_ORIGIN" \
  -e BUN_ENV="$BUN_ENV" \
  -e ACCESS_TOKEN_SECRET="$ACCESS_TOKEN_SECRET" \
  -e ACCESS_TOKEN_EXPIRY="$ACCESS_TOKEN_EXPIRY" \
  -e REFRESH_TOKEN_SECRET="$REFRESH_TOKEN_SECRET" \
  -e REFRESH_TOKEN_EXPIRY="$REFRESH_TOKEN_EXPIRY" \
  -e FRONTEND_URL="$FRONTEND_URL" \
  -e MAILTRAP_SMTP_HOST="$MAILTRAP_SMTP_HOST" \
  -e MAILTRAP_SMTP_PORT="$MAILTRAP_SMTP_PORT" \
  -e MAILTRAP_SMTP_USER="$MAILTRAP_SMTP_USER" \
  -e MAILTRAP_SMTP_PASS="$MAILTRAP_SMTP_PASS" \
  -e MAILTRAP_FROM="$MAILTRAP_FROM" \
  --name codeyudh-server \
  --rm \
  codeyudh-server