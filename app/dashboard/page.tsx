'use client';

import Image from 'next/image';
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-500/25 border-t-teal-500 dark:border-teal-500/25 dark:border-t-teal-400" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{t.loading}</span>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const heroImageUrl = 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=2000&q=80';

  return (
    <div className="wa-shell min-h-screen">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-md dark:border-teal-500/15 dark:bg-slate-950/90 dark:shadow-black/20 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/15 ring-1 ring-teal-500/30 dark:from-teal-600/35 dark:to-cyan-700/25">
              <Droplet className="h-5 w-5 text-teal-600 dark:text-teal-200" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                  {t.dashboardTitle}
                </h1>
                <span className="hidden rounded-md border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-200/95 sm:inline">
                  {t.waterChallenge}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">{t.adminConsole}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-teal-500/25 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-700 dark:text-teal-200 md:inline-flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500 dark:bg-teal-300" />
              {t.verifiedLive}
            </div>
            <LanguageSwitcher />
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-500/40 hover:text-slate-900 dark:border-slate-600/50 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-teal-500/30 dark:hover:bg-slate-800 dark:hover:text-white sm:px-4"
            >
              <LogOut className="h-4 w-4 text-teal-600 dark:text-teal-400/80" strokeWidth={2} />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 pb-16 pt-20 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-7xl">
          <section className="mb-6 md:mb-8">
            <div className="wa-hero-banner hidden md:block">
              <Image
                src={heroImageUrl}
                alt="Water challenge hero"
                width={2000}
                height={560}
                priority
                className="h-56 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/55 to-transparent dark:from-slate-950/85 dark:via-slate-950/55 dark:to-transparent" />
              <div className="absolute inset-0 flex items-end justify-between gap-6 p-6">
                <div className="max-w-xl">
                  <span className="inline-flex items-center rounded-full border border-teal-500/40 bg-teal-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-200">
                    {t.heroKicker}
                  </span>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t.dashboardTitle}
                  </h2>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-200/90">
                    {t.heroSubtitle}
                  </p>
                </div>
                <div className="rounded-xl border border-teal-500/25 bg-white/80 px-4 py-3 text-right shadow-sm backdrop-blur-sm dark:bg-slate-900/75">
                  <p className="text-[11px] uppercase tracking-wide text-teal-700 dark:text-teal-200/90">{t.todaySavings}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">--</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-teal-500/20 dark:bg-slate-900/80 md:hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-200">{t.heroKicker}</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{t.dashboardTitle}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.heroSubtitle}</p>
            </div>
          </section>
          <UserList />
          <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
            WaterApp © {new Date().getFullYear()} · Admin v1.0
          </p>
        </div>
      </main>
    </div>
  );
}
