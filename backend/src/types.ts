import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: any;
}