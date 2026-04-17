import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService';

export class AnalyticsController {
  static async getDailyCompletionRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const rate = await AnalyticsService.getDailyCompletionRate(req.user._id, date);

      res.json({ date: date.toISOString().split('T')[0], completionRate: rate });
    } catch (error: any) {
      next(error);
    }
  }

  static async getWeeklyStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
      const stats = await AnalyticsService.getWeeklyStats(req.user._id, startDate);

      res.json({ stats });
    } catch (error: any) {
      next(error);
    }
  }

  static async getMonthlyStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = parseInt(req.params.month as string);
      const year = parseInt(req.params.year as string);
      const stats = await AnalyticsService.getMonthlyStats(req.user._id, month, year);

      res.json({ stats });
    } catch (error: any) {
      next(error);
    }
  }

  static async getHabitConsistency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const consistency = await AnalyticsService.getHabitConsistency(req.user._id);

      res.json({ habitConsistencyPercentage: consistency });
    } catch (error: any) {
      next(error);
    }
  }

  static async getMoodTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const trends = await AnalyticsService.getMoodTrends(req.user._id, days);

      res.json({ trends });
    } catch (error: any) {
      next(error);
    }
  }
}