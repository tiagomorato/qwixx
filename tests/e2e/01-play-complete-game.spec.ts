import AxeBuilder from '@axe-core/playwright';
import { type Page, expect, test } from '@playwright/test';

const NAMES = ['Ana', 'Beto', 'Cora'];

async function startGame(page: Page): Promise<void> {
  await page.goto('/');
  // Not 'networkidle': the live-sync EventSource keeps a connection open.
  await expect(page.getByRole('button', { name: 'Start new game' })).toBeVisible();
  await page.getByRole('button', { name: 'Start new game' }).click();
  // Default count is 2; need to click 3
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

test('US1: start a 3-player game, mark cells, lock a row, take penalty, see final scores, resume after reload', async ({
  page,
  request,
}) => {
  await page.goto('/');

  // Accessibility check on the home screen
  const homeResults = await new AxeBuilder({ page })
    .disableRules(['color-contrast']) // tokens are intentionally muted dark/light per scheme
    .analyze();
  expect(homeResults.violations).toEqual([]);

  await startGame(page);

  const anaBoard = page.getByRole('region', { name: 'Scoreboard for Ana' });
  await expect(anaBoard).toBeVisible();

  // Mark a few cells in Ana's red row (values 2,3,4)
  for (const value of [2, 3, 4]) {
    await anaBoard.getByRole('button', { name: `red ${value}` }).click();
  }

  // Score should reflect 3 marks = 6 points
  await expect(anaBoard.getByLabel('Total 6')).toBeVisible();

  // Take a penalty for Beto (-5 each). Penalties are guarded: arm then confirm.
  const betoBoard = page.getByRole('region', { name: 'Scoreboard for Beto' });
  await betoBoard.getByRole('button', { name: 'Take penalty' }).click();
  await betoBoard.getByRole('button', { name: 'Confirm penalty −5' }).click();
  await expect(betoBoard.getByLabel('Total -5')).toBeVisible();

  // Drive an end condition: Ana takes 4 penalties total
  for (let i = 0; i < 4; i += 1) {
    await anaBoard.getByRole('button', { name: 'Take penalty' }).click();
    await anaBoard.getByRole('button', { name: 'Confirm penalty −5' }).click();
  }

  // The game does not auto-finalize; an "End game" button appears instead.
  const endGame = page.getByRole('button', { name: 'End game' });
  await expect(endGame).toBeVisible();
  // Wait for the server to confirm the finalize instead of a fixed delay.
  const finalized = page.waitForResponse(
    (res) => res.url().endsWith('/api/current/finalize') && res.request().method() === 'POST',
  );
  await endGame.click();

  // Game should transition to final scores screen
  await expect(page.getByRole('heading', { name: 'Final scores' })).toBeVisible();
  await finalized;

  // After reload, game should resume (in final state since it was finalized)
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Final scores' })).toBeVisible();

  // Cleanup
  await request.delete('/api/current').catch(() => undefined);
});

test('US1: resume an in-progress game after reload', async ({ page, request }) => {
  await startGame(page);
  const anaBoard = page.getByRole('region', { name: 'Scoreboard for Ana' });
  await anaBoard.getByRole('button', { name: 'red 5' }).click();
  await expect(anaBoard.getByLabel('Total 1')).toBeVisible();

  // Wait until the debounced save has reached the server instead of a fixed delay.
  await expect
    .poll(async () => {
      const { game } = await (await request.get('/api/current')).json();
      const red = game?.players?.[0]?.rows?.find((r: { color: string }) => r.color === 'red');
      return red?.cells?.find((c: { value: number }) => c.value === 5)?.marked ?? false;
    })
    .toBe(true);
  await page.reload();

  const resumedBoard = page.getByRole('region', { name: 'Scoreboard for Ana' });
  await expect(resumedBoard).toBeVisible();
  await expect(resumedBoard.getByLabel('Total 1')).toBeVisible();

  await request.delete('/api/current').catch(() => undefined);
});
