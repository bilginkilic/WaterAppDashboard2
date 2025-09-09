import { Request, Response, NextFunction } from 'express';
import { firebaseAdmin } from '../config/firebase';

export const verifyAdminToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    
    if (decodedToken.email !== 'admin@waterapp.com') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    req.body.admin = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(400).json({ message: 'Invalid token.' });
  }
}; 