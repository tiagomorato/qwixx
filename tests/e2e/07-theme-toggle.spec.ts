import AxeBuilder from '@axe-core/playwright';
import { type Page, expect, test } from '@playwright/test';

async function startTwoPlayerGame(page: Page): Promise<void> {
  await page.goto('/');
  // Not 'networkidle': the live-sync EventSource keeps a connection open.
  await expect(page.getByRole('button', { name: '2', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page.getByLabel('Player 1').fill('Ana');
  await page.getByLabel('Player 2').fill('Beto');
  await page.getByRole('button', { name: 'Start new game' }).click();
  await expect(page.getByRole('heading', { name: 'Qwixx', exact: true })).toBeVisible();
}

function themeAttr(page: Page): Promise<string | null> {
  return page.evaluate(() => document.documentElement.dataset.theme ?? null);
}

test.beforeEach(async ({ request }) => {
  await request.delete('/api/current').catch(() => undefined);
});

test('US4: theme choice applies immediately, overrides system, persists, and System tracks the OS', async ({
  page,
  request,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await startTwoPlayerGame(page);

  // Explicit Light overrides the OS dark preference.
  await page.getByRole('button', { name: 'Light' }).click();
  expect(await themeAttr(page)).toBe('light');

  // Explicit Dark.
  await page.getByRole('button', { name: 'Dark' }).click();
  expect(await themeAttr(page)).toBe('dark');

  // Persists across a reload. Wait for the game to reach the server first,
  // otherwise the reload lands on the setup screen, which has no theme toggle.
  await expect
    .poll(async () => (await (await request.get('/api/current')).json()).game?.players?.length ?? 0)
    .toBe(2);
  await page.reload();
  await expect.poll(() => themeAttr(page)).toBe('dark');

  // System removes the explicit override and follows the (dark) OS preference.
  await page.getByRole('button', { name: 'System' }).click();
  expect(await themeAttr(page)).toBeNull();
  const surface = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--qx-surface').trim(),
  );
  expect(surface.toLowerCase()).toBe('#14141a');

  // The toggle passes an accessibility audit.
  const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
  expect(results.violations).toEqual([]);

  await request.delete('/api/current').catch(() => undefined);
});
