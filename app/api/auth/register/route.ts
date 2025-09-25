import { NextRequest, NextResponse } from 'next/server';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../../../lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { message: 'Email, şifre ve isim gerekli' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Şifre en az 6 karakter olmalı' },
        { status: 400 }
      );
    }

    // Firebase ile kullanıcı oluştur
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Kullanıcı profilini güncelle
    await updateProfile(user, {
      displayName: name
    });

    // JWT token oluştur
    const token = await user.getIdToken();

    return NextResponse.json({
      userId: user.uid,
      token: token,
      message: 'Kayıt başarılı'
    });

  } catch (error: any) {
    console.error('Register error:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      return NextResponse.json(
        { message: 'Bu email adresi zaten kullanımda' },
        { status: 400 }
      );
    }

    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { message: 'Şifre çok zayıf' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Kayıt yapılamadı', error: error.message },
      { status: 500 }
    );
  }
} 