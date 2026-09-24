import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';

// Live, read-only: logs in with ADMIN_EMAIL / ADMIN_PASSWORD and only reads data.
test.describe('Dashboard challenge visibility', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Set ADMIN_EMAIL and ADMIN_PASSWORD to run');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /sign in|giriş/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });

  test('dashboard loads stats and user table', async ({ page }) => {
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
    const cards = page.locator('[class*="atv-card"]');
    const table = page.locator('table');
    const noData = page.getByText(/no data|veri yok/i);
    await expect(cards.first().or(table.first()).or(noData.first())).toBeVisible({ timeout: 20_000 });
  });

  test('organisation filter is shown above the dashboard', async ({ page }) => {
    const filter = page.getByRole('group', { name: /organisation|kurum/i });
    await expect(filter).toBeVisible({ timeout: 20_000 });
    await expect(filter.getByRole('button', { name: /^(all|tümü)/i })).toBeVisible();
  });

  test('admin users API returns users for the logged-in admin', async ({ page }) => {
    // page.request shares the admin session cookie set by the login above.
    const res = await page.request.get('/api/admin/users');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.users)).toBe(true);
    expect(typeof body.stats.total.userCount).toBe('number');
  });
});
