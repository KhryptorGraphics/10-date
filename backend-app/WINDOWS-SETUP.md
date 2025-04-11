# Windows Setup Guide for 10-Date Application

This guide provides instructions for setting up the 10-Date application on Windows with all the performance optimizations and Redis caching.

## Prerequisites

1. **Node.js and npm**: Ensure you have Node.js (v14 or later) and npm installed
   - Verify with: `node -v` and `npm -v` in PowerShell

2. **PostgreSQL**: Install and set up PostgreSQL database
   - Download from: https://www.postgresql.org/download/windows/
   - Create a database named `dating_app` 
   - Note your username and password for configuration

3. **Redis**: Redis is not officially supported on Windows, but you have options:

   **Option A: Use Docker (Recommended)**
   
   1. Install Docker Desktop for Windows:
      - Download from: https://www.docker.com/products/docker-desktop
      - Ensure WSL 2 is set up if prompted
   
   2. Run Redis container:
      ```powershell
      docker run --name redis-cache -p 6379:6379 -d redis
      ```

   **Option B: Use Memurai (Redis alternative for Windows)**
   
   1. Download and install Memurai:
      - https://www.memurai.com/get-memurai
   
   2. Memurai will run as a Windows service automatically

## Setting Up the Application

### 1. Configure Environment Variables

1. Copy the example environment file:
   ```powershell
   Copy-Item .\backend-app\.env.example .\backend-app\.env
   ```

2. Edit the `.env` file with your database and Redis configuration:
   - Update `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
   - Update `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` if needed
   - Update `JWT_SECRET` to a secure value
   - Configure any other variables like `STRIPE_SECRET_KEY` if needed

### 2. Install Dependencies

In PowerShell, navigate to the backend app directory:

```powershell
cd .\backend-app\
npm install
```

### 3. Run Database Migrations

```powershell
# Navigate to the backend app directory if you're not already there
cd .\backend-app\

# Run the database migrations
npm run migration:run
```

### 4. Seed the Database with Test Data

```powershell
npm run seed
```

### 5. Starting the Application

#### Development Mode

```powershell
npm run start:dev
```

#### Production Mode

```powershell
npm run build
npm run start:prod
```

## Verifying the Setup

1. **Test the API**: Visit `http://localhost:3000/api` in your browser (assuming port 3000)

2. **Verify Redis Connection**: Check application logs for successful Redis connection messages

3. **Admin Dashboard**: Access the admin analytics dashboard at `http://localhost:3000/admin/analytics/matches` with admin credentials

## Troubleshooting

### Redis Connection Issues

If you encounter issues connecting to Redis:

1. Check if Redis is running:
   - For Docker: `docker ps -a | Select-String redis`
   - For Memurai: Check Windows Services

2. Verify the Redis connection settings in `.env`

3. If using Docker, restart the Redis container:
   ```powershell
   docker restart redis-cache
   ```

### Database Connection Issues

1. Ensure PostgreSQL service is running:
   ```powershell
   Get-Service -Name 'postgresql*'
   ```

2. Verify database credentials in `.env`

3. Check that the database has been created:
   ```powershell
   psql -U your_username -c "\l" # List all databases
   ```

## Performance Monitoring

To monitor Redis cache performance, you can use these tools:

1. **Redis CLI** (via Docker):
   ```powershell
   docker exec -it redis-cache redis-cli
   ```
   Then run commands like:
   ```
   INFO stats
   INFO memory
   MONITOR  # Caution: high-traffic in production
   ```

2. **Application Metrics**: 
   
   The application exposes cache performance metrics at `http://localhost:3000/api/admin/metrics`.
   
   Metrics available include:
   - Cache hit rate
   - Cache miss rate
   - Average response time (cached vs. non-cached)
