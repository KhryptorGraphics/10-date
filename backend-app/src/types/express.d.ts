import 'express';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface User {
      id: string;
      role?: string;
      subscriptionType?: string;
      [key: string]: any;
    }
    
    interface Request {
      user?: User;
    }
  }
}
