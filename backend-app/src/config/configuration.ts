export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'dating_app',
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'localdevelopmentsecret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || '10date:',
  },
  
  // Media storage configuration
  media: {
    storage: process.env.STORAGE_LOCATION || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/quicktime',
    ],
    imageResolutions: {
      thumbnail: { width: 200, height: 200 },
      medium: { width: 600, height: 600 },
      large: { width: 1200, height: 1200 },
    },
  },
  
  // Stripe configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    currency: process.env.STRIPE_CURRENCY || 'usd',
    subscriptionPlans: {
      basic: {
        id: process.env.STRIPE_BASIC_PLAN_ID || 'price_basic',
        name: 'Basic',
        description: 'Basic subscription with limited features',
      },
      premium: {
        id: process.env.STRIPE_PREMIUM_PLAN_ID || 'price_premium',
        name: 'Premium',
        description: 'Premium subscription with all features',
      },
    },
  },
  
  // Email configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'smtp',
    host: process.env.EMAIL_HOST || 'localhost',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASSWORD || '',
    },
    from: process.env.EMAIL_FROM || 'noreply@10date.com',
  },
  
  // Push notifications
  pushNotifications: {
    enabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
    firebaseCredentials: process.env.FIREBASE_CREDENTIALS_PATH || '',
  },
  
  // API rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // limit each IP to 100 requests per windowMs
  },
  
  // Matching algorithm parameters
  matching: {
    defaultRadius: parseInt(process.env.DEFAULT_MATCH_RADIUS || '50', 10), // in km
    maxRadius: parseInt(process.env.MAX_MATCH_RADIUS || '160', 10), // in km
    maxDailySwipes: {
      free: parseInt(process.env.MAX_DAILY_SWIPES_FREE || '100', 10),
      premium: parseInt(process.env.MAX_DAILY_SWIPES_PREMIUM || '0', 10), // 0 means unlimited
    },
    superLikesPerDay: {
      free: parseInt(process.env.SUPER_LIKES_PER_DAY_FREE || '1', 10),
      premium: parseInt(process.env.SUPER_LIKES_PER_DAY_PREMIUM || '5', 10),
    },
    boostDurationMinutes: parseInt(process.env.BOOST_DURATION_MINUTES || '30', 10),
    boostsPerDay: {
      free: parseInt(process.env.BOOSTS_PER_DAY_FREE || '0', 10),
      premium: parseInt(process.env.BOOSTS_PER_DAY_PREMIUM || '1', 10),
    },
  },
});
