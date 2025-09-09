import { Request, Response, NextFunction } from 'express';
import { firebaseAdmin } from '../config/firebase';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  email?: string;
}

export const verifyAdminToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    console.log('Verifying token:', token);
    
    // JWT token'ı decode et
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
    console.log('Decoded JWT:', decoded);

    if (!decoded.userId) {
      return res.status(403).json({ message: 'Invalid token format' });
    }

    // Firebase'den kullanıcı bilgilerini al
    const userRecord = await firebaseAdmin.auth().getUser(decoded.userId);
    console.log('Firebase user:', userRecord);

    if (!userRecord.email) {
      return res.status(403).json({ 
        message: 'Access denied. No email associated with user.',
      });
    }

    if (userRecord.email !== 'admin@waterapp.com') {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.',
        userEmail: userRecord.email,
        expectedEmail: 'admin@waterapp.com'
      });
    }

    console.log('Admin access granted for:', userRecord.email);
    req.body.admin = userRecord;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(400).json({ 
      message: 'Invalid token.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 