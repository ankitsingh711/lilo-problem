import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '../types';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response<APIResponse<never>>,
  next: NextFunction
): void => {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);

  // Default error response
  let status = 500;
  let message = 'Internal server error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    status = 400;
    message = error.message;
  } else if (error.name === 'MulterError') {
    status = 400;
    message = 'File upload error: ' + error.message;
  } else if (error.message.includes('timeout')) {
    status = 408;
    message = 'Request timeout';
  } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
    status = 503;
    message = 'Service temporarily unavailable';
  }

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};
