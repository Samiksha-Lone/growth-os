import { Request, Response, NextFunction } from 'express';
import { RealityCheckService } from '../services/realityCheckService';

export class RealityCheckController {
  static async getRealityCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const realityCheck = await RealityCheckService.getRealityCheck(req.user._id, date);

      res.json({ realityCheck });
    } catch (error: any) {
      next(error);
    }
  }
}