import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@waterapp.com';

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
    const decoded = jwt.verify(token, JWT_SECRET) as AdminJwtPayload;

    if (!decoded.email || decoded.email !== ADMIN_EMAIL) {
      res.status(403).json({
        message: 'Access denied. Admin privileges required.',
        userEmail: decoded.email,
        expectedEmail: ADMIN_EMAIL,
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
    res.status(401).json({
      message: 'Invalid token.',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
