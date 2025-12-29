import type { Request, Response, NextFunction } from 'express';
import { valkey } from './valkey.ts';

export interface RateLimiterOptions {
  keyPrefix?: string;
  windowSeconds?: number;
  maxRequests?: number;
  /** If true, allow requests when Valkey is down instead of blocking users */
  allowOnFail?: boolean;
}

/**
 * createRateLimiter returns an Express middleware that enforces a fixed-window rate limit
 * per-key (typically per-user). It uses Valkey (Redis-compatible) INCR + EXPIRE.
 */
export function createRateLimiter(options: RateLimiterOptions = {}) {
  const keyPrefix = options.keyPrefix ?? 'rate';
  const windowSeconds = options.windowSeconds ?? 60 * 60; // default 1 hour
  const maxRequests = options.maxRequests ?? 10;
  const allowOnFail = options.allowOnFail ?? true;

  return async function rateLimiter(req: Request, res: Response, next: NextFunction) {
    // Prefer authenticated user id, fall back to ip address
    // req.user may be provided by auth middleware
    const userId = (req.user as any)?.id || req.ip;

    if (!userId) {
      return res.status(400).json({ ok: false, message: 'Rate limiter: unable to determine client id' });
    }

    const key = `${keyPrefix}:${userId}`;

    try {
      // Increment the counter atomically
      const count = await valkey.incr(key);

      // If this is the first increment, set the expiry window
      if (count === 1) {
        try {
          await valkey.expire(key, windowSeconds);
        } catch (err) {
          // non-fatal, just log
          console.warn('RateLimiter: failed to set expiry on key', key, err);
        }
      }

      // Set rate limit headers for the client
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));

      if (count > maxRequests) {
        // Optionally include time-to-reset to help clients
        let ttl = -1;
        try {
          ttl = await valkey.ttl(key);
        } catch (err) {
          // ignore ttl error
        }

        if (ttl > 0) res.setHeader('Retry-After', ttl);

        return res.status(429).json({
          ok: false,
          message: `Rate limit exceeded. Try again in ${ttl > 0 ? ttl + 's' : 'a while'}`,
        });
      }

      // All good
      return next();
    } catch (err) {
      // If Valkey is down and allowOnFail is true, allow the request to proceed.
      console.warn('RateLimiter: valkey error', err);
      if (allowOnFail) return next();
      return res.status(503).json({ ok: false, message: 'Rate limiter currently unavailable' });
    }
  };
}

export default createRateLimiter;
