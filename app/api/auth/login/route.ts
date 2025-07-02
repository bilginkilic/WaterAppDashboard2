import { NextRequest, NextResponse } from 'next/server';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../../lib/firebase';

export async function POST(request: NextRequest) {
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
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return NextResponse.json(
        { message: 'Geçersiz email veya şifre' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: 'Giriş yapılamadı', error: error.message },
      { status: 500 }
    );
  }
} 