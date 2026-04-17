import { Request, Response, NextFunction } from 'express';
import { GoalService } from '../services/goalService';
import Joi from 'joi';
import { AuthenticatedRequest } from '../types';

const createGoalSchema = Joi.object({
  text: Joi.string().required(),
  type: Joi.string().valid('goal', 'affirmation').required(),
});

export class GoalController {
  static async addGoal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error } = createGoalSchema.validate(req.body);
      if (error) {
        res.status(400).json({ message: 'Validation error', errors: error.details.map(d => d.message) });
        return;
      }

      const goalData = { ...req.body, userId: req.user._id };
      const goal = await GoalService.addGoal(goalData);

      res.status(201).json({ message: 'Goal added successfully', goal });
    } catch (error: any) {
      next(error);
    }
  }

  static async getGoals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const goals = await GoalService.getGoals(req.user._id);
      res.json({ goals });
    } catch (error: any) {
      next(error);
    }
  }

  static async deleteGoal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await GoalService.deleteGoal(req.params.id as string, req.user._id);

      if (!deleted) {
        res.status(404).json({ message: 'Goal not found' });
        return;
      }

      res.json({ message: 'Goal deleted successfully' });
    } catch (error: any) {
      next(error);
    }
  }
}