import { type Page, expect, test } from '@playwright/test';

async function startTwoPlayerGame(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page.getByLabel('Player 1').fill('Ana');
  await page.getByLabel('Player 2').fill('Beto');
  await page.getByRole('button', { name: 'Start new game' }).click();
  await expect(page.getByRole('heading', { name: 'Qwixx', exact: true })).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  await request.delete('/api/current').catch(() => undefined);
});

test('US5: a single tap arms the penalty; only a second deliberate tap applies it', async ({
  page,
  request,
}) => {
  await startTwoPlayerGame(page);
  const ana = page.getByRole('region', { name: 'Scoreboard for Ana' });

  // First tap arms — it must NOT apply the −5 (SC-004).
  await ana.getByRole('button', { name: 'Take penalty' }).click();
  await expect(ana.getByLabel('Total 0')).toBeVisible();
  const confirm = ana.getByRole('button', { name: 'Confirm penalty −5' });
  await expect(confirm).toBeVisible();

  // Second deliberate tap applies it.
  await confirm.click();
  await expect(ana.getByLabel('Total -5')).toBeVisible();

  await request.delete('/api/current').catch(() => undefined);
});

test('US5: tapping elsewhere disarms the penalty without applying it', async ({
  page,
  request,
}) => {
  await startTwoPlayerGame(page);
  const ana = page.getByRole('region', { name: 'Scoreboard for Ana' });

  await ana.getByRole('button', { name: 'Take penalty' }).click();
  await expect(ana.getByRole('button', { name: 'Confirm penalty −5' })).toBeVisible();

  // Tap elsewhere → disarm.
  await page.getByRole('heading', { name: 'Qwixx', exact: true }).click();
  await expect(ana.getByRole('button', { name: 'Take penalty' })).toBeVisible();
  await expect(ana.getByLabel('Total 0')).toBeVisible();

  await request.delete('/api/current').catch(() => undefined);
});
