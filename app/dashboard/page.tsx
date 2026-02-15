'use client';

import { useRouter } from 'next/navigation';
import { useAdmin } from '../contexts/AdminContext';
import UserList from "../components/UserList";
import { LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { isAuthenticated, logout } = useAdmin();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      setChecked(true);
    }
  }, [isAuthenticated, router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-[#f0f7ff] bg-opacity-50 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Su Ayak İzi Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 bg-white/80 hover:bg-red-50 border border-gray-200 rounded-lg transition-all"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </button>
        </div>
        <UserList />
      </div>
    </main>
  );
}
