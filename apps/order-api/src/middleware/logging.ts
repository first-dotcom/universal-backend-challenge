import { NextFunction, Request, Response } from "express";
import { logError, logRequest } from "shared/lib/logger";
import { v4 as uuidv4 } from "uuid";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      traceId: string;
      startTime: number;
    }
  }
}

// Paths to skip logging (too noisy)
const SKIP_LOGGING_PATHS = ["/health", "/health/live", "/health/ready"];

// Single consolidated logging middleware
export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Always add correlation ID and timing
  req.traceId = (req.headers["x-trace-id"] as string) || uuidv4();
  req.startTime = Date.now();
  res.setHeader("x-trace-id", req.traceId);

  // Log everything except skipped paths
  const shouldLog = !SKIP_LOGGING_PATHS.includes(req.path);

  if (shouldLog) {
    // Wrap res.send to log when request completes
    const originalSend = res.send;
    res.send = function (body) {
      const duration = Date.now() - req.startTime;
      logRequest(req.method, req.url, duration, res.statusCode, req.traceId);
      return originalSend.call(this, body);
    };
  }

  next();
};

// Error logging middleware
export const logErrors = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logError("Request Error", error, {
    traceId: req.traceId,
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
  });

  next(error);
};
