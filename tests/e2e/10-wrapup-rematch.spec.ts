import { type Locator, type Page, expect, test } from '@playwright/test';

async function startTwoPlayerGame(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page.getByLabel('Player 1').fill('Ana');
  await page.getByLabel('Player 2').fill('Beto');
  await page.getByRole('button', { name: 'Start new game' }).click();
  await expect(page.getByRole('heading', { name: 'Qwixx', exact: true })).toBeVisible();
}

// Penalties are guarded: arm then confirm.
async function takePenalty(board: Locator): Promise<void> {
  await board.getByRole('button', { name: 'Take penalty' }).click();
  await board.getByRole('button', { name: 'Confirm penalty −5' }).click();
}

test.beforeEach(async ({ request }) => {
  await request.delete('/api/current').catch(() => undefined);
});

test('US6: final screen celebrates the winner; Share copies a summary; Rematch pre-fills names', async ({
  page,
  request,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
  });

  await startTwoPlayerGame(page);
  const ana = page.getByRole('region', { name: 'Scoreboard for Ana' });

  // Ana takes 4 penalties (−20); Beto stays at 0 and wins.
  for (let i = 0; i < 4; i += 1) await takePenalty(ana);
  await page.getByRole('button', { name: 'End game' }).click();

  await expect(page.getByRole('heading', { name: 'Final scores' })).toBeVisible();
  await expect(page.getByText('Beto wins!')).toBeVisible();

  // Share falls back to the clipboard with a confirmation toast.
  await page.getByRole('button', { name: 'Share results' }).click();
  await expect(page.getByText('Results copied to clipboard')).toBeVisible();

  // Rematch returns Home pre-filled with the same names (no retyping).
  await page.getByRole('button', { name: 'Rematch (same players)' }).click();
  await expect(page.getByRole('heading', { name: 'Qwixx', exact: true })).toBeVisible();
  await expect(page.getByLabel('Player 1')).toHaveValue('Ana');
  await expect(page.getByLabel('Player 2')).toHaveValue('Beto');

  await request.delete('/api/current').catch(() => undefined);
});

test('US6: a tie presents co-winners', async ({ page, request }) => {
  await startTwoPlayerGame(page);
  const ana = page.getByRole('region', { name: 'Scoreboard for Ana' });
  const beto = page.getByRole('region', { name: 'Scoreboard for Beto' });

  // Both reach −20 before the game ends → a tie.
  for (let i = 0; i < 4; i += 1) await takePenalty(ana);
  for (let i = 0; i < 4; i += 1) await takePenalty(beto);
  await page.getByRole('button', { name: 'End game' }).click();

  await expect(page.getByRole('heading', { name: 'Final scores' })).toBeVisible();
  await expect(page.getByText(/It's a tie — Ana & Beto win!/)).toBeVisible();

  await request.delete('/api/current').catch(() => undefined);
});
