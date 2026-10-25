import { Response, NextFunction } from 'express';
import { ReflectionService } from '../services/reflectionService';
import { localDateKey } from '../utils/dateHelpers';
import { parseLocalDate } from '../utils/dateUtils';
import Joi from 'joi';
import { AuthenticatedRequest } from '../types';

const createReflectionSchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  goodThings: Joi.array().items(Joi.string()).default([]),
  badThings: Joi.array().items(Joi.string()).default([]),
  learnings: Joi.array().items(Joi.string()).default([]),
  notes: Joi.string().max(10000).allow(''),
  mood: Joi.number().min(1).max(3).allow(null),
  productivityScore: Joi.number().min(1).max(10),
});

const updateReflectionSchema = Joi.object({
  goodThings: Joi.array().items(Joi.string()),
  badThings: Joi.array().items(Joi.string()),
  learnings: Joi.array().items(Joi.string()),
  notes: Joi.string().max(10000).allow(''),
  mood: Joi.number().min(1).max(10).allow(null),
  productivityScore: Joi.number().min(1).max(10),
});

export class ReflectionController {
  static async createReflection(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error } = createReflectionSchema.validate(req.body);
      if (error) {
        res.status(400).json({ message: 'Validation error', errors: error.details.map(d => d.message) });
        return;
      }

      const date = parseLocalDate(req.body.date);
      if (localDateKey(date) !== req.body.date) {
        res.status(400).json({ message: 'Validation error', errors: ['Date must be a valid local calendar date'] });
        return;
      }

      const reflectionData = {
        ...req.body,
        date,
        userId: req.user._id,
      };
      const reflection = await ReflectionService.createReflection(reflectionData);

      res.status(201).json({ message: 'Reflection created successfully', reflection });
    } catch (error: any) {
      next(error);
    }
  }

  static async getReflectionByDate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.params;
      const reflection = await ReflectionService.getReflectionByDate(req.user._id, date as string);

      if (!reflection) {
        res.status(404).json({ message: 'Reflection not found for this date' });
        return;
      }

      res.json({ reflection });
    } catch (error: any) {
      next(error);
    }
  }

  static async getReflections(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = 30, skip = 0 } = req.query;
      const pageLimit = Math.min(parseInt(limit as string) || 30, 100);
      const pageSkip = parseInt(skip as string) || 0;
      
      const reflections = await ReflectionService.getReflections(req.user._id, pageLimit, pageSkip);
      res.json({ reflections });
    } catch (error: any) {
      next(error);
    }
  }

  static async updateReflection(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error } = updateReflectionSchema.validate(req.body);
      if (error) {
        res.status(400).json({ message: 'Validation error', errors: error.details.map(d => d.message) });
        return;
      }

      const reflection = await ReflectionService.updateReflection(req.params.id as string, req.user._id, req.body);

      if (!reflection) {
        res.status(404).json({ message: 'Reflection not found' });
        return;
      }

      res.json({ message: 'Reflection updated successfully', reflection });
    } catch (error: any) {
      next(error);
    }
  }

  static async deleteReflection(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await ReflectionService.deleteReflection(req.params.id as string, req.user._id);
      if (!deleted) {
        res.status(404).json({ message: 'Journal entry not found' });
        return;
      }

      res.json({ message: 'Journal entry deleted successfully' });
    } catch (error: any) {
      next(error);
    }
  }
}