import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/admin.controller';

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Kullanıcı listesi alınamadı' },
      { status: 500 }
    );
  }
} 