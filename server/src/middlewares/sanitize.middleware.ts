import type { Request, Response, NextFunction } from 'express';
import { sanitizeObject } from '../utils/sanitize.ts';

/**
 * Middleware to sanitize request body, query, and params
 * Protects against XSS attacks by removing potentially dangerous content
 */
export const sanitizeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};
