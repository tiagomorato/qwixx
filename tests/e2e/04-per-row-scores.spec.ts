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

test.beforeEach(async ({ request }) => {
  await request.delete('/api/current').catch(() => undefined);
});

test('US1: per-row score updates on mark, adds the lock bonus, and follows the points toggle', async ({
  page,
  request,
}) => {
  await startTwoPlayerGame(page);
  const ana = page.getByRole('region', { name: 'Scoreboard for Ana' });

  // One mark in red → SCORE[1] = 1.
  await ana.getByRole('button', { name: 'red 2' }).click();
  await expect(ana.getByLabel('red row score 1')).toBeVisible();

  // Two marks → SCORE[2] = 3.
  await ana.getByRole('button', { name: 'red 3' }).click();
  await expect(ana.getByLabel('red row score 3')).toBeVisible();

  // Mark up to five cells, then lock the row (marks the rightmost + lock bonus).
  for (const value of [4, 5, 6]) {
    await ana.getByRole('button', { name: `red ${value}` }).click();
  }
  await expect(ana.getByLabel('red row score 15')).toBeVisible(); // 5 marks
  await ana.getByRole('button', { name: 'Lock red row' }).click();
  // 5 explicit marks + rightmost + lock bonus = 7 → SCORE[7] = 28.
  await expect(ana.getByLabel('red row score 28')).toBeVisible();

  // Hide points hides the per-row scores along with the grand total.
  await page.getByRole('button', { name: 'Hide points' }).click();
  await expect(ana.getByLabel('red row score 28')).toHaveCount(0);
  await expect(ana.getByLabel('Total hidden')).toBeVisible();

  // Show points brings them back.
  await page.getByRole('button', { name: 'Show points' }).click();
  await expect(ana.getByLabel('red row score 28')).toBeVisible();

  await request.delete('/api/current').catch(() => undefined);
});
