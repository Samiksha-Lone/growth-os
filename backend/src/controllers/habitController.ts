import { Response, NextFunction } from 'express';
import { HabitService } from '../services/habitService';
import Joi from 'joi';
import { AuthenticatedRequest } from '../types';

const createHabitSchema = Joi.object({
  name: Joi.string().required(),
});

export class HabitController {
  static async createHabit(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error } = createHabitSchema.validate(req.body);
      if (error) {
        res.status(400).json({ message: 'Validation error', errors: error.details.map(d => d.message) });
        return;
      }

      const habitData = { ...req.body, userId: req.user?._id };
      const habit = await HabitService.createHabit(habitData);

      res.status(201).json({ message: 'Habit created successfully', habit });
    } catch (error: any) {
      next(error);
    }
  }

  static async markHabitComplete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = req.body.date ? new Date(req.body.date) : new Date();
      const habit = await HabitService.markHabitComplete(req.params.id as string, req.user?._id, date);

      if (!habit) {
        res.status(404).json({ message: 'Habit not found' });
        return;
      }

      res.json({ message: 'Habit marked as complete', habit });
    } catch (error: any) {
      next(error);
    }
  }

  static async getHabitStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await HabitService.getHabitStats(req.params.id as string, req.user?._id);

      if (!stats) {
        res.status(404).json({ message: 'Habit not found' });
        return;
      }

      res.json({ stats });
    } catch (error: any) {
      next(error);
    }
  }

  static async getHabits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const habits = await HabitService.getHabits(req.user?._id);
      res.json({ habits });
    } catch (error: any) {
      next(error);
    }
  }

  static async deleteHabit(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await HabitService.deleteHabit(req.params.id as string, req.user?._id);

      if (!deleted) {
        res.status(404).json({ message: 'Habit not found' });
        return;
      }

      res.json({ message: 'Habit deleted successfully' });
    } catch (error: any) {
      next(error);
    }
  }
}