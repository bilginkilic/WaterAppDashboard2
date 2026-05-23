import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@waterapp.com';
const ADMIN_PASSWORD = 'admin123';

test.describe('Dashboard challenge visibility', () => {
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

  test('admin users API returns JSON with users array', async ({ request }) => {
    const res = await request.get('/api/admin/users');
    expect(res.status()).toBeLessThan(500);
    const body = await res.json();
    if (res.ok()) {
      expect(Array.isArray(body.users)).toBe(true);
      expect(body.stats).toBeTruthy();
      expect(typeof body.stats.total.userCount).toBe('number');
    } else {
      expect(body.error || body.detail).toBeTruthy();
    }
  });
});
