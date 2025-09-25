import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { adminLogin, getLeaderboards, getStatistics } from '../controllers/admin.controller';
import { verifyAdminToken } from '../middleware/admin.middleware';

const router = express.Router();

// Admin login route
router.post('/login', [
  body('email').isEmail().withMessage('Email is required'),
  body('password').notEmpty().withMessage('Password is required')
], (req: Request, res: Response) => {
  void adminLogin(req, res);
});

// Protected admin routes
router.get('/leaderboards', verifyAdminToken, (req: Request, res: Response) => {
  void getLeaderboards(req, res);
});

// Statistics endpoint
router.get('/statistics', (req: Request, res: Response) => {
  void getStatistics(req, res);
});

export default router; 