'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLanguage } from './LanguageContext';
import { computeDashboardStats } from '../../lib/dashboardStats';

export interface DailyUsage {
  date: string;
  value?: number;
  waterprint?: number;
}

export interface Waterprint {
  initial: number | null;
  current: number | null;
  startDate: string | null;
  improvement: string | null;
  dailyUsage: DailyUsage[];
}

export interface DashboardUser {
  id: string;
  email: string | null;
  displayName: string | null;
  organization: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  waterprint: Waterprint;
}

export interface DailyData {
  date: string;
  totalWaterprint: number;
  averageWaterprint: number;
}

export interface TotalStats {
  initialTotal: number;
  currentTotal: number;
  userCount: number;
  activeUserCount: number;
}

export interface DashboardStats {
  topImprovement: DashboardUser[];
  bestInitial: DashboardUser[];
  total: TotalStats;
  dailyData: DailyData[];
}

interface AdminUsersResponse {
  users: DashboardUser[];
  stats: DashboardStats;
}

interface AdminUsersErrorBody {
  error?: string;
  detail?: string;
  hint?: string;
}

async function readAdminUsersError(response: Response): Promise<string> {
  const head = `${response.status} ${response.statusText}`;
  try {
    const body = (await response.json()) as AdminUsersErrorBody;
    const parts = [body.detail, body.hint, body.error].filter(
      (x): x is string => typeof x === 'string' && x.length > 0
    );
    return parts.length ? `${head}: ${parts.join(' — ')}` : head;
  } catch {
    return head;
  }
}

/** 'all', bir kurum adı ya da etiketsizler için ORG_FILTER_NONE */
export const ORG_FILTER_ALL = 'all';
export const ORG_FILTER_NONE = '__none__';

interface DashboardStatsContextType {
  /** Seçili kurum filtresine göre kullanıcılar */
  users: DashboardUser[];
  /** Filtrelenmemiş tüm kullanıcılar (filtre sayıları için) */
  allUsers: DashboardUser[];
  organizationFilter: string;
  setOrganizationFilter: (value: string) => void;
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  /** Toplam (initial - current) litre; hero ve “Liters saved” ile aynı */
  totalSavedLiters: number | null;
  refetch: () => void;
}

const DashboardStatsContext = createContext<DashboardStatsContextType | null>(null);

export function DashboardStatsProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [allUsers, setAllUsers] = useState<DashboardUser[]>([]);
  const [hasData, setHasData] = useState(false);
  const [organizationFilter, setOrganizationFilter] = useState<string>(ORG_FILTER_ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Sadece ilk yüklemede iskelet göster; refetch mevcut ekranı (sekme, diyalog) korusun.
      if (version === 0) setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          throw new Error(await readAdminUsersError(response));
        }
        const payload = (await response.json()) as AdminUsersResponse;

        const safeUsers = (payload.users || []).map((u) => ({
          ...u,
          organization: u.organization ?? null,
          waterprint: {
            initial: u.waterprint?.initial ?? null,
            current: u.waterprint?.current ?? null,
            startDate: u.waterprint?.startDate ?? null,
            improvement: u.waterprint?.improvement ?? null,
            dailyUsage: u.waterprint?.dailyUsage ?? [],
          },
        }));

        if (cancelled) return;
        setAllUsers(safeUsers);
        setHasData(true);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error && err.message ? err.message : t.errorOccurred);
        setAllUsers([]);
        setHasData(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [t.errorOccurred, version]);

  const users = useMemo(() => {
    if (organizationFilter === ORG_FILTER_ALL) return allUsers;
    if (organizationFilter === ORG_FILTER_NONE) return allUsers.filter((u) => !u.organization);
    return allUsers.filter((u) => u.organization === organizationFilter);
  }, [allUsers, organizationFilter]);

  const stats = useMemo<DashboardStats | null>(
    () => (hasData ? computeDashboardStats(users) : null),
    [hasData, users]
  );

  const totalSavedLiters = useMemo(() => {
    if (!stats) return null;
    return Math.max(
      stats.total.initialTotal - stats.total.currentTotal,
      0
    );
  }, [stats]);

  const value = useMemo<DashboardStatsContextType>(
    () => ({
      users,
      allUsers,
      organizationFilter,
      setOrganizationFilter,
      stats,
      loading,
      error,
      totalSavedLiters,
      refetch,
    }),
    [users, allUsers, organizationFilter, stats, loading, error, totalSavedLiters, refetch]
  );

  return (
    <DashboardStatsContext.Provider value={value}>
      {children}
    </DashboardStatsContext.Provider>
  );
}

export function useDashboardStats() {
  const ctx = useContext(DashboardStatsContext);
  if (!ctx) {
    throw new Error('useDashboardStats must be used within DashboardStatsProvider');
  }
  return ctx;
}
