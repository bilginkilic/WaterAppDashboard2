import { Request, Response, NextFunction } from 'express';
import { firebaseAdmin } from '../config/firebase';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  email?: string;
}

export const verifyAdminToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ message: 'Access denied. No token provided.' });
    return;
  }

  try {
    console.log('Verifying token:', token);
    
    // Firebase token'ı doğrula
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    console.log('Decoded token:', decodedToken);

    // Admin kontrolü
    if (!decodedToken.email || decodedToken.email !== 'admin@waterapp.com') {
      console.log('Access denied. User email:', decodedToken.email);
      res.status(403).json({ 
        message: 'Access denied. Admin privileges required.',
        userEmail: decodedToken.email,
        expectedEmail: 'admin@waterapp.com'
      });
      return;
    }

    // Admin claim kontrolü
    if (!decodedToken.admin) {
      console.log('Access denied. No admin claim');
      res.status(403).json({ 
        message: 'Access denied. Admin privileges required.'
      });
      return;
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