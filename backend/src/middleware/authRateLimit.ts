import { NextFunction, Request, Response } from 'express';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function createAuthRateLimit({ windowMs, maxRequests, message }: RateLimitOptions) {
  const clients = new Map<string, RateLimitEntry>();
  let requestsSinceCleanup = 0;

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const clientIp = req.socket.remoteAddress ?? 'unknown';
    let entry = clients.get(clientIp);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      clients.set(clientIp, entry);
    }

    entry.count += 1;
    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      res.status(429).json({ success: false, message });
      return;
    }

    requestsSinceCleanup += 1;
    if (requestsSinceCleanup >= 1024) {
      requestsSinceCleanup = 0;
      for (const [ip, client] of clients) {
        if (client.resetAt <= now) clients.delete(ip);
      }
    }

    next();
  };
}
