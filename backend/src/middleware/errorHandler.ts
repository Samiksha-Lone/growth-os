import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../services/authService';

export const errorHandler = (
  err: Error & { status?: number; statusCode?: number; code?: number },
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const knownHttpError = err instanceof HttpError;
  const isSafeHttpError = knownHttpError &&
    ((err.statusCode >= 400 && err.statusCode < 500) || err.statusCode === 503);
  const statusCode = knownHttpError
    ? isSafeHttpError ? err.statusCode : 500
    : err.code === 11000
      ? 409
      : typeof err.status === 'number' && err.status >= 400 && err.status < 500
        ? err.status
        : typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 500
          ? err.statusCode
          : 500;
  const safeMessages: Record<number, string> = {
    400: 'Invalid request.',
    401: 'Unauthorized.',
    403: 'Forbidden.',
    404: 'Not found.',
    409: 'A record with those details already exists.',
    413: 'Request payload is too large.',
    415: 'Unsupported request content type.',
  };
  const message = isSafeHttpError
    ? err.message
    : safeMessages[statusCode] ?? (statusCode < 500 ? 'Request could not be processed.' : 'Internal server error.');

  if (statusCode >= 500) {
    console.error(`[API ERROR] ${err.name || 'UnknownError'}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};