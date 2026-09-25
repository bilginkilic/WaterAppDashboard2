import { isOrganization, type Organization } from './organizations';

// Firestore dokümanlarından dashboard kullanıcı satırını üreten saf fonksiyonlar.
// /api/admin/users ve e2e testleri aynı kodu kullanır.

export type AnyDate = string | number | Date | { _seconds?: number; seconds?: number; toDate?: () => Date } | null | undefined;

export function toIsoString(value: AnyDate): string | null {
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

export interface ProgressEntry {
  date: AnyDate;
  waterprint: number;
  value?: number;
}

export interface WaterprintProfileDoc {
  userId: string;
  initialWaterprint?: number | null;
  currentWaterprint?: number | null;
  initialAssessment?: { date?: AnyDate } | null;
  progressHistory?: ProgressEntry[];
  createdAt?: AnyDate;
}

export interface UsersDoc {
  email?: string | null;
  name?: string | null;
  displayName?: string | null;
  platform?: string | null;
  createdAt?: AnyDate;
  updatedAt?: AnyDate;
  lastLoginAt?: AnyDate;
  organization?: string | null;
}


export interface DashboardUser {
  id: string;
  email: string | null;
  displayName: string | null;
  organization: Organization | null;
  createdAt: string;
  lastLoginAt: string | null;
  waterprint: {
    initial: number | null;
    current: number | null;
    startDate: string | null;
    dailyUsage: { date: string; waterprint: number }[];
    improvement: string | null;
  };
}

/** Kullanıcı ve (varsa) su ayak izi profilinden tek dashboard satırı. */
export function buildDashboardUser(uid: string, u: UsersDoc, profile?: WaterprintProfileDoc): DashboardUser {
  const initial = numberOrNull(profile?.initialWaterprint);
  const current = numberOrNull(profile?.currentWaterprint);
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
    organization: isOrganization(u.organization) ? u.organization : null,
    createdAt: toIsoString(u.createdAt) ?? new Date(0).toISOString(),
    lastLoginAt: toIsoString(u.lastLoginAt ?? u.updatedAt),
    waterprint: { initial, current, startDate, dailyUsage, improvement },
  };
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

const hasData = (u: DashboardUser) => u.waterprint.initial != null || u.waterprint.current != null;

/**
 * Aynı e-posta birden fazla UID ile görünürse (ör. Firestore users + Auth kaydı)
 * su ayak izi verisi olan kaydı tutar.
 */
export function dedupeUsersByEmail(builtUsers: DashboardUser[]): DashboardUser[] {
  const byEmail = new Map<string, DashboardUser>();
  const orphans: DashboardUser[] = [];
  for (const u of builtUsers) {
    const key = (u.email || '').trim().toLowerCase();
    if (!key) {
      orphans.push(u);
      continue;
    }
    const existing = byEmail.get(key);
    if (!existing) {
      byEmail.set(key, u);
    } else if (hasData(u) && !hasData(existing)) {
      byEmail.set(key, {
        ...u,
        displayName: u.displayName ?? existing.displayName,
        organization: u.organization ?? existing.organization,
      });
    } else {
      byEmail.set(key, {
        ...existing,
        displayName: existing.displayName ?? u.displayName,
        lastLoginAt: existing.lastLoginAt ?? u.lastLoginAt,
        organization: existing.organization ?? u.organization,
      });
    }
  }
  return [...Array.from(byEmail.values()), ...orphans];
}

/** Profilleri userId'ye göre indeksler; aynı kullanıcıya birden çok profil varsa en güncelini seçer. */
export function indexProfilesByUserId(profiles: WaterprintProfileDoc[]): Map<string, WaterprintProfileDoc> {
  const byUser = new Map<string, WaterprintProfileDoc>();
  for (const p of profiles) {
    if (!p?.userId) continue;
    const prev = byUser.get(p.userId);
    if (!prev || latestActivity(p) >= latestActivity(prev)) byUser.set(p.userId, p);
  }
  return byUser;
}

function latestActivity(p: WaterprintProfileDoc): number {
  const dates = [p.createdAt, p.initialAssessment?.date, ...(p.progressHistory ?? []).map((e) => e?.date)]
    .map((d) => toIsoString(d))
    .filter((d): d is string => !!d)
    .map((d) => Date.parse(d));
  return dates.length ? Math.max(...dates) : 0;
}
