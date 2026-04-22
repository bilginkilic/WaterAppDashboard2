'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../contexts/AdminContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Droplet, ArrowRight, ShieldCheck } from 'lucide-react';

const LOGIN_BG_VIDEO_URL = 'https://player.vimeo.com/external/371433846.sd.mp4?s=236751dd17f0f8ef6a471fbe472f7eccdd6a99f6&profile_id=164&oauth2_token_id=57447761';
const LOGIN_BG_POSTER_URL = 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1600&q=80';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAdmin();
  const { t } = useLanguage();
  const router = useRouter();

  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = login(email, password);
    if (success) {
      router.push('/dashboard');
    } else {
      setError(t.invalidCredentials);
    }
    setLoading(false);
  };

  return (
    <div className="wa-shell relative flex min-h-screen items-center justify-center overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={LOGIN_BG_POSTER_URL}
        className="absolute inset-0 h-full w-full object-cover opacity-30 dark:opacity-45"
      >
        {/* Optional local override: place /public/login-bg.mp4 and use src="/login-bg.mp4" */}
        <source src={LOGIN_BG_VIDEO_URL} type="video/mp4" />
      </video>
      <div className="absolute inset-0 wa-video-overlay pointer-events-none" />
      <div className="absolute inset-0 wa-mesh pointer-events-none" />

      <div className="absolute top-6 right-6 z-20 flex items-center gap-2 sm:top-8 sm:right-8">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 py-10">
        <div className="atv-hero-card atv-glow p-8 sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-200">
              {t.waterChallenge}
            </div>
            <div className="mb-5 mt-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/15 to-cyan-500/15 ring-1 ring-teal-500/40 dark:from-teal-500/25 dark:to-cyan-600/20 dark:ring-teal-400/30">
              <Droplet className="h-10 w-10 text-teal-600 dark:text-teal-200" strokeWidth={1.75} aria-hidden />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {t.loginTitle}
            </h1>
            <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
              {t.loginSubtitle}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400/90" strokeWidth={2} />
              {t.adminConsole}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:border-red-500/35 dark:bg-red-950/50 dark:text-red-200">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t.email}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                className="atv-focus w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 dark:border-slate-600/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500/50"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t.password}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                required
                className="atv-focus w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 dark:border-slate-600/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-teal-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 disabled:cursor-not-allowed disabled:opacity-55 dark:shadow-teal-950/40"
            >
              {loading ? t.signingIn : t.signIn}
              {!loading && (
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.25} />
              )}
            </button>
            <p className="pt-1 text-center text-xs text-slate-500 dark:text-slate-400">
              {t.authorizedAccessOnly}
            </p>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          WaterApp © {new Date().getFullYear()} · Admin v1.0
        </p>
      </div>
    </div>
  );
}
