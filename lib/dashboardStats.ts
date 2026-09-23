import { format, subDays } from 'date-fns';

// /api/admin/users içindeki istatistik hesabının istemci tarafı karşılığı;
// kurum filtresi seçildiğinde istatistikler filtrelenmiş kullanıcılardan yeniden hesaplanır.

interface StatsUser {
  waterprint: {
    initial: number | null;
    current: number | null;
    improvement: string | null;
    dailyUsage: { date: string; waterprint?: number; value?: number }[];
  };
}

export function computeDashboardStats<U extends StatsUser>(users: U[]) {
  const total = {
    initialTotal: users.reduce((sum, u) => sum + (u.waterprint.initial || 0), 0),
    currentTotal: users.reduce((sum, u) => sum + (u.waterprint.current || 0), 0),
    userCount: users.length,
    activeUserCount: users.filter((u) => u.waterprint.current !== null).length,
  };

  const topImprovement = users
    .filter((u) => u.waterprint.improvement !== null)
    .sort((a, b) => Number(b.waterprint.improvement) - Number(a.waterprint.improvement))
    .slice(0, 3);

  const bestInitial = users
    .filter((u) => u.waterprint.initial !== null)
    .sort((a, b) => Number(a.waterprint.initial) - Number(b.waterprint.initial))
    .slice(0, 3);

  const last30Days = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).reverse();
  const dailyAgg = new Map<string, { total: number; count: number }>();
  last30Days.forEach((d) => dailyAgg.set(d, { total: 0, count: 0 }));
  users.forEach((u) => {
    u.waterprint.dailyUsage.forEach((entry) => {
      const value = typeof entry.waterprint === 'number' ? entry.waterprint : entry.value;
      if (typeof value !== 'number' || !entry.date) return;
      const bucket = dailyAgg.get(format(new Date(entry.date), 'yyyy-MM-dd'));
      if (bucket) {
        bucket.total += value;
        bucket.count += 1;
      }
    });
  });
  const dailyData = last30Days.map((date) => {
    const bucket = dailyAgg.get(date)!;
    return {
      date,
      totalWaterprint: bucket.total,
      averageWaterprint: bucket.count > 0 ? bucket.total / bucket.count : 0,
    };
  });

  return { topImprovement, bestInitial, total, dailyData };
}
