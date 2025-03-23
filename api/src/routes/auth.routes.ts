import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { register, login, forgotPassword, resetPassword } from '../controllers/auth.controller';

const router = express.Router();

// Register route
router.post('/register',
  [
    body('email').isEmail().withMessage('Geçerli bir email adresi giriniz'),
    body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır'),
    body('name').notEmpty().withMessage('İsim alanı boş bırakılamaz')
  ],
  (req: Request, res: Response) => {
    void register(req, res);
  }
);

// Login route
router.post('/login',
  [
    body('email').isEmail().withMessage('Geçerli bir email adresi giriniz'),
    body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır')
  ],
  (req: Request, res: Response) => {
    void login(req, res);
  }
);

// Forgot password route
router.post('/forgot-password',
  [
    body('email').isEmail().withMessage('Geçerli bir email adresi giriniz')
  ],
  (req: Request, res: Response) => {
    void forgotPassword(req, res);
  }
);

// Reset password route
router.post('/reset-password',
  [
    body('token').exists().withMessage('Token gereklidir'),
    body('newPassword').isLength({ min: 6 }).withMessage('Yeni şifre en az 6 karakter olmalıdır')
  ],
  (req: Request, res: Response) => {
    void resetPassword(req, res);
  }
);

export default router; 