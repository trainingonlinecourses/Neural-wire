import { test, expect } from '@playwright/test';

test.describe('Expanded sources and Custom Alerts', () => {
  test('homepage shows expanded sources and Custom Alerts nav link', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Custom Alerts/i })).toBeVisible();
    await expect(page.getByText(/Anthropic/i).first()).toBeVisible();
  });

  test('Custom Alerts page loads and form is present', async ({ page }) => {
    await page.goto('/alerts', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /CUSTOM ALERTS/i })).toBeVisible();
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Keywords')).toBeVisible();
  });
});
