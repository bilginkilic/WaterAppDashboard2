import { test, expect } from '@playwright/test';
import {
  buildDashboardUser,
  dedupeUsersByEmail,
  indexProfilesByUserId,
  toIsoString,
} from '../../lib/footprint';
import { computeDashboardStats } from '../../lib/dashboardStats';
import { isOrganization, ORGANIZATIONS } from '../../lib/organizations';

const ts = (iso: string) => ({ _seconds: Date.parse(iso) / 1000 });

test('toIsoString handles Timestamps, dates, strings and junk', () => {
  expect(toIsoString(ts('2026-09-25T10:00:00.000Z'))).toBe('2026-09-25T10:00:00.000Z');
  expect(toIsoString({ toDate: () => new Date('2026-01-01T00:00:00Z') })).toBe('2026-01-01T00:00:00.000Z');
  expect(toIsoString('2026-02-03T04:05:06Z')).toBe('2026-02-03T04:05:06.000Z');
  expect(toIsoString(new Date('2026-03-01T00:00:00Z'))).toBe('2026-03-01T00:00:00.000Z');
  expect(toIsoString('not a date')).toBeNull();
  expect(toIsoString(null)).toBeNull();
});

test('buildDashboardUser: initial/current/improvement come straight from the synced profile', () => {
  const u = buildDashboardUser(
    'uid1',
    { email: 'a@x.test', name: 'Ayşe', organization: 'MUFG Turkey', createdAt: '2026-09-01T00:00:00Z' },
    {
      userId: 'uid1',
      initialWaterprint: 20996,
      currentWaterprint: 20885,
      initialAssessment: { date: ts('2026-09-20T00:00:00Z') },
      progressHistory: [
        { date: ts('2026-09-20T00:00:00Z'), waterprint: 20996 },
        { date: ts('2026-09-21T00:00:00Z'), waterprint: 20885 },
      ],
    }
  );
  expect(u).toMatchObject({
    id: 'uid1',
    email: 'a@x.test',
    displayName: 'Ayşe',
    organization: 'MUFG Turkey',
    waterprint: { initial: 20996, current: 20885, improvement: '0.53', startDate: '2026-09-20T00:00:00.000Z' },
  });
  expect(u.waterprint.dailyUsage).toHaveLength(2);
});

test('buildDashboardUser: user without a profile or with bad values', () => {
  const none = buildDashboardUser('uid2', { email: 'b@x.test', organization: 'Other Co' });
  expect(none.waterprint).toMatchObject({ initial: null, current: null, improvement: null });
  expect(none.organization).toBeNull();

  const bad = buildDashboardUser('uid3', {}, { userId: 'uid3', initialWaterprint: NaN, currentWaterprint: 5 });
  expect(bad.waterprint.initial).toBeNull();
  expect(bad.waterprint.improvement).toBeNull();
});

test('dedupeUsersByEmail keeps the record that has footprint data', () => {
  const withData = buildDashboardUser('auth', { email: 'C@x.test' }, { userId: 'auth', initialWaterprint: 100, currentWaterprint: 90 });
  const withoutData = buildDashboardUser('doc', { email: 'c@x.test', name: 'Cem', organization: 'MUFG London' });
  const [merged, ...rest] = dedupeUsersByEmail([withoutData, withData]);
  expect(rest).toHaveLength(0);
  expect(merged).toMatchObject({ id: 'auth', displayName: 'Cem', organization: 'MUFG London', waterprint: { initial: 100 } });
});

test('indexProfilesByUserId picks the most recently active profile', () => {
  const idx = indexProfilesByUserId([
    { userId: 'u', initialWaterprint: 1, progressHistory: [{ date: ts('2026-09-01T00:00:00Z'), waterprint: 1 }] },
    { userId: 'u', initialWaterprint: 2, progressHistory: [{ date: ts('2026-09-10T00:00:00Z'), waterprint: 2 }] },
    { userId: 'u', initialWaterprint: 3, progressHistory: [{ date: ts('2026-09-05T00:00:00Z'), waterprint: 3 }] },
  ]);
  expect(idx.get('u')?.initialWaterprint).toBe(2);
});

test('computeDashboardStats totals, active users and rankings', () => {
  const users = [
    buildDashboardUser('a', { email: 'a@x' }, { userId: 'a', initialWaterprint: 1000, currentWaterprint: 800 }),
    buildDashboardUser('b', { email: 'b@x' }, { userId: 'b', initialWaterprint: 500, currentWaterprint: 450 }),
    buildDashboardUser('c', { email: 'c@x' }),
  ];
  const stats = computeDashboardStats(users);
  expect(stats.total).toEqual({ initialTotal: 1500, currentTotal: 1250, userCount: 3, activeUserCount: 2 });
  expect(stats.topImprovement.map((u) => u.id)).toEqual(['a', 'b']);
  expect(stats.bestInitial.map((u) => u.id)).toEqual(['b', 'a']);
  expect(stats.dailyData).toHaveLength(30);
});

test('organizations are a closed list', () => {
  expect([...ORGANIZATIONS]).toEqual(['MUFG Turkey', 'MUFG London']);
  expect(isOrganization('MUFG Turkey')).toBe(true);
  expect(isOrganization('mufg turkey')).toBe(false);
  expect(isOrganization(undefined)).toBe(false);
});
