'use client';

import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from './ui/table';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from './ui/dialog';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { TrendingUp, Users, Droplet, Award, Calendar, Trophy, Target, BarChart3, Gauge, Leaf, CalendarClock, Flame } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface DailyUsage {
  date: string;
  value?: number;
  waterprint?: number;
}

interface Waterprint {
  initial: number | null;
  current: number | null;
  startDate: string | null;
  improvement: string | null;
  dailyUsage: DailyUsage[];
}

interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  waterprint: Waterprint;
}

interface DailyData {
  date: string;
  totalWaterprint: number;
  averageWaterprint: number;
}

interface TotalStats {
  initialTotal: number;
  currentTotal: number;
  userCount: number;
  activeUserCount: number;
}

interface Stats {
  topImprovement: User[];
  bestInitial: User[];
  total: TotalStats;
  dailyData: DailyData[];
}

interface AdminUsersResponse {
  users: User[];
  stats: Stats;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const dateLocale = lang === 'tr' ? tr : enUS;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) throw new Error(t.errorOccurred);
        const payload = await response.json() as AdminUsersResponse;

        const safeUsers = (payload.users || []).map((u) => ({
          ...u,
          waterprint: {
            initial: u.waterprint?.initial ?? null,
            current: u.waterprint?.current ?? null,
            startDate: u.waterprint?.startDate ?? null,
            improvement: u.waterprint?.improvement ?? null,
            dailyUsage: u.waterprint?.dailyUsage ?? [],
          },
        }));

        const serverStats = payload.stats || {
          topImprovement: [],
          bestInitial: [],
          total: { initialTotal: 0, currentTotal: 0, userCount: safeUsers.length, activeUserCount: 0 },
          dailyData: [],
        };

        setUsers(safeUsers);
        setStats({
          topImprovement: serverStats.topImprovement || [],
          bestInitial: serverStats.bestInitial || [],
          total: {
            initialTotal: serverStats.total?.initialTotal || 0,
            currentTotal: serverStats.total?.currentTotal || 0,
            userCount: serverStats.total?.userCount ?? safeUsers.length,
            activeUserCount: serverStats.total?.activeUserCount || 0,
          },
          dailyData: serverStats.dailyData || [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t.errorOccurred);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [t.errorOccurred]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-slate-200/70 dark:bg-white/5" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl bg-slate-200/70 dark:bg-white/5" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl bg-slate-200/70 dark:bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="atv-card rounded-2xl p-8 text-center">
        <p className="text-base font-medium text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!stats || !users.length) {
    return (
      <div className="atv-card rounded-2xl p-20 text-center">
        <Droplet className="mx-auto mb-4 h-16 w-16 text-slate-300 dark:text-white/20" strokeWidth={1} />
        <p className="text-lg font-light text-slate-500 dark:text-white/50">{t.noData}</p>
      </div>
    );
  }

  const improvementPct = stats.total.initialTotal && stats.total.currentTotal
    ? ((stats.total.initialTotal - stats.total.currentTotal) / stats.total.initialTotal * 100).toFixed(1)
    : null;

  const localeStr = lang === 'tr' ? 'tr-TR' : 'en-US';
  const totalSaved = Math.max(stats.total.initialTotal - stats.total.currentTotal, 0);
  const co2Equivalent = totalSaved / 1000 * 0.35;
  const usersWithStartDate = users.filter((u) => !!u.waterprint.startDate);
  const avgChallengeDays = usersWithStartDate.length
    ? Math.round(
      usersWithStartDate.reduce((sum, user) => {
        const startedAt = new Date(user.waterprint.startDate as string);
        const days = Math.max(
          Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24)),
          0
        );
        return sum + days;
      }, 0) / usersWithStartDate.length
    )
    : 0;
  const topIndividual = stats.topImprovement[0];

  const primaryCards = [
    { title: t.totalUsers, value: stats.total.userCount.toString(), subtitle: `${stats.total.activeUserCount} ${t.activeUsers}`, icon: Users },
    { title: t.initialTotal, value: stats.total.initialTotal?.toLocaleString(localeStr) ?? '0', subtitle: t.totalInitialFootprint, icon: Droplet },
    { title: t.currentTotal, value: stats.total.currentTotal?.toLocaleString(localeStr) ?? '0', subtitle: t.totalCurrentFootprint, icon: Target },
    { title: t.totalImprovement, value: improvementPct ? `${improvementPct}%` : '—', subtitle: t.overallImprovementRate, icon: TrendingUp },
  ];

  const secondaryCards = [
    {
      title: t.litersSaved,
      value: `${totalSaved.toLocaleString(localeStr)} ${t.ltPerDay}`,
      subtitle: t.litersSavedSub,
      icon: Gauge,
      iconClass: 'text-cyan-600 dark:text-cyan-300',
    },
    {
      title: t.co2Equivalent,
      value: `${co2Equivalent.toLocaleString(localeStr, { maximumFractionDigits: 2 })} kg`,
      subtitle: t.co2EquivalentSub,
      icon: Leaf,
      iconClass: 'text-emerald-600 dark:text-emerald-300',
    },
    {
      title: t.avgChallengeDays,
      value: `${avgChallengeDays}`,
      subtitle: t.avgChallengeDaysSub,
      icon: CalendarClock,
      iconClass: 'text-sky-600 dark:text-sky-300',
    },
    {
      title: t.topIndividual,
      value: topIndividual?.waterprint.improvement ? `%${topIndividual.waterprint.improvement}` : '—',
      subtitle: topIndividual?.displayName || topIndividual?.email || t.topIndividualSub,
      icon: Flame,
      iconClass: 'text-teal-600 dark:text-teal-300',
    },
  ];

  const chartTooltipStyle = isDark
    ? {
      backgroundColor: 'rgba(2,6,23,0.95)',
      border: '1px solid rgba(20,184,166,0.25)',
      borderRadius: '12px',
      fontSize: '13px',
      color: '#f8fafc',
      padding: '12px 16px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
    }
    : {
      backgroundColor: 'rgba(255,255,255,0.98)',
      border: '1px solid rgba(20,184,166,0.35)',
      borderRadius: '12px',
      fontSize: '13px',
      color: '#0f172a',
      padding: '12px 16px',
      boxShadow: '0 18px 40px rgba(15,23,42,0.12)',
    };

  const axisTickColor = isDark ? 'rgba(203,213,225,0.75)' : 'rgba(71,85,105,0.85)';
  const gridStroke = isDark ? 'rgba(148,163,184,0.2)' : 'rgba(100,116,139,0.18)';
  const labelStyleColor = isDark ? 'rgba(226,232,240,0.85)' : 'rgba(15,23,42,0.8)';

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {primaryCards.map((card) => (
          <div key={card.title} className="atv-card p-6">
            <card.icon className="mb-4 h-8 w-8 text-teal-600 dark:text-teal-200/90" strokeWidth={1.5} />
            <div className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{card.value}</div>
            <div className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{card.title}</div>
            <div className="mt-0.5 text-xs font-light text-slate-500 dark:text-slate-400">{card.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {secondaryCards.map((card) => (
          <div key={card.title} className="atv-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{card.title}</div>
                <div className="mt-1 truncate text-xl font-semibold text-slate-900 dark:text-white">{card.value}</div>
                <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{card.subtitle}</div>
              </div>
              <card.icon className={`h-6 w-6 shrink-0 ${card.iconClass}`} strokeWidth={1.8} />
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-12 rounded-xl border border-slate-200 bg-white/80 p-1 dark:border-teal-500/20 dark:bg-slate-900/70">
          <TabsTrigger
            value="overview"
            className="rounded-lg px-6 text-sm font-medium transition-all data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=inactive]:text-slate-600 dark:data-[state=active]:bg-teal-500/90 dark:data-[state=active]:text-slate-950 dark:data-[state=inactive]:text-slate-300"
          >
            <BarChart3 className="mr-2 h-4 w-4" strokeWidth={1.5} />
            {t.tabOverview}
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="rounded-lg px-6 text-sm font-medium transition-all data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=inactive]:text-slate-600 dark:data-[state=active]:bg-teal-500/90 dark:data-[state=active]:text-slate-950 dark:data-[state=inactive]:text-slate-300"
          >
            <Users className="mr-2 h-4 w-4" strokeWidth={1.5} />
            {t.tabUsers}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 space-y-6">
          <div className="atv-card p-6">
            <h3 className="mb-6 flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
              <Calendar className="h-5 w-5 text-slate-500 dark:text-white/50" strokeWidth={1.5} />
              {t.last30Days}
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.dailyData || []}>
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isDark ? 'rgba(45,212,191,0.35)' : 'rgba(13,148,136,0.35)'} />
                      <stop offset="100%" stopColor={isDark ? 'rgba(45,212,191,0)' : 'rgba(13,148,136,0)'} />
                    </linearGradient>
                    <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isDark ? 'rgba(56,189,248,0.3)' : 'rgba(2,132,199,0.28)'} />
                      <stop offset="100%" stopColor={isDark ? 'rgba(56,189,248,0)' : 'rgba(2,132,199,0)'} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), 'd MMM', { locale: dateLocale })}
                    tick={{ fontSize: 11, fill: axisTickColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: axisTickColor }} axisLine={false} tickLine={false} width={50} />
                  <RechartsTooltip
                    labelFormatter={(date) => format(new Date(date as string), 'd MMMM yyyy', { locale: dateLocale })}
                    formatter={(value: number) => [`${value.toLocaleString(localeStr)} ${t.ltPerDay}`, '']}
                    contentStyle={chartTooltipStyle}
                    labelStyle={{ color: labelStyleColor, marginBottom: '4px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalWaterprint"
                    stroke={isDark ? 'rgba(45,212,191,0.95)' : 'rgba(13,148,136,0.95)'}
                    strokeWidth={2.2}
                    fill="url(#totalGrad)"
                    name={t.totalConsumption}
                  />
                  <Area
                    type="monotone"
                    dataKey="averageWaterprint"
                    stroke={isDark ? 'rgba(56,189,248,0.85)' : 'rgba(2,132,199,0.85)'}
                    strokeWidth={2.2}
                    fill="url(#avgGrad)"
                    name={t.avgConsumption}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="atv-card p-6">
              <h3 className="mb-5 flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
                <Trophy className="h-5 w-5 text-amber-500 dark:text-amber-400/80" strokeWidth={1.5} />
                {t.topImprovers}
              </h3>
              <div className="space-y-3">
                {(stats.topImprovement || []).map((user, index) => {
                  const medals = ['text-amber-500 dark:text-amber-400', 'text-slate-400 dark:text-white/60', 'text-amber-700/80 dark:text-amber-600/80'];
                  return (
                    <div key={user.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/[0.08]">
                      <div className="flex items-center gap-4">
                        <span className={`w-8 text-lg font-bold ${medals[index] || 'text-slate-400 dark:text-white/50'}`}>{index + 1}</span>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{user.displayName || user.email}</div>
                          <div className="text-sm text-slate-500 dark:text-white/50">
                            {t.improvement}: <span className="font-medium text-slate-900 dark:text-white">{user.waterprint.improvement}%</span>
                          </div>
                        </div>
                      </div>
                      <span className="rounded-lg bg-slate-200/70 px-3 py-1.5 text-sm text-slate-600 dark:bg-white/5 dark:text-white/40">
                        {user.waterprint.current?.toLocaleString(localeStr)} {t.ltPerDay}
                      </span>
                    </div>
                  );
                })}
                {(stats.topImprovement || []).length === 0 && (
                  <div className="py-10 text-center text-sm text-slate-400 dark:text-white/40">{t.noData}</div>
                )}
              </div>
            </div>

            <div className="atv-card p-6">
              <h3 className="mb-5 flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
                <Award className="h-5 w-5 text-slate-500 dark:text-white/50" strokeWidth={1.5} />
                {t.bestStartScores}
              </h3>
              <div className="space-y-3">
                {(stats.bestInitial || []).map((user, index) => {
                  const medals = ['text-amber-500 dark:text-amber-400', 'text-slate-400 dark:text-white/60', 'text-amber-700/80 dark:text-amber-600/80'];
                  return (
                    <div key={user.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/[0.08]">
                      <div className="flex items-center gap-4">
                        <span className={`w-8 text-lg font-bold ${medals[index] || 'text-slate-400 dark:text-white/50'}`}>{index + 1}</span>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{user.displayName || user.email}</div>
                          <div className="text-sm text-slate-500 dark:text-white/50">
                            {t.initial}: <span className="font-medium text-slate-900 dark:text-white">{user.waterprint.initial?.toLocaleString(localeStr)} {t.ltPerDay}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(stats.bestInitial || []).length === 0 && (
                  <div className="py-10 text-center text-sm text-slate-400 dark:text-white/40">{t.noData}</div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <div className="atv-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-white/10">
              <h3 className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
                <Users className="h-5 w-5 text-slate-500 dark:text-white/50" strokeWidth={1.5} />
                {t.userList}
              </h3>
              <span className="text-sm font-light text-slate-500 dark:text-white/40">{users.length} {t.totalUsers.toLowerCase()}</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 hover:bg-transparent dark:border-white/10">
                    <TableHead className="py-4 pl-6 font-medium text-slate-500 dark:text-white/50">{t.user}</TableHead>
                    <TableHead className="py-4 font-medium text-slate-500 dark:text-white/50">{t.initialFootprint}</TableHead>
                    <TableHead className="py-4 font-medium text-slate-500 dark:text-white/50">{t.currentFootprint}</TableHead>
                    <TableHead className="py-4 font-medium text-slate-500 dark:text-white/50">{t.improvement}</TableHead>
                    <TableHead className="py-4 font-medium text-slate-500 dark:text-white/50">{t.startDate}</TableHead>
                    <TableHead className="py-4 pr-6 font-medium text-slate-500 dark:text-white/50">{t.lastLogin}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer border-slate-200 transition-colors hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5"
                      onClick={() => setSelectedUser(user)}
                    >
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-teal-100 text-sm font-semibold text-teal-700 dark:bg-white/10 dark:text-white">
                              {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">{user.displayName || '—'}</div>
                            <div className="text-sm text-slate-500 dark:text-white/40">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-white/80">
                        {user.waterprint.initial
                          ? `${user.waterprint.initial.toLocaleString(localeStr)} ${t.ltPerDay}`
                          : <span className="text-slate-300 dark:text-white/30">—</span>}
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-white/80">
                        {user.waterprint.current
                          ? `${user.waterprint.current.toLocaleString(localeStr)} ${t.ltPerDay}`
                          : <span className="text-slate-300 dark:text-white/30">—</span>}
                      </TableCell>
                      <TableCell>
                        {user.waterprint.improvement ? (
                          <span className="inline-flex rounded-lg bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700 dark:bg-white/10 dark:text-white">
                            {user.waterprint.improvement}%
                          </span>
                        ) : <span className="text-slate-300 dark:text-white/30">—</span>}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-white/60">
                        {user.waterprint.startDate
                          ? format(new Date(user.waterprint.startDate), 'd MMM yyyy', { locale: dateLocale })
                          : <span className="text-slate-300 dark:text-white/30">—</span>}
                      </TableCell>
                      <TableCell className="pr-6 text-slate-600 dark:text-white/60">
                        {user.lastLoginAt
                          ? format(new Date(user.lastLoginAt), 'd MMM yyyy', { locale: dateLocale })
                          : <span className="text-slate-300 dark:text-white/30">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl sm:max-w-md dark:border-white/10 dark:bg-slate-900 dark:text-white [&>button]:rounded-lg [&>button]:text-slate-500 [&>button]:hover:bg-slate-100 dark:[&>button]:text-white dark:[&>button]:hover:bg-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4 text-slate-900 dark:text-white">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-teal-100 text-lg font-semibold text-teal-700 dark:bg-white/10 dark:text-white">
                  {(selectedUser?.displayName || selectedUser?.email || '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-semibold">{selectedUser?.displayName || '—'}</div>
                <div className="text-sm font-normal text-slate-500 dark:text-white/50">{selectedUser?.email}</div>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">User detail</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-100 p-4 dark:bg-white/5">
                  <div className="mb-1 text-xs uppercase tracking-wider text-slate-500 dark:text-white/40">{t.initialFootprint}</div>
                  <div className="text-xl font-semibold text-slate-900 dark:text-white">
                    {selectedUser.waterprint.initial?.toLocaleString(localeStr) || '—'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-white/40">{t.ltPerDay}</div>
                </div>
                <div className="rounded-xl bg-slate-100 p-4 dark:bg-white/5">
                  <div className="mb-1 text-xs uppercase tracking-wider text-slate-500 dark:text-white/40">{t.currentFootprint}</div>
                  <div className="text-xl font-semibold text-slate-900 dark:text-white">
                    {selectedUser.waterprint.current?.toLocaleString(localeStr) || '—'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-white/40">{t.ltPerDay}</div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-100 p-4 dark:bg-white/5">
                <div>
                  <div className="mb-1 text-xs uppercase tracking-wider text-slate-500 dark:text-white/40">{t.improvement}</div>
                  {selectedUser.waterprint.improvement ? (
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">{selectedUser.waterprint.improvement}%</span>
                  ) : (
                    <span className="text-slate-400 dark:text-white/40">—</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="mb-1 text-xs uppercase tracking-wider text-slate-500 dark:text-white/40">{t.startDate}</div>
                  <div className="text-sm text-slate-700 dark:text-white/80">
                    {selectedUser.waterprint.startDate
                      ? format(new Date(selectedUser.waterprint.startDate), 'd MMM yyyy', { locale: dateLocale })
                      : '—'}
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-500 dark:text-white/40">
                {t.lastLogin}: {selectedUser.lastLoginAt
                  ? format(new Date(selectedUser.lastLoginAt), 'd MMM yyyy HH:mm', { locale: dateLocale })
                  : '—'}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
