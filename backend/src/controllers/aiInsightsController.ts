import { Request, Response, NextFunction } from 'express';
import { AIInsightsService } from '../services/aiInsightsService';
import Insight from '../models/Insight';

export class AIInsightsController {
  static async getInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const insights = await AIInsightsService.generateInsights(req.user._id);

      res.json(insights);
    } catch (error: any) {
      next(error);
    }
  }

  static async dismissInsight(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { insightId } = req.params;
      
      const insight = await Insight.findByIdAndUpdate(
        insightId,
        {
          dismissed: true,
          dismissedAt: new Date(),
        },
        { new: true }
      );

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
      const limit = parseInt(req.query.limit as string) || 50;
      const type = req.query.type as string;
      const metric = req.query.metric as string;

      const query: any = { userId: req.user._id };
      if (type) query.type = type;
      if (metric) query.metric = metric;

      const insights = await Insight.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('relatedGoalId', 'text type');

      res.json({ insights, total: insights.length });
    } catch (error: any) {
      next(error);
    }
  }

  static async getInsightStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const insights = await Insight.find({
        userId: req.user._id,
        createdAt: { $gte: thirtyDaysAgo },
      });

      const stats = {
        total: insights.length,
        byType: {} as Record<string, number>,
        bySeverity: {} as Record<string, number>,
        actionable: 0,
        dismissed: 0,
        avgConfidence: 0,
      };

      let totalConfidence = 0;
      insights.forEach(insight => {
        stats.byType[insight.type] = (stats.byType[insight.type] || 0) + 1;
        stats.bySeverity[insight.severity] = (stats.bySeverity[insight.severity] || 0) + 1;
        if (insight.actionable) stats.actionable++;
        if (insight.dismissed) stats.dismissed++;
        totalConfidence += insight.confidence;
      });

      stats.avgConfidence = insights.length > 0 ? totalConfidence / insights.length : 0;

      res.json(stats);
    } catch (error: any) {
      next(error);
    }
  }
}