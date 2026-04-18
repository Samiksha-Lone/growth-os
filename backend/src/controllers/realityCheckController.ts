import { Response, NextFunction } from 'express';
import { RealityCheckService } from '../services/realityCheckService';
import { AuthenticatedRequest } from '../types';
import { parseLocalDate } from '../utils/dateUtils';

export class RealityCheckController {
  static async getRealityCheck(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user._id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Parse local date string (YYYY-MM-DD) safely without UTC timezone shift
      let date: Date;
      if (req.query.date) {
        date = parseLocalDate(req.query.date as string);
      } else {
        date = parseLocalDate(undefined);
      }

      const realityCheck = await RealityCheckService.getRealityCheck(req.user._id.toString(), date);
      res.json({ realityCheck });
    } catch (error: any) {
      next(error);
    }
  }
}