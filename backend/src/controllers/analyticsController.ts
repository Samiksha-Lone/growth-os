import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { parseLocalDate } from '../utils/dateUtils';
import { localDateKey } from '../utils/dateHelpers';

export class AnalyticsController {
  static async getProductivityReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startValue = req.query.startDate;
      const endValue = req.query.endDate;
      if (typeof startValue !== 'string' || typeof endValue !== 'string') {
        res.status(400).json({ message: 'Start and end dates are required.' });
        return;
      }

      const startDate = parseLocalDate(startValue);
      const endDate = parseLocalDate(endValue);
      if (
        localDateKey(startDate) !== startValue ||
        localDateKey(endDate) !== endValue ||
        startDate > endDate
      ) {
        res.status(400).json({ message: 'Enter a valid date range.' });
        return;
      }

      const dayCount = Math.round((
        Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) -
        Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      ) / 86400000) + 1;
      if (dayCount > 366) {
        res.status(400).json({ message: 'Date ranges cannot exceed 366 days.' });
        return;
      }

      const report = await AnalyticsService.getProductivityReport(req.user._id, startDate, endDate);
      res.json(report);
    } catch (error: any) {
      next(error);
    }
  }

  static async getDailyCompletionRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = req.query.date ? parseLocalDate(req.query.date as string) : parseLocalDate(undefined);
      const rate = await AnalyticsService.getDailyCompletionRate(req.user._id, date);

      res.json({ date: date.toISOString().split('T')[0], completionRate: rate });
    } catch (error: any) {
      next(error);
    }
  }

  static async getWeeklyTrend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await AnalyticsService.getWeeklyCompletionTrend(req.user._id);
      res.json(stats);
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