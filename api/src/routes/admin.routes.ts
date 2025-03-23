import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { adminLogin, getUserList, getLeaderboards, getUsers, getStatistics } from '../controllers/admin.controller';
import { verifyAdminToken } from '../middleware/admin.middleware';

const router = express.Router();

// Admin login route
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Geçerli bir email adresi giriniz'),
    body('password').notEmpty().withMessage('Şifre gereklidir'),
  ],
  (req: Request, res: Response) => {
    void adminLogin(req, res);
  }
);

// Protected admin routes
router.get('/users', verifyAdminToken, getUsers);
router.get('/leaderboards', verifyAdminToken, (req: Request, res: Response) => {
  void getLeaderboards(req, res);
});
router.get('/statistics', verifyAdminToken, getStatistics);

export default router; 