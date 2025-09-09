import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AdminTokenPayload {
  email: string;
  isAdmin: boolean;
}

export const verifyAdminToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    
    if (decodedToken.email !== 'admin@waterapp.com') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    req.body.admin = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
}; 