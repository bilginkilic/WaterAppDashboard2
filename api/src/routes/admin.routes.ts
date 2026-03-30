import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { adminLogin, getLeaderboards, getStatistics } from '../controllers/admin.controller';
import { verifyAdminToken } from '../middleware/admin.middleware';

const router = express.Router();

// Admin login route
router.post('/login', [
  body('email').isEmail().withMessage('Email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req: Request, res: Response): Promise<void> => {
  void adminLogin(req, res);
});

// Protected admin routes
router.get('/leaderboards', verifyAdminToken, async (req: Request, res: Response): Promise<void> => {
  void getLeaderboards(req, res);
});

// Statistics endpoint
router.get('/statistics', async (req: Request, res: Response): Promise<void> => {
  void getStatistics(req, res);
});

export default router; 