'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type Lang = 'en' | 'tr';

const translations = {
  en: {
    // Login
    loginTitle: 'WaterApp Admin',
    loginSubtitle: 'Water Footprint Dashboard',
    email: 'Email',
    password: 'Password',
    emailPlaceholder: 'admin@waterapp.com',
    passwordPlaceholder: 'Enter your password',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    invalidCredentials: 'Invalid email or password',

    // Dashboard header
    dashboardTitle: 'Water Footprint Dashboard',
    logout: 'Logout',
    heroSubtitle: 'Monitor and analyze user water consumption patterns',

    // Stats cards
    totalUsers: 'Total Users',
    activeUsers: 'active users',
    initialTotal: 'Initial Total',
    totalInitialFootprint: 'Total initial water footprint',
    currentTotal: 'Current Total',
    totalCurrentFootprint: 'Total current water footprint',
    totalImprovement: 'Total Improvement',
    overallImprovementRate: 'Overall improvement rate',
    ltPerDay: 'lt/day',

    // Tabs
    tabOverview: 'Overview',
    tabUsers: 'Users',

    // Chart
    last30Days: 'Last 30 Days Water Consumption',
    totalConsumption: 'Total Consumption',
    avgConsumption: 'Average Consumption',

    // Leaderboards
    topImprovers: 'Top Improvers',
    bestStartScores: 'Best Start Scores',
    improvement: 'Improvement',
    initial: 'Initial',

    // Table
    userList: 'User List',
    user: 'User',
    initialFootprint: 'Initial Footprint',
    currentFootprint: 'Current Footprint',
    startDate: 'Start Date',
    lastLogin: 'Last Login',

    // Dialog
    userDetails: 'User Details',

    // States
    loading: 'Loading data...',
    noData: 'No data available yet.',
    errorOccurred: 'An error occurred',
  },
  tr: {
    // Login
    loginTitle: 'WaterApp Admin',
    loginSubtitle: 'Su Ayak İzi Dashboard',
    email: 'E-posta',
    password: 'Şifre',
    emailPlaceholder: 'admin@waterapp.com',
    passwordPlaceholder: 'Şifrenizi girin',
    signIn: 'Giriş Yap',
    signingIn: 'Giriş yapılıyor...',
    invalidCredentials: 'Geçersiz e-posta veya şifre',

    // Dashboard header
    dashboardTitle: 'Su Ayak İzi Dashboard',
    logout: 'Çıkış Yap',
    heroSubtitle: 'Kullanıcı su tüketim alışkanlıklarını izleyin ve analiz edin',

    // Stats cards
    totalUsers: 'Toplam Kullanıcı',
    activeUsers: 'aktif kullanıcı',
    initialTotal: 'Başlangıç Toplam',
    totalInitialFootprint: 'Toplam başlangıç su ayak izi',
    currentTotal: 'Güncel Toplam',
    totalCurrentFootprint: 'Toplam güncel su ayak izi',
    totalImprovement: 'Toplam İyileştirme',
    overallImprovementRate: 'Genel iyileştirme oranı',
    ltPerDay: 'lt/gün',

    // Tabs
    tabOverview: 'Genel Bakış',
    tabUsers: 'Kullanıcılar',

    // Chart
    last30Days: 'Son 30 Gün Su Tüketimi',
    totalConsumption: 'Toplam Su Tüketimi',
    avgConsumption: 'Ortalama Su Tüketimi',

    // Leaderboards
    topImprovers: 'En İyi İyileştirme Yapanlar',
    bestStartScores: 'En İyi Başlangıç Yapanlar',
    improvement: 'İyileştirme',
    initial: 'Başlangıç',

    // Table
    userList: 'Kullanıcı Listesi',
    user: 'Kullanıcı',
    initialFootprint: 'Başlangıç Su Ayak İzi',
    currentFootprint: 'Güncel Su Ayak İzi',
    startDate: 'Başlangıç Tarihi',
    lastLogin: 'Son Giriş',

    // Dialog
    userDetails: 'Kullanıcı Detayları',

    // States
    loading: 'Veriler yükleniyor...',
    noData: 'Henüz veri bulunmamaktadır.',
    errorOccurred: 'Bir hata oluştu',
  },
};

type Translations = typeof translations['en'];

interface LanguageContextType {
  lang: Lang;
  t: Translations;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  t: translations.en,
  setLang: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('lang') as Lang) || 'en';
    }
    return 'en';
  });

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}
