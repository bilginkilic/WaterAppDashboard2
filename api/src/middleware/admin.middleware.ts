import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwt';


interface AdminJwtPayload {
  email: string;
  isAdmin?: boolean;
}

export const verifyAdminToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ message: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AdminJwtPayload;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    if (!ADMIN_EMAIL || !decoded.email || decoded.email !== ADMIN_EMAIL) {
      res.status(403).json({
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    if (!decoded.isAdmin) {
      res.status(403).json({
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    req.body.admin = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};
