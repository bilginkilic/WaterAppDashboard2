'use client';

import { useRouter } from 'next/navigation';
import { useAdmin } from '../contexts/AdminContext';
import { useLanguage } from '../contexts/LanguageContext';
import UserList from '../components/UserList';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { LogOut, Droplet } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { isAuthenticated, logout } = useAdmin();
  const { t } = useLanguage();
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <span className="text-sm text-white/40 font-light">Loading</span>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Apple TV: Minimal floating nav */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Droplet className="h-5 w-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">
                {t.dashboardTitle}
              </h1>
              <p className="text-xs text-white/40 font-light">Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm font-medium"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content - generous top padding for fixed nav */}
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <UserList />
        </div>
      </main>
    </div>
  );
}
