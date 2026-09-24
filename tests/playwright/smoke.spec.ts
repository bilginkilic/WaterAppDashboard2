import { test, expect } from '@playwright/test';

// Read-only checks: safe to run against production (PLAYWRIGHT_BASE_URL).

test.describe('WaterApp Dashboard smoke', () => {
  test('home redirects to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page has form fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|giriş/i })).toBeVisible();
  });

  test('sign-in button enables once the session check has finished', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /sign in|giriş/i })).toBeEnabled({ timeout: 15_000 });
  });

  test('dashboard requires auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Admin API requires a session', () => {
  test('session endpoint reports logged out', async ({ request }) => {
    const res = await request.get('/api/admin/session');
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ authenticated: false });
  });

  test('users list is not public', async ({ request }) => {
    const res = await request.get('/api/admin/users');
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.users).toBeUndefined();
  });

  test('organisation update is not public', async ({ request }) => {
    const res = await request.post('/api/admin/users/organization', {
      data: { userIds: ['smoke-test'], organization: 'MUFG Turkey' },
    });
    expect(res.status()).toBe(401);
  });

  test('user data reset is not public', async ({ request }) => {
    const res = await request.post('/api/admin/users/reset', { data: { userId: 'smoke-test' } });
    expect(res.status()).toBe(401);
  });

  test('wrong credentials are rejected', async ({ request }) => {
    const res = await request.post('/api/admin/login', {
      data: { email: 'nobody@example.com', password: 'wrong-password' },
    });
    // 401 when admin auth is configured, 503 when the env vars are missing.
    expect([401, 503]).toContain(res.status());
    expect(res.headers()['set-cookie'] ?? '').not.toContain('wa_admin_session');
  });
});

test.describe('Public download page', () => {
  test('is public and shows iOS and Android sections', async ({ page }) => {
    await page.goto('/download');
    await expect(page).toHaveURL(/\/download/);
    await expect(page.locator('a[href*="apps.apple.com"]')).toBeVisible();
    await expect(page.locator('#android form')).toBeVisible();
  });

  test('QR code images are served', async ({ request }) => {
    for (const path of ['/qr/ios.svg', '/qr/android.svg', '/qr/download.svg', '/qr/download.png']) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
    }
  });

  test('Netlify form definition is served', async ({ request }) => {
    const res = await request.get('/__forms.html');
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain('name="android-tester"');
  });

  test('Android request rejects invalid input without saving', async ({ request }) => {
    const res = await request.post('/api/android-requests', { data: { name: 'x', email: 'not-an-email' } });
    expect(res.status()).toBe(400);
  });

  test('Android request list is not public', async ({ request }) => {
    const res = await request.get('/api/admin/android-requests');
    expect(res.status()).toBe(401);
  });
});
