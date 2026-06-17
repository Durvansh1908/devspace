import { Request, Response, NextFunction } from "express";

export interface ApiError extends Error {
  status?: number;
}

export const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  console.error("[Error]", err.message);

  const status = err.status || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
