# Database Schema - Dating Platform

## Database Technology
- **MySQL** as the primary relational database
- Optional **Redis** for caching, pub/sub, and real-time features

## Core Entities & Relationships

### User
- `id` (PK)
- `email` (unique)
- `password_hash`
- `oauth_google_id`
- `oauth_facebook_id`
- `oauth_apple_id`
- `name`
- `age`
- `location` (geolocation data)
- `bio`
- `preferences` (JSONB: age range, distance, interests)
- `subscription_status`
- `verification_status`
- `created_at`
- **Relations:**
  - Has many **ProfileImages**
  - Has many **UserInterests**
  - Has many **Swipes**
  - Has many **Matches** (via Match table)
  - Has many **Messages** (via Match)
  - Has many **Reports**
  - Has many **Subscriptions**
  - Has many **Notifications**

### ProfileImage
- `id` (PK)
- `user_id` (FK)
- `url`
- `order`
- `metadata` (JSONB: size, format, etc.)

### Interest
- `id` (PK)
- `name`
- `category`

### UserInterest
- `user_id` (FK)
- `interest_id` (FK)

### Match
- `id` (PK)
- `user1_id` (FK)
- `user2_id` (FK)
- `status` (pending, matched, unmatched, blocked)
- `created_at`

### Swipe
- `id` (PK)
- `swiper_id` (FK)
- `swipee_id` (FK)
- `direction` (like/dislike)
- `timestamp`

### Message
- `id` (PK)
- `match_id` (FK)
- `sender_id` (FK)
- `content`
- `type` (text, image, gif, emoji)
- `timestamp`
- `encrypted_blob` (optional encrypted content)

### Report
- `id` (PK)
- `reporter_id` (FK)
- `reported_user_id` (FK)
- `reason`
- `status` (pending, reviewed, actioned)
- `created_at`

### Subscription
- `id` (PK)
- `user_id` (FK)
- `plan`
- `status`
- `start_date`
- `end_date`
- `payment_info` (encrypted JSONB)

### Notification
- `id` (PK)
- `user_id` (FK)
- `type`
- `content`
- `status` (sent, read, dismissed)
- `created_at`

### Admin
- `id` (PK)
- `email`
- `password_hash`
- `role`
- `created_at`

## Schema Considerations
- Use **UUIDs** or **auto-increment integers** for primary keys
- Use **JSON** type (MySQL 5.7+) for flexible fields (preferences, metadata)
- Enforce foreign key constraints
- Add indexes on frequently queried fields (email, oauth IDs, match status)
- Use **partitioning** or **archiving** for large tables (Messages, Swipes)
- Encrypt sensitive fields (payment_info, encrypted_blob)
- Use migrations (e.g., TypeORM, Prisma, or Knex) for schema management

## Next Steps
- Define detailed migration scripts
- Seed initial data (interests, categories)
- Set up test database environment
- Integrate with backend modules
