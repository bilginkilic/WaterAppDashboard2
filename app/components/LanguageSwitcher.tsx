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
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm font-medium outline-none">
          <Globe className="h-4 w-4" strokeWidth={1.5} />
          <span>{current.code.toUpperCase()}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[160px] bg-black/95 backdrop-blur-xl border-white/10 rounded-xl p-1 shadow-2xl"
      >
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`gap-3 cursor-pointer rounded-lg px-4 py-2.5 text-sm transition-colors ${
              lang === l.code
                ? 'bg-white text-black font-medium'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
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
