'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { TrendingUp, Users, Droplet, Award, Calendar } from 'lucide-react';

interface Waterprint {
  initial: number | null;
  current: number | null;
  startDate: string | null;
  improvement: string | null;
  dailyUsage: Array<{ date: string; value: number }>;
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

interface ApiResponse {
  users: User[];
  stats: Stats;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          throw new Error('Kullanıcı listesi alınamadı');
        }
        const data: ApiResponse = await response.json();
        setUsers(data.users);
        setStats(data.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <Card className="bg-white/95 shadow-xl border border-blue-100">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/95 shadow-xl border border-blue-100">
        <CardContent className="pt-6">
          <div className="text-red-500 text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/95 shadow-xl border border-blue-100 hover:shadow-2xl hover:scale-105 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base font-medium">Toplam Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.total.userCount}</div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {stats?.total.activeUserCount} aktif kullanıcı
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 shadow-xl border border-blue-100 hover:shadow-2xl hover:scale-105 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base font-medium">Başlangıç Toplam</CardTitle>
            <Droplet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.total.initialTotal?.toLocaleString('tr-TR')} lt/gün
            </div>
            <div className="text-sm text-gray-600">
              Toplam başlangıç su ayak izi
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 shadow-xl border border-blue-100 hover:shadow-2xl hover:scale-105 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base font-medium">Güncel Toplam</CardTitle>
            <Droplet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.total.currentTotal?.toLocaleString('tr-TR')} lt/gün
            </div>
            <div className="text-sm text-gray-600">
              Toplam güncel su ayak izi
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 shadow-xl border border-blue-100 hover:shadow-2xl hover:scale-105 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base font-medium">Toplam İyileştirme</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.total && stats.total.initialTotal && stats.total.currentTotal
                ? `%${((stats.total.initialTotal - stats.total.currentTotal) / stats.total.initialTotal * 100).toFixed(2)}`
                : '-'
              }
            </div>
            <div className="text-sm text-gray-600">
              Genel iyileştirme oranı
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Usage Chart */}
      <Card className="bg-white/95 shadow-xl border border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
            Son 30 Gün Su Tüketimi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.dailyData}>
                <defs>
                  <linearGradient id="totalWaterprint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="averageWaterprint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#475569" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'd MMM', { locale: tr })}
                  className="text-xs"
                  stroke="#475569"
                />
                <YAxis 
                  className="text-xs"
                  stroke="#475569"
                />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), 'd MMMM yyyy', { locale: tr })}
                  formatter={(value: number) => [`${value.toLocaleString('tr-TR')} lt/gün`, '']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalWaterprint"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#totalWaterprint)"
                  name="Toplam Su Tüketimi"
                />
                <Area
                  type="monotone"
                  dataKey="averageWaterprint"
                  stroke="#475569"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#averageWaterprint)"
                  name="Ortalama Su Tüketimi"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Improvement */}
        <Card className="bg-white/95 shadow-xl border border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-blue-600" />
              En İyi İyileştirme Yapanlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topImprovement.map((user, index) => (
                <div key={user.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-200 text-blue-700 text-sm font-medium shadow-inner">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{user.displayName || user.email}</div>
                      <div className="text-xs text-gray-600">
                        İyileştirme: <span className="text-blue-700 font-medium">%{user.waterprint.improvement}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {user.waterprint.current?.toLocaleString('tr-TR')} lt/gün
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Best Initial */}
        <Card className="bg-white/95 shadow-xl border border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-blue-600" />
              En İyi Başlangıç Yapanlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.bestInitial.map((user, index) => (
                <div key={user.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-200 text-blue-700 text-sm font-medium shadow-inner">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{user.displayName || user.email}</div>
                      <div className="text-xs text-gray-600">
                        Başlangıç: {user.waterprint.initial?.toLocaleString('tr-TR')} lt/gün
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-white/95 shadow-xl border border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-blue-600" />
            Kullanıcı Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-blue-100">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-blue-50">
                  <TableHead className="text-xs font-medium text-gray-700">Kullanıcı</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">Başlangıç Su Ayak İzi</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">Güncel Su Ayak İzi</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">İyileştirme</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">Başlangıç Tarihi</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">Son Giriş</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-blue-50/50">
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{user.displayName || '-'}</div>
                        <div className="text-xs text-gray-600">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.waterprint.initial 
                        ? `${user.waterprint.initial.toLocaleString('tr-TR')} lt/gün` 
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.waterprint.current 
                        ? `${user.waterprint.current.toLocaleString('tr-TR')} lt/gün` 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {user.waterprint.improvement ? (
                        <div className="text-blue-700 text-sm font-medium bg-blue-100 px-2 py-0.5 rounded-full inline-block shadow-inner">
                          %{user.waterprint.improvement}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {user.waterprint.startDate ? 
                        format(new Date(user.waterprint.startDate), 'd MMMM yyyy', { locale: tr }) 
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {user.lastLoginAt ? 
                        format(new Date(user.lastLoginAt), 'd MMMM yyyy', { locale: tr })
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 