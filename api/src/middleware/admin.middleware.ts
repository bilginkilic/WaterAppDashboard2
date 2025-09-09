import { Request, Response, NextFunction } from 'express';
import { firebaseAdmin } from '../config/firebase';

export const verifyAdminToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    console.log('Verifying token:', token);
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    console.log('Decoded token:', decodedToken);
    
    if (decodedToken.email !== 'admin@waterapp.com') {
      console.log('Access denied. User email:', decodedToken.email);
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    console.log('Admin access granted for:', decodedToken.email);
    req.body.admin = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(400).json({ 
      message: 'Invalid token.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 