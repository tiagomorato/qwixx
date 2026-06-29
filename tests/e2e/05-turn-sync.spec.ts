import { type Page, expect, test } from '@playwright/test';

const NAMES = ['Ana', 'Beto', 'Cora'];

async function startThreePlayerGame(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: '3', exact: true }).click();
  for (let i = 0; i < NAMES.length; i += 1) {
    await page.getByLabel(`Player ${i + 1}`).fill(NAMES[i] ?? '');
  }
  await page.getByRole('button', { name: 'Start new game' }).click();
  await expect(page.getByRole('heading', { name: 'Qwixx', exact: true })).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  await request.delete('/api/current').catch(() => undefined);
});

test('US2: advancing the turn on one device updates the active highlight on the other', async ({
  browser,
  request,
}) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const a = await ctxA.newPage();
  const b = await ctxB.newPage();

  await startThreePlayerGame(a);
  // Let the debounced PUT flush so the second device can load the game.
  await a.waitForTimeout(600);

  await b.goto('/');
  await b.waitForLoadState('networkidle');
  await expect(b.getByRole('region', { name: 'Scoreboard for Ana' })).toBeVisible();

  // First player is active on both devices.
  await expect(a.getByRole('region', { name: 'Scoreboard for Ana' })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(b.getByRole('region', { name: 'Scoreboard for Ana' })).toHaveAttribute(
    'aria-current',
    'true',
  );

  // Advance on A → Beto becomes active on both.
  await a.getByRole('button', { name: 'Next player' }).click();
  await expect(a.getByRole('region', { name: 'Scoreboard for Beto' })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(b.getByRole('region', { name: 'Scoreboard for Beto' })).toHaveAttribute(
    'aria-current',
    'true',
  );

  await ctxA.close();
  await ctxB.close();
  await request.delete('/api/current').catch(() => undefined);
});
