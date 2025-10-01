import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

/**
 * Rate limiting middleware to prevent abuse
 */
const rateLimiter = new RateLimiterMemory({
  points: 50, // Number of requests
  duration: 60, // Per 60 seconds
});

const priceLimiter = new RateLimiterMemory({
  points: 10, // Number of price requests
  duration: 60, // Per 60 seconds
});

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Use stricter limits for price scraping endpoints
    const limiter = req.path.includes('/price') ? priceLimiter : rateLimiter;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    await limiter.consume(clientIp);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: secs
    });
  }
};

export { rateLimiterMiddleware as rateLimiter };
