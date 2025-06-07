# CodeYudh Docker Deployment Guide

This guide will help you deploy the CodeYudh application using Docker in a production environment.

## Prerequisites

1. **Docker**: Install Docker on your server
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install docker.io docker-compose
   
   # CentOS/RHEL
   sudo yum install docker docker-compose
   
   # macOS
   brew install docker docker-compose
   ```

2. **Docker Compose**: Usually comes with Docker Desktop

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd codeyudh
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.production .env
   # Edit .env with your production settings
   nano .env
   ```

3. **Deploy**:
   ```bash
   ./deploy.sh
   ```

## Manual Deployment

If you prefer to deploy manually:

```bash
# Build and start all services
docker compose up --build -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

## Services

The application consists of three main services:

### 1. Database (PostgreSQL)
- **Port**: 5432
- **Container**: `codeyudh-db`
- **Data**: Persisted in Docker volume `postgres_data`

### 2. Server (Bun + Express)
- **Port**: 3000
- **Container**: `codeyudh-server`
- **API Endpoints**: Available at `http://localhost:3000`

### 3. Client (React + Nginx)
- **Port**: 80
- **Container**: `codeyudh-client`
- **Frontend**: Available at `http://localhost`

## Environment Variables

### Required Variables
Update these in your `.env` file:

```env
# Database
DB_URI=postgresql://postgres:postgres@database:5432/codeyudh

# Security (CHANGE THESE!)
ACCESS_TOKEN_SECRET=your-super-secure-secret
REFRESH_TOKEN_SECRET=your-super-secure-refresh-secret

# Domain
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Email (if using email features)
MAILTRAP_SMTP_HOST=smtp.youremailprovider.com
MAILTRAP_SMTP_USER=your-email
MAILTRAP_SMTP_PASS=your-password
```

## Database Setup

The database will be automatically created when you first run the containers. If you need to run migrations:

```bash
# Enter the server container
docker-compose exec server bash

# Run migrations (if you have any)
bun run migrate
```

## SSL/HTTPS Setup

For production, you'll want to set up SSL. Here are a few options:

### Option 1: Reverse Proxy (Recommended)
Use nginx or Apache as a reverse proxy with Let's Encrypt:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Option 2: Cloudflare
Use Cloudflare for SSL termination and point your domain to your server's IP.

## Monitoring and Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f database

# Check resource usage
docker stats
```

## Backup and Restore

### Backup Database
```bash
docker-compose exec database pg_dump -U postgres codeyudh > backup.sql
```

### Restore Database
```bash
docker-compose exec -T database psql -U postgres codeyudh < backup.sql
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 80, 3000, and 5432 are available
2. **Memory issues**: Ensure your server has at least 2GB RAM
3. **Permission errors**: Make sure Docker daemon is running and user has permissions

### Useful Commands

```bash
# Restart all services
docker-compose restart

# Rebuild specific service
docker-compose up --build -d server

# Enter container shell
docker-compose exec server bash
docker-compose exec database psql -U postgres

# Remove everything (careful!)
docker-compose down -v
docker system prune -a
```

## Scaling

To scale your application:

```bash
# Scale server instances
docker-compose up --scale server=3 -d

# Use a load balancer (nginx, HAProxy, etc.)
```

## Security Considerations

1. **Change default passwords** in production
2. **Use strong JWT secrets**
3. **Enable firewall** and only expose necessary ports
4. **Regular updates** of Docker images
5. **Monitor logs** for suspicious activity
6. **Use HTTPS** in production

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Ensure Docker is running properly
4. Check network connectivity between containers

