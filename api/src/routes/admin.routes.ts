import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { adminLogin, getUserList, getLeaderboards } from '../controllers/admin.controller';
import { verifyAdminToken } from '../middleware/admin.middleware';

const router = express.Router();

// Admin login route
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], (req: Request, res: Response) => {
  void adminLogin(req, res);
});

// Protected admin routes
router.get('/users', verifyAdminToken, (req: Request, res: Response) => {
  void getUserList(req, res);
});

router.get('/leaderboards', verifyAdminToken, (req: Request, res: Response) => {
  void getLeaderboards(req, res);
});

export default router; 