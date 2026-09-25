import { NextRequest, NextResponse } from 'next/server';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getClientAuth } from '../../../../lib/firebase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = getClientAuth();
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email ve şifre gerekli' },
        { status: 400 }
      );
    }

    // Firebase ile giriş yap
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // JWT token oluştur (basit bir örnek)
    const token = await user.getIdToken();

    return NextResponse.json({
      userId: user.uid,
      token: token,
      name: user.displayName || user.email
    });

  } catch (error: any) {
    console.error('Login error:', error);
    
    // Newer Firebase SDKs report every bad email/password as auth/invalid-credential.
    if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-email'].includes(error.code)) {
      return NextResponse.json(
        { message: 'Geçersiz email veya şifre' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: 'Giriş yapılamadı' },
      { status: 500 }
    );
  }
} 