'use client';

import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from './ui/dialog';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { TrendingUp, Users, Droplet, Award, Calendar, Trophy, Target, BarChart3 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DailyUsage {
  date: string;
  waterprint: number;
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

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { t, lang } = useLanguage();
  const dateLocale = lang === 'tr' ? tr : enUS;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) throw new Error(t.errorOccurred);
        const userData: { users: User[] } = await response.json();

        const usersWithData = await Promise.all(
          userData.users.map(async (user) => {
            try {
              const progressResponse = await fetch(
                `https://waterappdashboard2.onrender.com/api/waterprint/progress/${user.id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json',
                  },
                }
              );
              if (!progressResponse.ok) {
                return { ...user, waterprint: { initial: null, current: null, startDate: null, improvement: null, dailyUsage: [] } };
              }
              const progressData = await progressResponse.json();
              return {
                ...user,
                waterprint: {
                  initial: progressData.initialWaterprint,
                  current: progressData.currentWaterprint,
                  startDate: progressData.startDate,
                  dailyUsage: progressData.progressHistory || [],
                  improvement:
                    progressData.initialWaterprint && progressData.currentWaterprint
                      ? ((progressData.initialWaterprint - progressData.currentWaterprint) / progressData.initialWaterprint * 100).toFixed(2)
                      : null,
                },
              };
            } catch {
              return { ...user, waterprint: { initial: null, current: null, startDate: null, improvement: null, dailyUsage: [] } };
            }
          })
        );

        const totalStats = {
          initialTotal: usersWithData.reduce((s, u) => s + (u.waterprint.initial || 0), 0),
          currentTotal: usersWithData.reduce((s, u) => s + (u.waterprint.current || 0), 0),
          userCount: usersWithData.length,
          activeUserCount: usersWithData.filter((u) => u.waterprint.current !== null).length,
        };

        const sortedByImprovement = [...usersWithData]
          .filter((u) => u.waterprint.improvement !== null)
          .sort((a, b) => Number(b.waterprint.improvement) - Number(a.waterprint.improvement));

        const sortedByInitial = [...usersWithData]
          .filter((u) => u.waterprint.initial !== null)
          .sort((a, b) => Number(a.waterprint.initial) - Number(b.waterprint.initial));

        const dailyData = new Map<string, { totalWaterprint: number; userCount: number }>();
        usersWithData.forEach((user) => {
          user.waterprint.dailyUsage.forEach((usage: DailyUsage) => {
            const date = new Date(usage.date).toISOString().split('T')[0];
            const current = dailyData.get(date) || { totalWaterprint: 0, userCount: 0 };
            dailyData.set(date, { totalWaterprint: current.totalWaterprint + usage.waterprint, userCount: current.userCount + 1 });
          });
        });

        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();

        const dailyChartData = last30Days.map((date) => ({
          date,
          totalWaterprint: dailyData.get(date)?.totalWaterprint || 0,
          averageWaterprint: (dailyData.get(date)?.userCount || 0) > 0
            ? (dailyData.get(date)?.totalWaterprint || 0) / (dailyData.get(date)?.userCount || 1)
            : 0,
        }));

        setUsers(usersWithData);
        setStats({ topImprovement: sortedByImprovement.slice(0, 3), bestInitial: sortedByInitial.slice(0, 3), total: totalStats, dailyData: dailyChartData });
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
            <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl bg-white/5" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="atv-card rounded-2xl p-8 text-center">
        <p className="text-red-400 text-base font-medium">{error}</p>
      </div>
    );
  }

  if (!stats || !users.length) {
    return (
      <div className="atv-card rounded-2xl p-20 text-center">
        <Droplet className="h-16 w-16 text-white/20 mx-auto mb-4" strokeWidth={1} />
        <p className="text-white/50 text-lg font-light">{t.noData}</p>
      </div>
    );
  }

  const improvementPct = stats.total.initialTotal && stats.total.currentTotal
    ? ((stats.total.initialTotal - stats.total.currentTotal) / stats.total.initialTotal * 100).toFixed(1)
    : null;

  const localeStr = lang === 'tr' ? 'tr-TR' : 'en-US';

  const statCards = [
    { title: t.totalUsers, value: stats.total.userCount.toString(), subtitle: `${stats.total.activeUserCount} ${t.activeUsers}`, icon: Users },
    { title: t.initialTotal, value: stats.total.initialTotal?.toLocaleString(localeStr) ?? '0', subtitle: t.totalInitialFootprint, icon: Droplet },
    { title: t.currentTotal, value: stats.total.currentTotal?.toLocaleString(localeStr) ?? '0', subtitle: t.totalCurrentFootprint, icon: Target },
    { title: t.totalImprovement, value: improvementPct ? `${improvementPct}%` : '—', subtitle: t.overallImprovementRate, icon: TrendingUp },
  ];

  const chartTooltipStyle = {
    backgroundColor: 'rgba(0,0,0,0.9)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    fontSize: '13px',
    color: '#fff',
    padding: '12px 16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  };

  return (
    <div className="space-y-8">
      {/* Apple TV: Large stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className="atv-card p-6">
            <card.icon className="h-8 w-8 text-white/40 mb-4" strokeWidth={1.5} />
            <div className="text-3xl font-semibold text-white tracking-tight">{card.value}</div>
            <div className="text-sm font-medium text-white/60 mt-1">{card.title}</div>
            <div className="text-xs text-white/40 mt-0.5 font-light">{card.subtitle}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl h-12">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-white/60 rounded-lg px-6 text-sm font-medium transition-all"
          >
            <BarChart3 className="h-4 w-4 mr-2" strokeWidth={1.5} />
            {t.tabOverview}
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-white/60 rounded-lg px-6 text-sm font-medium transition-all"
          >
            <Users className="h-4 w-4 mr-2" strokeWidth={1.5} />
            {t.tabUsers}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* Chart - Apple TV style */}
          <div className="atv-card p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-white/50" strokeWidth={1.5} />
              {t.last30Days}
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.dailyData || []}>
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                    <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), 'd MMM', { locale: dateLocale })}
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} width={50} />
                  <RechartsTooltip
                    labelFormatter={(date) => format(new Date(date as string), 'd MMMM yyyy', { locale: dateLocale })}
                    formatter={(value: number) => [`${value.toLocaleString(localeStr)} ${t.ltPerDay}`, '']}
                    contentStyle={chartTooltipStyle}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="totalWaterprint" stroke="rgba(255,255,255,0.9)" strokeWidth={2} fill="url(#totalGrad)" name={t.totalConsumption} />
                  <Area type="monotone" dataKey="averageWaterprint" stroke="rgba(255,255,255,0.5)" strokeWidth={2} fill="url(#avgGrad)" name={t.avgConsumption} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="atv-card p-6">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-3">
                <Trophy className="h-5 w-5 text-amber-400/80" strokeWidth={1.5} />
                {t.topImprovers}
              </h3>
              <div className="space-y-3">
                {(stats.topImprovement || []).map((user, index) => {
                  const medals = ['text-amber-400', 'text-white/60', 'text-amber-600/80'];
                  return (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors">
                      <div className="flex items-center gap-4">
                        <span className={`text-lg font-bold w-8 ${medals[index] || 'text-white/50'}`}>{index + 1}</span>
                        <div>
                          <div className="font-medium text-white">{user.displayName || user.email}</div>
                          <div className="text-sm text-white/50">
                            {t.improvement}: <span className="text-white font-medium">{user.waterprint.improvement}%</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-white/40 bg-white/5 px-3 py-1.5 rounded-lg">
                        {user.waterprint.current?.toLocaleString(localeStr)} {t.ltPerDay}
                      </span>
                    </div>
                  );
                })}
                {(stats.topImprovement || []).length === 0 && (
                  <div className="text-center text-white/40 py-10 text-sm">{t.noData}</div>
                )}
              </div>
            </div>

            <div className="atv-card p-6">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-3">
                <Award className="h-5 w-5 text-white/50" strokeWidth={1.5} />
                {t.bestStartScores}
              </h3>
              <div className="space-y-3">
                {(stats.bestInitial || []).map((user, index) => {
                  const medals = ['text-amber-400', 'text-white/60', 'text-amber-600/80'];
                  return (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors">
                      <div className="flex items-center gap-4">
                        <span className={`text-lg font-bold w-8 ${medals[index] || 'text-white/50'}`}>{index + 1}</span>
                        <div>
                          <div className="font-medium text-white">{user.displayName || user.email}</div>
                          <div className="text-sm text-white/50">
                            {t.initial}: <span className="text-white font-medium">{user.waterprint.initial?.toLocaleString(localeStr)} {t.ltPerDay}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(stats.bestInitial || []).length === 0 && (
                  <div className="text-center text-white/40 py-10 text-sm">{t.noData}</div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <div className="atv-card overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                <Users className="h-5 w-5 text-white/50" strokeWidth={1.5} />
                {t.userList}
              </h3>
              <span className="text-sm text-white/40 font-light">{users.length} {t.totalUsers.toLowerCase()}</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/50 font-medium py-4 pl-6">{t.user}</TableHead>
                    <TableHead className="text-white/50 font-medium py-4">{t.initialFootprint}</TableHead>
                    <TableHead className="text-white/50 font-medium py-4">{t.currentFootprint}</TableHead>
                    <TableHead className="text-white/50 font-medium py-4">{t.improvement}</TableHead>
                    <TableHead className="text-white/50 font-medium py-4">{t.startDate}</TableHead>
                    <TableHead className="text-white/50 font-medium py-4 pr-6">{t.lastLogin}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => setSelectedUser(user)}
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-white/10 text-white text-sm font-semibold">
                              {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-white">{user.displayName || '—'}</div>
                            <div className="text-sm text-white/40">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/80">
                        {user.waterprint.initial
                          ? `${user.waterprint.initial.toLocaleString(localeStr)} ${t.ltPerDay}`
                          : <span className="text-white/30">—</span>}
                      </TableCell>
                      <TableCell className="text-white/80">
                        {user.waterprint.current
                          ? `${user.waterprint.current.toLocaleString(localeStr)} ${t.ltPerDay}`
                          : <span className="text-white/30">—</span>}
                      </TableCell>
                      <TableCell>
                        {user.waterprint.improvement ? (
                          <span className="inline-flex px-3 py-1 rounded-lg bg-white/10 text-white text-sm font-medium">
                            {user.waterprint.improvement}%
                          </span>
                        ) : <span className="text-white/30">—</span>}
                      </TableCell>
                      <TableCell className="text-white/60">
                        {user.waterprint.startDate
                          ? format(new Date(user.waterprint.startDate), 'd MMM yyyy', { locale: dateLocale })
                          : <span className="text-white/30">—</span>}
                      </TableCell>
                      <TableCell className="text-white/60 pr-6">
                        {user.lastLoginAt
                          ? format(new Date(user.lastLoginAt), 'd MMM yyyy', { locale: dateLocale })
                          : <span className="text-white/30">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Detail Dialog - Apple TV dark */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md bg-black border-white/10 text-white rounded-2xl [&>button]:text-white [&>button]:hover:bg-white/10 [&>button]:rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4 text-white">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-white/10 text-white text-lg font-semibold">
                  {(selectedUser?.displayName || selectedUser?.email || '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-semibold">{selectedUser?.displayName || '—'}</div>
                <div className="text-sm text-white/50 font-normal">{selectedUser?.email}</div>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">User detail</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/5 p-4">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">{t.initialFootprint}</div>
                  <div className="text-xl font-semibold text-white">
                    {selectedUser.waterprint.initial?.toLocaleString(localeStr) || '—'}
                  </div>
                  <div className="text-xs text-white/40">{t.ltPerDay}</div>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">{t.currentFootprint}</div>
                  <div className="text-xl font-semibold text-white">
                    {selectedUser.waterprint.current?.toLocaleString(localeStr) || '—'}
                  </div>
                  <div className="text-xs text-white/40">{t.ltPerDay}</div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">{t.improvement}</div>
                  {selectedUser.waterprint.improvement ? (
                    <span className="text-lg font-semibold text-white">{selectedUser.waterprint.improvement}%</span>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">{t.startDate}</div>
                  <div className="text-sm text-white/80">
                    {selectedUser.waterprint.startDate
                      ? format(new Date(selectedUser.waterprint.startDate), 'd MMM yyyy', { locale: dateLocale })
                      : '—'}
                  </div>
                </div>
              </div>
              <div className="text-sm text-white/40">
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
