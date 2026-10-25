import express from 'express';
import { AuthController } from '../controllers/authController';
import auth from '../middleware/auth';
import { createAuthRateLimit } from '../middleware/authRateLimit';

const router = express.Router();
const loginRateLimit = createAuthRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many sign-in attempts. Please try again later.',
});
const registrationRateLimit = createAuthRateLimit({
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many registration attempts. Please try again later.',
});
const passwordChangeRateLimit = createAuthRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many password change attempts. Please try again later.',
});
const accountDeletionRateLimit = createAuthRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 3,
  message: 'Too many account deletion attempts. Please try again later.',
});

// POST /api/auth/register
router.post('/register', registrationRateLimit, AuthController.register);

// POST /api/auth/login
router.post('/login', loginRateLimit, AuthController.login);

// GET /api/auth/profile
router.get('/profile', auth as any, AuthController.getProfile);

// PUT /api/auth/profile
router.put('/profile', auth as any, AuthController.updateProfile);

// POST /api/auth/change-password
router.post('/change-password', passwordChangeRateLimit, auth as any, AuthController.changePassword);

// DELETE /api/auth/profile
router.delete('/profile', accountDeletionRateLimit, auth as any, AuthController.deleteAccount);

export default router;