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
