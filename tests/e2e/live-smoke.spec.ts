import { test, expect } from '@playwright/test';

const LIVE = 'https://neural-wire-nine.vercel.app';

test.describe('Live Vercel smoke', () => {
  test('homepage loads and shows nav items', async ({ page }) => {
    await page.goto(LIVE, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(LIVE);
    await expect(page.getByRole('link', { name: /Custom Alerts/i })).toBeVisible();
    await expect(page.getByText(/Anthropic/i).first()).toBeVisible();
  });

  test('alerts page loads', async ({ page }) => {
    await page.goto(`${LIVE}/alerts`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /CUSTOM ALERTS/i })).toBeVisible();
    await expect(page.getByLabel('Name')).toBeVisible();
  });
});
