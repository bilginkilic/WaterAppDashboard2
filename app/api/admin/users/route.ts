import { NextResponse } from 'next/server';
import { firebaseAdmin } from '../../../../lib/firebase';
import { format, subDays } from 'date-fns';

type AnyDate = string | number | Date | { _seconds?: number; seconds?: number; toDate?: () => Date } | null | undefined;

function toIsoString(value: AnyDate): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof value === 'object') {
    const maybeTs = value as { _seconds?: number; seconds?: number; toDate?: () => Date };
    if (typeof maybeTs.toDate === 'function') return maybeTs.toDate().toISOString();
    const secs = maybeTs._seconds ?? maybeTs.seconds;
    if (typeof secs === 'number') return new Date(secs * 1000).toISOString();
  }
  return null;
}

interface ProgressEntry {
  date: AnyDate;
  waterprint: number;
  value?: number;
}

interface WaterprintProfileDoc {
  userId: string;
  initialWaterprint?: number | null;
  currentWaterprint?: number | null;
  initialAssessment?: { date?: AnyDate } | null;
  progressHistory?: ProgressEntry[];
  createdAt?: AnyDate;
}

interface UsersDoc {
  email?: string | null;
  name?: string | null;
  displayName?: string | null;
  platform?: string | null;
  createdAt?: AnyDate;
  updatedAt?: AnyDate;
  lastLoginAt?: AnyDate;
}

export async function GET() {
  try {
    const db = firebaseAdmin.firestore();

    // Load all waterprint profiles once and index by userId
    const profilesSnap = await db.collection('WaterprintProfiles').get();
    const profilesByUserId = new Map<string, WaterprintProfileDoc>();
    profilesSnap.forEach((doc) => {
      const data = doc.data() as WaterprintProfileDoc;
      if (data?.userId) profilesByUserId.set(data.userId, data);
    });

    // Collect users from Firestore `users` collection (primary source)
    const usersSnap = await db.collection('users').get();
    const usersById = new Map<string, UsersDoc>();
    usersSnap.forEach((doc) => {
      usersById.set(doc.id, doc.data() as UsersDoc);
    });

    // Also merge in any Firebase Auth users that aren't yet in Firestore
    try {
      const authList = await firebaseAdmin.auth().listUsers(1000);
      authList.users.forEach((u) => {
        if (!usersById.has(u.uid)) {
          usersById.set(u.uid, {
            email: u.email ?? null,
            displayName: u.displayName ?? null,
            createdAt: u.metadata.creationTime ?? null,
            lastLoginAt: u.metadata.lastSignInTime ?? null,
          });
        } else {
          const existing = usersById.get(u.uid)!;
          usersById.set(u.uid, {
            ...existing,
            email: existing.email ?? u.email ?? null,
            displayName: existing.displayName ?? existing.name ?? u.displayName ?? null,
            lastLoginAt: existing.lastLoginAt ?? u.metadata.lastSignInTime ?? null,
            createdAt: existing.createdAt ?? u.metadata.creationTime ?? null,
          });
        }
      });
    } catch (err) {
      console.warn('auth().listUsers failed (continuing with Firestore users):', err);
    }

    // Build the final users array
    const builtUsers = Array.from(usersById.entries()).map(([uid, u]) => {
      const profile = profilesByUserId.get(uid);
      const initial = profile?.initialWaterprint ?? null;
      const current = profile?.currentWaterprint ?? null;
      const improvement = initial != null && current != null && initial > 0
        ? (((initial - current) / initial) * 100).toFixed(2)
        : null;

      const startDate = toIsoString(profile?.initialAssessment?.date)
        ?? toIsoString(profile?.createdAt)
        ?? toIsoString(u.createdAt);

      const dailyUsage = (profile?.progressHistory ?? [])
        .map((p) => ({
          date: toIsoString(p?.date),
          waterprint: typeof p?.waterprint === 'number' ? p.waterprint : (typeof p?.value === 'number' ? p.value : null),
        }))
        .filter((e): e is { date: string; waterprint: number } => !!e.date && typeof e.waterprint === 'number');

      return {
        id: uid,
        email: u.email ?? null,
        displayName: u.displayName ?? u.name ?? null,
        createdAt: toIsoString(u.createdAt) ?? new Date(0).toISOString(),
        lastLoginAt: toIsoString(u.lastLoginAt ?? u.updatedAt),
        waterprint: {
          initial,
          current,
          startDate,
          dailyUsage,
          improvement,
        },
      };
    });

    // Dedupe by email: when the same email appears with multiple UIDs (e.g. Firestore users
    // doc + Firebase Auth record), keep the record that has a waterprint profile.
    const byEmail = new Map<string, (typeof builtUsers)[number]>();
    const orphans: typeof builtUsers = [];
    for (const u of builtUsers) {
      const key = (u.email || '').trim().toLowerCase();
      if (!key) {
        orphans.push(u);
        continue;
      }
      const existing = byEmail.get(key);
      if (!existing) {
        byEmail.set(key, u);
        continue;
      }
      const existingHasData = existing.waterprint.initial != null || existing.waterprint.current != null;
      const candidateHasData = u.waterprint.initial != null || u.waterprint.current != null;
      if (candidateHasData && !existingHasData) {
        byEmail.set(key, { ...u, displayName: u.displayName ?? existing.displayName });
      } else if (!candidateHasData && existingHasData) {
        byEmail.set(key, { ...existing, displayName: existing.displayName ?? u.displayName });
      } else {
        byEmail.set(key, {
          ...existing,
          displayName: existing.displayName ?? u.displayName,
          lastLoginAt: existing.lastLoginAt ?? u.lastLoginAt,
        });
      }
    }
    const users = [...Array.from(byEmail.values()), ...orphans];

    // Aggregate stats
    const totalStats = {
      initialTotal: users.reduce((sum, u) => sum + (u.waterprint.initial || 0), 0),
      currentTotal: users.reduce((sum, u) => sum + (u.waterprint.current || 0), 0),
      userCount: users.length,
      activeUserCount: users.filter((u) => u.waterprint.current !== null).length,
    };

    const sortedByImprovement = [...users]
      .filter((u) => u.waterprint.improvement !== null)
      .sort((a, b) => Number(b.waterprint.improvement) - Number(a.waterprint.improvement));

    const sortedByInitial = [...users]
      .filter((u) => u.waterprint.initial !== null)
      .sort((a, b) => Number(a.waterprint.initial) - Number(b.waterprint.initial));

    // Build last-30-days daily chart from all users' progressHistory
    const last30Days = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).reverse();
    const dailyAgg = new Map<string, { total: number; count: number }>();
    last30Days.forEach((d) => dailyAgg.set(d, { total: 0, count: 0 }));
    users.forEach((u) => {
      u.waterprint.dailyUsage.forEach((entry) => {
        const dayKey = format(new Date(entry.date), 'yyyy-MM-dd');
        const bucket = dailyAgg.get(dayKey);
        if (bucket) {
          bucket.total += entry.waterprint;
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

    return NextResponse.json({
      users,
      stats: {
        topImprovement: sortedByImprovement.slice(0, 3),
        bestInitial: sortedByInitial.slice(0, 3),
        total: totalStats,
        dailyData,
      },
    });
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json(
      { error: 'Kullanıcı listesi alınamadı', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
