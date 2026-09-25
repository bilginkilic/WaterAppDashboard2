import { test, expect, type APIRequestContext } from '@playwright/test';
import fixture from '../../api/tests/fixtures/mobile-sync.json';
import { buildDashboardUser, indexProfilesByUserId, type UsersDoc, type WaterprintProfileDoc } from '../../lib/footprint';

/**
 * End to end on one set of data: the mobile app's exact sync payload goes
 * through the real Express API (in-memory Firebase), and the dashboard shows
 * rows built by the same lib/footprint code that /api/admin/users uses.
 *
 *   (cd api && npm run e2e:server)                     # API on :3001
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_SESSION_SECRET=... npm run dev
 *   E2E_API_URL=http://localhost:3001 ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run test:e2e:local
 */
const E2E_API = process.env.E2E_API_URL ?? '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';
const { _comment, ...syncBody } = fixture;
const Q1_SAVING = 111; // dishwasher "Yes" — the challenge the user completes

async function mobileUser(request: APIRequestContext, email: string, name: string) {
  const reg = await request.post(`${E2E_API}/api/auth/register`, { data: { email, password: 'Secret123!', name } });
  expect(reg.status()).toBe(201);
  const login = await request.post(`${E2E_API}/api/auth/login`, { data: { email, password: 'Secret123!' } });
  expect(login.ok()).toBe(true);
  return (await login.json()) as { userId: string; token: string };
}

test.describe('mobile → API → dashboard', () => {
  test.skip(!E2E_API || !ADMIN_EMAIL || !ADMIN_PASSWORD, 'Set E2E_API_URL, ADMIN_EMAIL and ADMIN_PASSWORD');

  test('a completed challenge shows up with the right numbers and filters', async ({ page, request }) => {
    await request.post(`${E2E_API}/__e2e/reset`);

    // Ayşe: survey synced, then one challenge completed in the app.
    const ayse = await mobileUser(request, 'ayse@waterapp.test', 'Ayşe E2E');
    const auth = { Authorization: `Bearer ${ayse.token}` };
    expect((await request.post(`${E2E_API}/api/waterprint/initial-profile`, {
      headers: auth,
      data: { initialWaterprint: syncBody.initialWaterprint, answers: syncBody.answers, correctAnswersCount: 0 },
    })).status()).toBe(201);
    expect((await request.post(`${E2E_API}/api/waterprint/sync`, {
      headers: auth,
      data: { ...syncBody, currentWaterprint: syncBody.initialWaterprint - Q1_SAVING },
    })).ok()).toBe(true);

    // Bob: registered only, no survey yet.
    await mobileUser(request, 'bob@waterapp.test', 'Bob E2E');

    const store = (await (await request.get(`${E2E_API}/__e2e/store`)).json()) as {
      users: Array<UsersDoc & { id: string }>;
      WaterprintProfiles: WaterprintProfileDoc[];
    };
    const profiles = indexProfilesByUserId(store.WaterprintProfiles);
    // Organisation labels are set by the admin; emulate that on the stored docs.
    const orgByEmail: Record<string, UsersDoc['organization']> = {
      'ayse@waterapp.test': 'MUFG Turkey',
      'bob@waterapp.test': 'MUFG London',
    };
    const users = store.users.map(({ id, ...doc }) =>
      buildDashboardUser(id, { ...doc, organization: orgByEmail[doc.email ?? ''] ?? null }, profiles.get(id))
    );
    const ayseRow = users.find((u) => u.email === 'ayse@waterapp.test')!;
    expect(ayseRow.waterprint).toMatchObject({ initial: 20996, current: 20885, improvement: '0.53' });

    await page.route('**/api/admin/users', (route) => route.fulfill({ json: { users } }));
    await page.route('**/api/admin/android-requests', (route) => route.fulfill({ json: { requests: [] } }));

    await page.goto('/login');
    const button = page.getByRole('button', { name: /sign in|giriş/i });
    await expect(button).toBeEnabled({ timeout: 15_000 });
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await button.click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    await page.getByRole('tab', { name: /users|kullanıcılar/i }).click();
    const row = page.locator('tbody tr', { hasText: 'Ayşe E2E' });
    await expect(row).toContainText(/20[.,]996/);
    await expect(row).toContainText(/20[.,]885/);
    await expect(row).toContainText('0.53%');
    await expect(page.locator('tbody tr', { hasText: 'Bob E2E' })).toBeVisible();

    const filter = page.getByRole('group', { name: /organisation|kurum/i });
    await filter.getByRole('button', { name: /^MUFG Turkey \(1\)/ }).click();
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr').first()).toContainText('Ayşe E2E');
  });
});
