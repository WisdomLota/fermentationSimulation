/**
 * Request Logger Middleware
 *
 * Logs incoming API requests with method, path, and response time.
 * Useful during development for debugging simulation performance.
 */

import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const path = req.path;

    // Color-code status: green for 2xx, yellow for 4xx, red for 5xx
    const statusColor = status < 400 ? '\x1b[32m' : status < 500 ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(
      `  ${method.padEnd(6)} ${path.padEnd(30)} ${statusColor}${status}${reset}  ${duration}ms`
    );
  });

  next();
}
