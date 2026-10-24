import express from 'express';
import { AuthController } from '../controllers/authController';
import auth from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const avatarsDirectory = path.resolve(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarsDirectory)) {
  fs.mkdirSync(avatarsDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDirectory);
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
    const extension = path.extname(file.originalname).toLowerCase();
    const supportedFormats: Record<string, string[]> = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    };
    if (supportedFormats[file.mimetype]?.includes(extension)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
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

// POST /api/auth/change-password
router.post('/change-password', auth as any, AuthController.changePassword);

// DELETE /api/auth/profile
router.delete('/profile', auth as any, AuthController.deleteAccount);

// POST /api/auth/avatar
router.post('/avatar', auth as any, (req, res, next) => {
  upload.single('avatar')(req, res, error => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'Image must be 1 MB or smaller.' });
      return;
    }
    if (error instanceof multer.MulterError && error.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ message: 'Choose a PNG, JPG, or WEBP image.' });
      return;
    }
    next(error);
  });
}, AuthController.uploadAvatar);

export default router;