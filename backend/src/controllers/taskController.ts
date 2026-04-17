import { Response, NextFunction } from 'express';
import { TaskService } from '../services/taskService';
import Joi from 'joi';
import { AuthenticatedRequest } from '../types';

const createTaskSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  category: Joi.string().valid('Work', 'Study', 'Health', 'Personal').default('Personal'),
  priority: Joi.string().valid('High', 'Medium', 'Low').default('Medium'),
  status: Joi.string().valid('Pending', 'In Progress', 'Completed', 'Missed').default('Pending'),
  date: Joi.date().default(() => new Date()).description('current date'),
  notes: Joi.string().allow('').default(''),
});

const updateTaskSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  category: Joi.string().valid('Work', 'Study', 'Health', 'Personal'),
  priority: Joi.string().valid('High', 'Medium', 'Low'),
  status: Joi.string().valid('Pending', 'In Progress', 'Completed', 'Missed'),
  date: Joi.date(),
  notes: Joi.string(),
});

export class TaskController {
  static async createTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { value, error } = createTaskSchema.validate(req.body, { abortEarly: false, convert: true });
      if (error) {
        res.status(400).json({ message: 'Validation error', errors: error.details.map(d => d.message) });
        return;
      }

      const taskData = { ...value, userId: req.user?._id };
      const task = await TaskService.createTask(taskData);

      res.status(201).json({ message: 'Task created successfully', task });
    } catch (error: any) {
      next(error);
    }
  }

  static async getTasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date, status, category, priority } = req.query;
      const filters = { date: date as string, status: status as string, category: category as string, priority: priority as string };
      const tasks = await TaskService.getTasks(req.user?._id, filters);

      res.json({ tasks });
    } catch (error: any) {
      next(error);
    }
  }

  static async updateTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { value, error } = updateTaskSchema.validate(req.body);
      if (error) {
        res.status(400).json({ message: 'Validation error', errors: error.details.map(d => d.message) });
        return;
      }

      const task = await TaskService.updateTask(req.params.id as string, req.user?._id, value);

      if (!task) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }

      res.json({ message: 'Task updated successfully', task });
    } catch (error: any) {
      next(error);
    }
  }

  static async deleteTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await TaskService.deleteTask(req.params.id as string, req.user?._id);

      if (!deleted) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }

      res.json({ message: 'Task deleted successfully' });
    } catch (error: any) {
      next(error);
    }
  }
}