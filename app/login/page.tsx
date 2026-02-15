'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../contexts/AdminContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Droplet, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black">
      {/* Apple TV: Cinematic gradient */}
      <div className="absolute inset-0 atv-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_20%,rgba(255,255,255,0.04)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_20%_80%,rgba(255,255,255,0.03)_0%,transparent_50%)]" />

      {/* Language switcher - top right */}
      <div className="absolute top-8 right-8 z-20">
        <LanguageSwitcher />
      </div>

      {/* Login card - Apple TV floating style */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="atv-hero-card atv-glow p-10">
          {/* Logo - large, centered */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-6 shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)]">
              <Droplet className="h-10 w-10 text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-semibold text-white tracking-tight">
              {t.loginTitle}
            </h1>
            <p className="text-white/50 text-base mt-2 font-light">
              {t.loginSubtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm py-3 px-4 text-center">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-3">
                {t.email}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all duration-200 text-base"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-3">
                {t.password}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                required
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all duration-200 text-base"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-white text-black font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center justify-center gap-3 group hover:bg-white/90"
            >
              {loading ? t.signingIn : t.signIn}
              {!loading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" strokeWidth={2} />}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-sm mt-8 font-light">
          WaterApp © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
