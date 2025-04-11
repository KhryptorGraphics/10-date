import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark controller routes as public
 * This bypasses authentication for the decorated endpoint
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
