import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

/**
 * Cache control middleware for GET requests
 * Helps reduce server load and improves response times on deployed sites
 */
export const cacheControl = (maxAge: number) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.method === 'GET') {
      // Cache for specified duration (maxAge in seconds)
      res.setHeader('Cache-Control', `private, max-age=${maxAge}`);
    }
    next();
  };
};

/**
 * Short cache for frequently changing data (5 minutes)
 */
export const cacheShort = cacheControl(5 * 60);

/**
 * Medium cache for moderately changing data (15 minutes)
 */
export const cacheMedium = cacheControl(15 * 60);

/**
 * Long cache for slowly changing data (1 hour)
 */
export const cacheLong = cacheControl(60 * 60);

/**
 * No cache for sensitive or highly dynamic data
 */
export const noCache = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
};
