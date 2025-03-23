import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { register, login, forgotPassword, resetPassword } from '../controllers/auth.controller';

const router = express.Router();

// Register route
router.post('/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty()
  ],
  (req: Request, res: Response) => {
    void register(req, res);
  }
);

// Login route
router.post('/login',
  [
    body('email').isEmail(),
    body('password').exists()
  ],
  (req: Request, res: Response) => {
    void login(req, res);
  }
);

// Forgot password route
router.post('/forgot-password',
  [
    body('email').isEmail()
  ],
  (req: Request, res: Response) => {
    void forgotPassword(req, res);
  }
);

// Reset password route
router.post('/reset-password',
  [
    body('token').exists(),
    body('newPassword').isLength({ min: 6 })
  ],
  (req: Request, res: Response) => {
    void resetPassword(req, res);
  }
);

export default router; 