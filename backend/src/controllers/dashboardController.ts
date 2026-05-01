import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService';
import { parseLocalDate } from '../utils/dateUtils';
import { AuthenticatedRequest } from '../types';

export class DashboardController {
  static async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = req.query.date ? parseLocalDate(req.query.date as string) : parseLocalDate(undefined);
      
      const stats = await DashboardService.getDashboardStats(req.user._id, date);

      res.json(stats);
    } catch (error: any) {
      next(error);
    }
  }
}
