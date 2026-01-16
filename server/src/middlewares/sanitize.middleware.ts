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
    const sanitizedQuery = sanitizeObject(req.query);
    Object.keys(sanitizedQuery).forEach(key => {
      req.query![key] = sanitizedQuery[key];
    });
  }

  // Sanitize URL parameters (params is readonly)
  if (req.params && typeof req.params === 'object') {
    const sanitizedParams = sanitizeObject(req.params);
    Object.keys(sanitizedParams).forEach(key => {
      req.params![key] = sanitizedParams[key];
    });
  }

  next();
};
