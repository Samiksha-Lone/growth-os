import { Request, Response, NextFunction } from 'express';
import { InsightsService } from '../services/insightsService';

export class InsightsController {
  static async getInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user._id?.toString() || req.user._id;
   
      const insights = await InsightsService.generateInsights(userId);
      
      res.json(insights);
    } catch (error: any) {
      console.error('Error generating insights:', error);
      next(error);
    }
  }

  static async dismissInsight(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const insightId = Array.isArray(req.params.insightId) 
        ? req.params.insightId[0] 
        : req.params.insightId;
      
      const insight = await InsightsService.dismissInsight(insightId);

      if (!insight) {
        res.status(404).json({ error: 'Insight not found' });
        return;
      }

      res.json({ insight });
    } catch (error: any) {
      next(error);
    }
  }

  static async getInsightHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user._id?.toString() || req.user._id;
      const limit = parseInt(req.query.limit as string) || 50;
      const type = req.query.type as string;
      const metric = req.query.metric as string;

      const insights = await InsightsService.getInsightHistory(
        userId,
        limit,
        type,
        metric
      );

      res.json({ insights });
    } catch (error: any) {
      next(error);
    }
  }

  static async getInsightStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user._id?.toString() || req.user._id;
      const stats = await InsightsService.getInsightStats(userId);
      res.json(stats);
    } catch (error: any) {
      next(error);
    }
  }
}
