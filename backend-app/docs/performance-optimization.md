# Performance Optimization Documentation

This document provides a comprehensive overview of the performance optimization features implemented in the 10-Date application, focusing on database schema updates, caching strategies, and API request throttling.

## Table of Contents

1. [Database Migrations](#database-migrations)
2. [Redis Caching](#redis-caching)
3. [API Rate Limiting](#api-rate-limiting)
4. [Admin Dashboard Analytics](#admin-dashboard-analytics)

## Database Migrations

### Overview

We've implemented two key migration scripts that enhance our database schema to support the AI-powered matching system with behavioral data collection:

- `1713494000000-CreateSwipeDataEntity.ts`: Creates the SwipeData table for detailed behavioral tracking
- `1713494100000-UpdateUserEntityWithBehavioralData.ts`: Updates the Users table with implicit preference fields

### Running Migrations

To run the migrations in your environment:

```bash
# Development environment
npm run migration:run

# Testing environment
NODE_ENV=test npm run migration:run

# Production environment (use with caution)
NODE_ENV=production npm run migration:run
```

### Reverting Migrations

If needed, migrations can be reverted using:

```bash
npm run migration:revert
```

### Testing Migrations

A comprehensive integration test has been created in `test/migrations.e2e-spec.ts` that verifies:

1. The correct table schema creation
2. The presence of all required columns
3. Proper foreign key relationships
4. The ability to store and retrieve behavioral data

## Redis Caching

### Overview

We've implemented a Redis caching layer to improve response times for frequently accessed data:

- User profile data
- Matching algorithm results
- Session data
- API response caching

### Redis Service

The `RedisService` (`src/cache/redis.service.ts`) provides a comprehensive interface for interacting with Redis:

```typescript
// Example: Caching user recommendations
await redisService.set(
  `user:${userId}:recommendations`, 
  recommendations,
  3600 // 1 hour TTL
);

// Retrieving cached recommendations
const cachedRecommendations = await redisService.get<Recommendation[]>(
  `user:${userId}:recommendations`
);
```

### Configuration

Redis connection settings are configured through environment variables:

```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Cache Invalidation

The service provides methods for pattern-based cache invalidation:

```typescript
// Invalidate all recommendations for a user
await redisService.deletePattern(`user:${userId}:recommendations:*`);

// Invalidate all data for a user
await redisService.deletePattern(`user:${userId}:*`);
```

### Hash Operations

For complex data structures, the service supports Redis hash operations:

```typescript
// Store user preferences
await redisService.hmset(`user:${userId}:preferences`, {
  ageMin: 25,
  ageMax: 35,
  distance: 20,
  interests: JSON.stringify(['music', 'hiking', 'photography'])
});

// Retrieve preferences
const preferences = await redisService.hgetall(`user:${userId}:preferences`);
```

## API Rate Limiting

### Overview

To protect the API from abuse and ensure fair resource allocation, we've implemented Redis-based rate limiting:

- Configurable per-endpoint rate limits
- Different rate limiting tiers based on user roles
- IP-based rate limiting for unauthenticated requests
- User-based rate limiting for authenticated requests

### Middleware Implementation

The rate limiter is implemented as a NestJS middleware in `src/common/middlewares/rate-limiter.middleware.ts`:

```typescript
// Example: Apply rate limiting to a controller
@Module({
  imports: [CacheModule],
  controllers: [MatchingController],
  providers: [MatchingService],
})
export class MatchingModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimiterMiddleware)
      .forRoutes(MatchingController);
  }
}
```

### Configuration

Rate limiting is configured through environment variables:

```
RATE_LIMIT_WINDOW_MS=60000  # Time window in milliseconds (default: 1 minute)
RATE_LIMIT_MAX_REQUESTS=100 # Maximum requests per window
RATE_LIMIT_MESSAGE=Too many requests, please try again later
```

### Response Headers

The middleware adds the following headers to responses:

- `X-RateLimit-Limit`: Maximum number of requests allowed
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `Retry-After`: Seconds until rate limit resets (only when limit is exceeded)

## Admin Dashboard Analytics

### Overview

We've implemented a comprehensive analytics dashboard for administrators to monitor and optimize the matching algorithm:

- Match quality metrics
- Compatibility distribution analysis
- Parameter impact visualization
- Success trend monitoring
- Behavioral insights
- A/B test comparison
- Algorithm tuning interface

### Endpoints

The analytics API is available at `/api/admin/analytics/matches/*` with the following endpoints:

- `GET /quality`: Overall matching quality metrics
- `GET /compatibility/distribution`: Distribution of compatibility scores
- `GET /parameters/impact`: Algorithm parameter impact analysis
- `GET /success/trend`: Match success rate over time
- `GET /behavioral/insights`: Behavioral data insights
- `GET /tuning/recommendations`: Algorithm tuning recommendations
- `GET /ab-tests`: A/B test comparison results
- `GET /user/:userId`: Per-user match statistics
- `GET /engagement`: Match engagement metrics

### Authentication & Authorization

All admin analytics endpoints require both authentication and admin role authorization:

```typescript
@Controller('admin/analytics/matches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class MatchAnalyticsController {
  // ...
}
```

### Frontend Integration

A React-based dashboard (`frontend/src/pages/admin/MatchAnalyticsPage.tsx`) has been implemented with:

- Date range filtering
- Interval selection (daily, weekly, monthly)
- Responsive charts and visualizations
- Interactive parameter tuning interface

## Next Steps & Future Improvements

1. **Enhanced Caching Strategy**:
   - Implement cache warm-up for high-traffic user profiles
   - Add background workers for pre-computing recommendations

2. **Advanced Rate Limiting**:
   - Dynamic rate limiting based on server load
   - Graduated response (slowing before blocking)

3. **Database Optimization**:
   - Implement database sharding for large user tables
   - Add database query optimization for matching algorithms

4. **Testing & Validation**:
   - Create comprehensive load testing scenarios
   - Implement A/B testing framework for algorithm variants
