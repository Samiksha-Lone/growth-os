import { Request, Response, NextFunction } from 'express';
import { PomodoroService } from '../services/pomodoroService';
import { invalidateDashboardCache } from '../utils/cache';
import Joi from 'joi';
import { parseLocalDate, buildLocalDateRange } from '../utils/dateUtils';

const createSessionSchema = Joi.object({
  duration: Joi.number().min(1).required(),
  date: Joi.date().required(),
});

export class PomodoroController {
  static async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error } = createSessionSchema.validate(req.body);
      if (error) {
        res.status(400).json({ message: 'Validation error', errors: error.details.map(d => d.message) });
        return;
      }

      const sessionData = { ...req.body, userId: req.user._id };
      const session = await PomodoroService.createSession(sessionData);

      // Invalidate dashboard cache when pomodoro session is created
      invalidateDashboardCache(req.user._id);

      res.status(201).json({ message: 'Pomodoro session created successfully', session });
    } catch (error: any) {
      next(error);
    }
  }

  static async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = req.query.date ? parseLocalDate(req.query.date as string) : undefined;
      const sessions = await PomodoroService.getSessions(req.user._id, date);

      res.json({ sessions });
    } catch (error: any) {
      next(error);
    }
  }

  static async getTotalFocusTime(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startDate = req.query.startDate ? parseLocalDate(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? parseLocalDate(req.query.endDate as string) : undefined;
      const { startDate: start, endDate: end } = buildLocalDateRange(startDate, endDate);
      const totalTime = await PomodoroService.getTotalFocusTime(req.user._id, start, end);

      res.json({ totalFocusTime: totalTime });
    } catch (error: any) {
      next(error);
    }
  }
}