'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Apple, CheckCircle2, Droplet, Smartphone } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const APP_STORE_URL = 'https://apps.apple.com/tr/app/waterapp-v2/id6745251786';
const NETLIFY_FORM_NAME = 'android-tester';

type Status = 'idle' | 'sending' | 'success' | 'error' | 'invalid';

function QrCode({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="hidden flex-col items-center gap-2 sm:flex">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={148} height={148} className="rounded-xl border border-slate-200 bg-white p-2" />
      <figcaption className="text-xs text-slate-500">{caption}</figcaption>
    </figure>
  );
}

export default function DownloadPage() {
  const { t, setLang } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState(''); // honeypot
  const [status, setStatus] = useState<Status>('idle');

  // Katılımcılar Türkiye'de: dil tercihi kaydedilmemişse Türkçe aç.
  useEffect(() => {
    try {
      if (!localStorage.getItem('lang')) setLang('tr');
    } catch {
      /* ignore */
    }
  }, [setLang]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (trimmedName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
      setStatus('invalid');
      return;
    }
    if (company) {
      // Bot doldurdu: hiçbir yere gönderme.
      setStatus('success');
      return;
    }
    setStatus('sending');

    const saved = fetch('/api/android-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmedName, email: trimmedEmail }),
    }).then((res) => res.ok);

    // Netlify Forms e-posta bildirimi için; başarısız olsa da kayıt API'de.
    const notified = fetch('/__forms.html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'form-name': NETLIFY_FORM_NAME,
        name: trimmedName,
        email: trimmedEmail,
        organization: 'MUFG Turkey',
        company: '',
      }).toString(),
    }).then((res) => res.ok, () => false);

    const [savedOk, notifiedOk] = await Promise.all([saved.catch(() => false), notified]);
    setStatus(savedOk || notifiedOk ? 'success' : 'error');
  };

  return (
    <div className="wa-shell min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/15 ring-1 ring-teal-500/30">
            <Droplet className="h-5 w-5 text-teal-600" strokeWidth={2} />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">WaterApp</span>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <section className="mb-8 text-center sm:mb-10">
          <span className="inline-flex items-center rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700">
            {t.dlKicker}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{t.dlTitle}</h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">{t.dlSubtitle}</p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="atv-card flex flex-col p-6" aria-labelledby="ios-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="ios-title" className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                  <Apple className="h-5 w-5" strokeWidth={1.8} /> {t.dlIosTitle}
                </h2>
                <p className="mt-2 text-sm text-slate-600">{t.dlIosText}</p>
              </div>
              <QrCode src="/qr/ios.svg" alt="App Store QR" caption={t.dlScan} />
            </div>
            <a
              href={APP_STORE_URL}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-base font-semibold text-white transition hover:bg-slate-800"
            >
              <Apple className="h-5 w-5" strokeWidth={1.8} /> {t.dlIosButton}
            </a>
          </section>

          <section id="android" className="atv-card scroll-mt-6 p-6" aria-labelledby="android-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="android-title" className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                  <Smartphone className="h-5 w-5" strokeWidth={1.8} /> {t.dlAndroidTitle}
                </h2>
                <p className="mt-2 text-sm text-slate-600">{t.dlAndroidText}</p>
              </div>
              <QrCode src="/qr/android.svg" alt="Android QR" caption={t.dlScan} />
            </div>

            <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-700">
              <li>{t.dlAndroidStep1}</li>
              <li>{t.dlAndroidStep2}</li>
              <li>{t.dlAndroidStep3}</li>
            </ol>

            {status === 'success' ? (
              <p role="status" className="mt-6 flex items-start gap-2 rounded-xl bg-teal-50 p-4 text-sm font-medium text-teal-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> {t.dlSuccess}
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                <div>
                  <label htmlFor="ar-name" className="mb-1 block text-sm font-medium text-slate-700">{t.dlName}</label>
                  <input
                    id="ar-name"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>
                <div>
                  <label htmlFor="ar-email" className="mb-1 block text-sm font-medium text-slate-700">{t.dlEmail}</label>
                  <input
                    id="ar-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>
                {/* Honeypot: insanlar görmez, botlar doldurur. */}
                <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="ar-company">Company</label>
                  <input id="ar-company" name="company" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                {(status === 'invalid' || status === 'error') && (
                  <p role="alert" className="text-sm text-red-600">{status === 'invalid' ? t.dlInvalid : t.dlError}</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full rounded-xl bg-teal-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-teal-500 disabled:opacity-60"
                >
                  {status === 'sending' ? t.dlSending : t.dlSubmit}
                </button>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
