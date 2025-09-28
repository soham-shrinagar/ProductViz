import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', error);

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.issues
    });
  }

  if (error.response?.status === 404) {
    return res.status(404).json({
      success: false,
      error: 'Repository not found'
    });
  }

  if (error.response?.status === 403) {
    return res.status(403).json({
      success: false,
      error: 'GitHub API rate limit exceeded'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}

