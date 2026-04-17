import { Request, Response, NextFunction } from 'express';
import { AIInsightsService } from '../services/aiInsightsService';

export class AIInsightsController {
  static async getInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const insights = await AIInsightsService.generateInsights(req.user._id);

      res.json({ insights });
    } catch (error: any) {
      next(error);
    }
  }
}