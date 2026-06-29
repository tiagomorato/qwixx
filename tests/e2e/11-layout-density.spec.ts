import { type Page, expect, test } from '@playwright/test';

const NAMES = ['Ana', 'Beto', 'Cora', 'Dia', 'Eli', 'Fin'];

async function startSixPlayerGame(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: '6', exact: true }).click();
  for (let i = 0; i < NAMES.length; i += 1) {
    await page.getByLabel(`Player ${i + 1}`).fill(NAMES[i] ?? '');
  }
  await page.getByRole('button', { name: 'Start new game' }).click();
  await expect(page.getByRole('heading', { name: 'Qwixx', exact: true })).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  await request.delete('/api/current').catch(() => undefined);
});

test.use({ viewport: { width: 375, height: 812 } });

test('US7: at 375px with 6 players, number cells stay tappable and boards do not clip', async ({
  page,
  request,
}) => {
  await startSixPlayerGame(page);
  const ana = page.getByRole('region', { name: 'Scoreboard for Ana' });
  await expect(ana).toBeVisible();

  // Number cells hold the minimum tap target (44px) at the max player count.
  const cell = ana.getByRole('button', { name: 'red 2' });
  const box = await cell.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

  // The board does not overflow its own width (nothing clipped horizontally).
  const overflow = await ana.evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  // The page itself does not scroll horizontally.
  const docOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(docOverflow).toBeLessThanOrEqual(1);

  await request.delete('/api/current').catch(() => undefined);
});
