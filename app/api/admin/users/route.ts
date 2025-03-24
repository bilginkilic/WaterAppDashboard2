import { NextResponse } from 'next/server';
import { firebaseAdmin } from '../../../../lib/firebase';
import { startOfDay, subDays, format } from 'date-fns';

export async function GET() {
  try {
    const listUsersResult = await firebaseAdmin.auth().listUsers();
    const waterprintSnapshot = await firebaseAdmin.firestore()
      .collection('waterprints')
      .get();

    const waterprintData = new Map();
    const dailyData = new Map();
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyData.set(date, {
        totalWaterprint: 0,
        userCount: 0
      });
      return date;
    }).reverse();

    waterprintSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!waterprintData.has(data.userId)) {
        waterprintData.set(data.userId, {
          initialWaterprint: data.initialWaterprint || null,
          currentWaterprint: data.currentWaterprint || null,
          startDate: data.createdAt || null,
          dailyUsage: data.dailyUsage || []
        });

        // Process daily usage data
        if (data.dailyUsage) {
          data.dailyUsage.forEach((usage: { date: string; value: number }) => {
            const dayKey = format(new Date(usage.date), 'yyyy-MM-dd');
            if (dailyData.has(dayKey)) {
              const current = dailyData.get(dayKey);
              dailyData.set(dayKey, {
                totalWaterprint: current.totalWaterprint + usage.value,
                userCount: current.userCount + 1
              });
            }
          });
        }
      }
    });

    const users = await Promise.all(listUsersResult.users.map(async (user) => {
      const waterprint = waterprintData.get(user.uid) || {
        initialWaterprint: null,
        currentWaterprint: null,
        startDate: null,
        dailyUsage: []
      };

      return {
        id: user.uid,
        email: user.email,
        displayName: user.displayName || null,
        createdAt: user.metadata.creationTime,
        lastLoginAt: user.metadata.lastSignInTime || null,
        waterprint: {
          initial: waterprint.initialWaterprint,
          current: waterprint.currentWaterprint,
          startDate: waterprint.startDate,
          dailyUsage: waterprint.dailyUsage,
          improvement: waterprint.initialWaterprint && waterprint.currentWaterprint
            ? ((waterprint.initialWaterprint - waterprint.currentWaterprint) / waterprint.initialWaterprint * 100).toFixed(2)
            : null
        }
      };
    }));

    // Calculate total statistics
    const totalStats = {
      initialTotal: users.reduce((sum, user) => sum + (user.waterprint.initial || 0), 0),
      currentTotal: users.reduce((sum, user) => sum + (user.waterprint.current || 0), 0),
      userCount: users.length,
      activeUserCount: users.filter(user => user.waterprint.current !== null).length
    };

    // Sort users by improvement and initial waterprint
    const sortedByImprovement = [...users]
      .filter(user => user.waterprint.improvement !== null)
      .sort((a, b) => Number(b.waterprint.improvement) - Number(a.waterprint.improvement));

    const sortedByInitial = [...users]
      .filter(user => user.waterprint.initial !== null)
      .sort((a, b) => Number(a.waterprint.initial) - Number(b.waterprint.initial));

    // Format daily data for charts
    const dailyChartData = last30Days.map(date => ({
      date,
      totalWaterprint: dailyData.get(date).totalWaterprint,
      averageWaterprint: dailyData.get(date).userCount > 0 
        ? dailyData.get(date).totalWaterprint / dailyData.get(date).userCount 
        : 0
    }));

    return NextResponse.json({
      users,
      stats: {
        topImprovement: sortedByImprovement.slice(0, 3),
        bestInitial: sortedByInitial.slice(0, 3),
        total: totalStats,
        dailyData: dailyChartData
      }
    });
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json(
      { error: 'Kullanıcı listesi alınamadı' },
      { status: 500 }
    );
  }
} 