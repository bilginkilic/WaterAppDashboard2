import express, { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { register, login, forgotPassword, resetPassword, deleteAccount } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

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

// Delete account route
router.delete('/delete-account',
  (req: Request, res: Response, next: NextFunction) => {
    void authMiddleware(req, res, next);
  },
  (req: Request, res: Response) => {
    void deleteAccount(req, res);
  }
);

export default router; 