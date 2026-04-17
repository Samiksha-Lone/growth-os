import express from 'express';
import { AuthController } from '../controllers/authController';
import auth from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 1024 * 1024 }, // Limit to 1MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// POST /api/auth/register
router.post('/register', AuthController.register);

// POST /api/auth/login
router.post('/login', AuthController.login);

// GET /api/auth/profile
router.get('/profile', auth as any, AuthController.getProfile);

// PUT /api/auth/profile
router.put('/profile', auth as any, AuthController.updateProfile);

// DELETE /api/auth/profile
router.delete('/profile', auth as any, AuthController.deleteAccount);

// POST /api/auth/avatar
router.post('/avatar', auth as any, upload.single('avatar'), AuthController.uploadAvatar);

export default router;