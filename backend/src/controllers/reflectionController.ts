import { Response, NextFunction } from 'express';
import { ReflectionService } from '../services/reflectionService';
import Joi from 'joi';
import { AuthenticatedRequest } from '../types';

const createReflectionSchema = Joi.object({
  date: Joi.date().required(),
  goodThings: Joi.array().items(Joi.string()).required(),
  badThings: Joi.array().items(Joi.string()).required(),
  learnings: Joi.array().items(Joi.string()).required(),
  mood: Joi.number().min(1).max(10).required(),
  productivityScore: Joi.number().min(1).max(10).required(),
});

const updateReflectionSchema = Joi.object({
  goodThings: Joi.array().items(Joi.string()),
  badThings: Joi.array().items(Joi.string()),
  learnings: Joi.array().items(Joi.string()),
  mood: Joi.number().min(1).max(10),
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

      const reflectionData = { ...req.body, userId: req.user._id };
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
      const reflections = await ReflectionService.getReflections(req.user._id);
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
}