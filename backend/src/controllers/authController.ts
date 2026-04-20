import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import Joi from 'joi';
import User from '../models/User';

const registerSchema = Joi.object({
  name: Joi.string()
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Name must only contain alphabets and spaces',
    }),
  email: Joi.string().email().required(),
  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      'string.pattern.base': 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const profileUpdateSchema = Joi.object({
  name: Joi.string()
    .pattern(/^[a-zA-Z\s]+$/)
    .optional()
    .messages({
      'string.pattern.base': 'Name must only contain alphabets and spaces',
    }),
  email: Joi.string().email().optional(),
  githubUrl: Joi.string().allow('', null).optional(),
  linkedinUrl: Joi.string().allow('', null).optional(),
  portfolioUrl: Joi.string().allow('', null).optional(),
  avatarUrl: Joi.string().allow('', null).optional(),
});

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error } = registerSchema.validate(req.body);
      if (error) {
        res.status(400).json({ message: 'Validation error', errors: error.details.map(d => d.message) });
        return;
      }

      const { name, email, password } = req.body;
      const { user, token } = await AuthService.register(name, email, password);

      res.status(201).json({
        message: 'User registered successfully',
        user: { id: user._id, name: user.name, email: user.email },
        token,
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error } = loginSchema.validate(req.body);
      if (error) {
        res.status(400).json({ message: 'Validation error', errors: error.details.map(d => d.message) });
        return;
      }

      const { email, password } = req.body;
      const { user, token } = await AuthService.login(email, password);

      res.json({
        message: 'Login successful',
        user: { id: user._id, name: user.name, email: user.email },
        token,
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async getProfile(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user._id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      const user = await User.findById(req.user._id).select('-password');
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.json({ user });
    } catch (error: any) {
      next(error);
    }
  }

  static async uploadAvatar(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user._id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatarUrl } },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({
        message: 'Avatar uploaded successfully',
        user: updatedUser
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async updateProfile(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error } = profileUpdateSchema.validate(req.body);
      if (error) {
        res.status(400).json({ message: 'Validation error', errors: error.details.map(d => d.message) });
        return;
      }

      if (!req.user || !req.user._id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { name, email, githubUrl, linkedinUrl, portfolioUrl, avatarUrl } = req.body;
      
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            name: name || req.user.name,
            email: email || req.user.email,
            githubUrl,
            linkedinUrl,
            portfolioUrl,
            avatarUrl
          }
        },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({
        message: 'Profile updated successfully',
        user: { 
          id: updatedUser._id, 
          name: updatedUser.name, 
          email: updatedUser.email,
          githubUrl: updatedUser.githubUrl,
          linkedinUrl: updatedUser.linkedinUrl,
          portfolioUrl: updatedUser.portfolioUrl,
          avatarUrl: updatedUser.avatarUrl
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async deleteAccount(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user._id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      await User.findByIdAndDelete(req.user._id);
      
      // Note: In a production app, we would also delete the user's tasks, habits, etc.
      // For now, removing the user is the primary requirement.

      res.json({ message: 'Account deleted successfully' });
    } catch (error: any) {
      next(error);
    }
  }
}