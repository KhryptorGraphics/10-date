#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up 10-Date application for local development...${NC}"

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

# Create environment files if they don't exist
echo -e "${YELLOW}Setting up environment files...${NC}"

# Backend environment
if [ ! -f "backend-app/.env" ]; then
    echo -e "${YELLOW}Creating backend environment file...${NC}"
    cp -n backend-app/.env.example backend-app/.env
    echo -e "${GREEN}Created backend-app/.env${NC}"
fi

# Build and start the containers
echo -e "${YELLOW}Building and starting containers...${NC}"
docker-compose up -d

# Wait for the database to be ready
echo -e "${YELLOW}Waiting for the database to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose exec backend npm run migration:run

# Seed the database
echo -e "${YELLOW}Seeding the database...${NC}"
docker-compose exec backend npm run seed

echo -e "${GREEN}Setup complete! The application is now running:${NC}"
echo -e "- Frontend: http://localhost"
echo -e "- Backend API: http://localhost:3000/api"
echo -e "- PostgreSQL: localhost:5432"
echo -e "- Redis: localhost:6379"
echo -e ""
echo -e "Use the following commands to interact with the application:"
echo -e "- View logs: docker-compose logs -f [service]"
echo -e "- Stop services: docker-compose down"
echo -e "- Rebuild services: docker-compose up -d --build"
