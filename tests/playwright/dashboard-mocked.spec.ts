import { test, expect, type Page } from '@playwright/test';

/**
 * Dashboard UI with the admin data API mocked (no Firebase needed).
 * Run against a local server started with the same ADMIN_* env vars, e.g.
 *   ADMIN_EMAIL=e2e@example.com ADMIN_PASSWORD=... ADMIN_SESSION_SECRET=... npm run build && npm start
 *   ADMIN_EMAIL=e2e@example.com ADMIN_PASSWORD=... npm run test:e2e:mocked
 * Never point this at production: it only makes sense with mocked data.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

type MockUser = {
  id: string;
  email: string;
  displayName: string;
  organization: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  waterprint: {
    initial: number | null;
    current: number | null;
    startDate: string | null;
    improvement: string | null;
    dailyUsage: { date: string; waterprint: number }[];
  };
};

function mockUser(id: string, name: string, organization: string | null, initial: number | null, current: number | null): MockUser {
  return {
    id,
    email: `${id}@example.com`,
    displayName: name,
    organization,
    createdAt: '2026-09-01T00:00:00.000Z',
    lastLoginAt: null,
    waterprint: {
      initial,
      current,
      startDate: '2026-09-01T00:00:00.000Z',
      improvement: initial && current ? (((initial - current) / initial) * 100).toFixed(2) : null,
      dailyUsage: current ? [{ date: new Date().toISOString(), waterprint: current }] : [],
    },
  };
}

async function setupMocks(page: Page) {
  let users = [
    mockUser('ayse', 'Ayşe', 'MUFG Turkey', 1000, 800),
    mockUser('cem', 'Cem', 'MUFG Turkey', 500, 450),
    mockUser('bob', 'Bob', 'MUFG London', 900, 850),
  ];
  const requests = { organization: [] as unknown[], reset: [] as unknown[], androidStatus: [] as unknown[] };

  await page.route('**/api/admin/users', (route) => route.fulfill({ json: { users } }));
  await page.route('**/api/admin/android-requests', (route) => {
    if (route.request().method() === 'POST') {
      requests.androidStatus.push(route.request().postDataJSON());
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({
      json: {
        requests: [
          { id: 'r1', name: 'Deniz Android', email: 'deniz@gmail.com', organization: 'MUFG Turkey', status: 'new', createdAt: '2026-09-24T09:00:00.000Z' },
        ],
      },
    });
  });
  await page.route('**/api/admin/users/organization', (route) => {
    const body = route.request().postDataJSON() as { userIds: string[]; organization: string | null };
    requests.organization.push(body);
    users = users.map((u) => (body.userIds.includes(u.id) ? { ...u, organization: body.organization } : u));
    return route.fulfill({ json: { ok: true, updated: body.userIds.length } });
  });
  await page.route('**/api/admin/users/reset', (route) => {
    const body = route.request().postDataJSON() as { userId: string };
    requests.reset.push(body);
    users = users.map((u) =>
      u.id === body.userId
        ? { ...u, waterprint: { initial: null, current: null, startDate: null, improvement: null, dailyUsage: [] } }
        : u
    );
    return route.fulfill({ json: { ok: true, deleted: { waterprintProfiles: 1, waterprints: 0 } } });
  });
  return requests;
}

async function login(page: Page) {
  await page.goto('/login');
  const button = page.getByRole('button', { name: /sign in|giriş/i });
  await expect(button).toBeEnabled({ timeout: 15_000 });
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await button.click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

const totalUsersCard = (page: Page) => page.locator('.atv-card').first();

test.describe('Dashboard with mocked admin data', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Set ADMIN_EMAIL and ADMIN_PASSWORD (matching the local server)');
  test.skip(/netlify\.app|waterapp/i.test(new URL(baseURL).hostname), 'Mocked UI tests only run against a local server');

  test('organisation filter drives cards and the user list', async ({ page }) => {
    await setupMocks(page);
    await login(page);

    const filter = page.getByRole('group', { name: /organisation|kurum/i });
    await expect(filter.getByRole('button', { name: /^(All|Tümü) \(3\)/ })).toBeVisible();
    await expect(totalUsersCard(page)).toContainText('3');

    await filter.getByRole('button', { name: /^MUFG Turkey \(2\)/ }).click();
    await expect(totalUsersCard(page)).toContainText('2');
    await page.getByRole('tab', { name: /users|kullanıcılar/i }).click();
    await expect(page.locator('tbody tr')).toHaveCount(2);

    await filter.getByRole('button', { name: /^MUFG London \(1\)/ }).click();
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr').first()).toContainText('Bob');
  });

  test('changing a user organisation posts the update and keeps the dialog open', async ({ page }) => {
    const requests = await setupMocks(page);
    await login(page);

    await page.getByRole('tab', { name: /users|kullanıcılar/i }).click();
    await page.locator('tbody tr', { hasText: 'Bob' }).click();
    await page.locator('#user-organization').selectOption('MUFG Turkey');

    await expect.poll(() => requests.organization).toEqual([{ userIds: ['bob'], organization: 'MUFG Turkey' }]);
    await expect(page.locator('#user-organization')).toHaveValue('MUFG Turkey');
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('group', { name: /organisation|kurum/i }).getByRole('button', { name: /^MUFG Turkey \(3\)/ })
    ).toBeVisible();
  });

  test('reset challenge data asks for confirmation and posts the user id', async ({ page }) => {
    const requests = await setupMocks(page);
    await login(page);

    await page.getByRole('tab', { name: /users|kullanıcılar/i }).click();
    await page.locator('tbody tr', { hasText: 'Ayşe' }).click();

    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: /reset challenge data|sıfırla/i }).click();
    expect(requests.reset).toEqual([]);

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /reset challenge data|sıfırla/i }).click();
    await expect.poll(() => requests.reset).toEqual([{ userId: 'ayse' }]);
    await expect(page.getByRole('status')).toContainText(/reset|sıfırlandı/i);
    await expect(page.locator('#user-organization')).toHaveValue('MUFG Turkey');
  });
});

test.describe('Download page form (API mocked)', () => {
  test.skip(/netlify\.app|waterapp/i.test(new URL(baseURL).hostname), 'Mocked UI tests only run against a local server');

  async function mockSubmissions(page: Page) {
    const sent = { api: [] as unknown[], netlify: [] as string[] };
    await page.route('**/api/android-requests', (route) => {
      sent.api.push(route.request().postDataJSON());
      return route.fulfill({ json: { ok: true } });
    });
    await page.route('**/__forms.html', (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      sent.netlify.push(route.request().postData() ?? '');
      return route.fulfill({ status: 200, body: '' });
    });
    return sent;
  }

  test('valid submission posts to the API and Netlify Forms', async ({ page }) => {
    const sent = await mockSubmissions(page);
    await page.goto('/download#android');
    await page.locator('#ar-name').fill('Deniz Yılmaz');
    await page.locator('#ar-email').fill('deniz@gmail.com');
    await page.locator('#android button[type=submit]').click();

    await expect(page.locator('#android [role=status]')).toBeVisible();
    expect(sent.api).toEqual([{ name: 'Deniz Yılmaz', email: 'deniz@gmail.com' }]);
    const form = new URLSearchParams(sent.netlify[0]);
    expect(form.get('form-name')).toBe('android-tester');
    expect(form.get('email')).toBe('deniz@gmail.com');
    expect(form.get('organization')).toBe('MUFG Turkey');
  });

  test('invalid e-mail shows an error and sends nothing', async ({ page }) => {
    const sent = await mockSubmissions(page);
    await page.goto('/download');
    await page.locator('#ar-name').fill('Deniz');
    await page.locator('#ar-email').fill('deniz@');
    await page.locator('#android button[type=submit]').click();
    await expect(page.locator('#android [role=alert]')).toBeVisible();
    expect(sent.api).toEqual([]);
    expect(sent.netlify).toEqual([]);
  });

  test('honeypot submissions are dropped', async ({ page }) => {
    const sent = await mockSubmissions(page);
    await page.goto('/download');
    await page.locator('#ar-name').fill('Bot Name');
    await page.locator('#ar-email').fill('bot@example.com');
    await page.locator('#ar-company').fill('spam', { force: true });
    await page.locator('#android button[type=submit]').click();
    await expect(page.locator('#android [role=status]')).toBeVisible();
    expect(sent.api).toEqual([]);
    expect(sent.netlify).toEqual([]);
  });
});

test.describe('Dashboard Android requests tab (mocked)', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Set ADMIN_EMAIL and ADMIN_PASSWORD (matching the local server)');
  test.skip(/netlify\.app|waterapp/i.test(new URL(baseURL).hostname), 'Mocked UI tests only run against a local server');

  test('lists requests with a pending badge and marks one as added', async ({ page }) => {
    const requests = await setupMocks(page);
    await login(page);
    const tab = page.getByRole('tab', { name: /android/i });
    await expect(tab).toContainText('1');
    await tab.click();
    await expect(page.getByRole('cell', { name: 'deniz@gmail.com' })).toBeVisible();
    await page.getByRole('button', { name: /mark as added|eklendi olarak/i }).click();
    await expect.poll(() => requests.androidStatus).toEqual([{ id: 'r1', status: 'added' }]);
    await expect(page.getByText(/added to play list|play listesine eklendi/i)).toBeVisible();
  });
});
