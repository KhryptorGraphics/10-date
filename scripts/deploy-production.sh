#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Deploying 10-Date application to production...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if .env.prod file exists
if [ ! -f ".env.prod" ]; then
    echo -e "${RED}Error: .env.prod file not found. Create this file with your production environment variables.${NC}"
    exit 1
fi

# Load environment variables from .env.prod file
echo -e "${YELLOW}Loading environment variables from .env.prod...${NC}"
export $(grep -v '^#' .env.prod | xargs)

# Set the deployment version (using the current timestamp if not provided)
export VERSION=${VERSION:-$(date +%Y%m%d%H%M%S)}
echo -e "${YELLOW}Deploying version: ${VERSION}${NC}"

# Pull the latest changes
echo -e "${YELLOW}Pulling the latest changes...${NC}"
git pull

# Build and start the containers with production configuration
echo -e "${YELLOW}Building and starting production containers...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Wait for the services to be ready
echo -e "${YELLOW}Waiting for the services to be ready...${NC}"
sleep 30

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npm run migration:run

# Check health status
echo -e "${YELLOW}Checking health status...${NC}"
BACKEND_HEALTHY=$(docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend wget -q -O- http://localhost:3000/api/health || echo "unhealthy")
FRONTEND_HEALTHY=$(docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec frontend wget -q -O- http://localhost/health || echo "unhealthy")

if [[ "$BACKEND_HEALTHY" == *"unhealthy"* ]]; then
    echo -e "${RED}Warning: Backend health check failed. Please check the logs.${NC}"
    echo -e "${YELLOW}Running: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs backend${NC}"
else
    echo -e "${GREEN}Backend is healthy.${NC}"
fi

if [[ "$FRONTEND_HEALTHY" == *"unhealthy"* ]]; then
    echo -e "${RED}Warning: Frontend health check failed. Please check the logs.${NC}"
    echo -e "${YELLOW}Running: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs frontend${NC}"
else
    echo -e "${GREEN}Frontend is healthy.${NC}"
fi

echo -e "${GREEN}Deployment complete! The application is now running in production.${NC}"
echo -e "Frontend URL: ${FRONTEND_URL:-https://yourdomain.com}"
echo -e "API URL: ${API_URL:-https://api.yourdomain.com}"

# Display monitoring commands
echo -e ""
echo -e "Useful commands:"
echo -e "- View logs: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f [service]"
echo -e "- Check status: docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps"
echo -e "- Restart service: docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart [service]"
echo -e "- Scale service: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale [service]=[count]"
