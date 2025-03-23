import express, { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { createInitialProfile, updateWaterprint, getProgress } from '../controllers/waterprint.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use((req: Request, res: Response, next: NextFunction) => {
  void authMiddleware(req, res, next);
});

// Create initial waterprint profile
router.post('/initial-profile',
  [
    body('answers').isArray(),
    body('correctAnswersCount').isNumeric(),
    body('initialWaterprint').isNumeric()
  ],
  (req: Request, res: Response) => {
    void createInitialProfile(req, res);
  }
);

// Update waterprint
router.post('/update',
  [
    body('taskId').exists(),
    body('waterprintReduction').isNumeric()
  ],
  (req: Request, res: Response) => {
    void updateWaterprint(req, res);
  }
);

// Get progress for a user
router.get('/progress/:userId', (req: Request, res: Response) => {
  void getProgress(req, res);
});

export default router; 