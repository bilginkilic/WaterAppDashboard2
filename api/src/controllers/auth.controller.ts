import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { admin } from '../config/firebase';
import axios from 'axios';

interface FirebaseAuthResponse {
  localId: string;
  email: string;
  displayName?: string;
  idToken: string;
  registered: boolean;
  refreshToken: string;
  expiresIn: string;
}

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    const token = jwt.sign(
      { userId: userRecord.uid },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      userId: userRecord.uid,
      token,
      message: 'Kayıt başarılı'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    try {
      // Get Firebase Web API Key from environment variable
      const apiKey = process.env.FIREBASE_WEB_API_KEY;
      if (!apiKey) {
        console.error('Firebase Web API Key is missing');
        return res.status(500).json({ message: 'Server configuration error' });
      }

      // Sign in with Firebase Auth REST API
      const signInResponse = await axios.post<FirebaseAuthResponse>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          email,
          password,
          returnSecureToken: true
        }
      );

      if (!signInResponse.data || !signInResponse.data.localId) {
        return res.status(401).json({ message: 'Email veya şifre hatalı' });
      }

      // Get user details
      const userRecord = await admin.auth().getUser(signInResponse.data.localId);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: userRecord.uid },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        userId: userRecord.uid,
        token,
        name: userRecord.displayName
      });
    } catch (error) {
      // Firebase Authentication error
      console.error('Auth error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        return res.status(401).json({ message: 'Email veya şifre hatalı' });
      }
      return res.status(401).json({ message: 'Giriş başarısız' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Send password reset email through Firebase
    await admin.auth().generatePasswordResetLink(email);

    res.json({
      message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    // Update password through Firebase
    await admin.auth().updateUser(token, {
      password: newPassword
    });

    res.json({
      message: 'Şifre başarıyla güncellendi'
    });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
}; 