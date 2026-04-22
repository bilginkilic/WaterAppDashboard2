'use client';

import { useLanguage, Lang } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const languages: { code: Lang; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const current = languages.find((l) => l.code === lang) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-500/50 hover:text-slate-900 dark:border-slate-600/50 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-teal-500/35 dark:hover:bg-slate-800 dark:hover:text-white sm:px-4"
        >
          <Globe className="h-4 w-4 text-teal-600 dark:text-teal-400/90" strokeWidth={2} />
          <span>{current.code.toUpperCase()}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[160px] rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-600/50 dark:bg-slate-900/98 dark:shadow-2xl dark:shadow-black/50"
      >
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`cursor-pointer gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors ${
              lang === l.code
                ? 'bg-teal-600 font-semibold text-white'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <span className="text-lg">{l.flag}</span>
            <span>{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
