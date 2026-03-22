import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  /** Стабильный код для локализации на клиенте (например EMAIL_NOT_VERIFIED) */
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  console.error('Error:', err);

  res.status(statusCode).json({
    status,
    message: err.message || 'Internal server error',
    ...(err.code && { code: err.code }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const createError = (
  message: string,
  statusCode: number = 400,
  code?: string
): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.status = statusCode >= 500 ? 'error' : 'fail';
  if (code) error.code = code;
  return error;
};

