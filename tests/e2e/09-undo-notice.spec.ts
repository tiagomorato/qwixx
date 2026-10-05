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

test('US5: an undo on one device shows a matching undo notice on both', async ({
  browser,
  request,
}) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const a = await ctxA.newPage();
  const b = await ctxB.newPage();

  await startTwoPlayerGame(a);
  // Wait until the game has reached the server instead of a fixed delay.
  await expect
    .poll(
      async () => (await (await a.request.get('/api/current')).json()).game?.players?.length ?? 0,
    )
    .toBe(2);
  await b.goto('/');
  await expect(b.getByRole('region', { name: 'Scoreboard for Ana' })).toBeVisible();

  // A marks a cell; wait for it to sync to B.
  await a
    .getByRole('region', { name: 'Scoreboard for Ana' })
    .getByRole('button', { name: 'red 2' })
    .click();
  await expect(
    b.getByRole('region', { name: 'Scoreboard for Ana' }).getByLabel('Total 1'),
  ).toBeVisible();

  // A undoes it → both devices show a notice naming the action and the player.
  await a.getByRole('button', { name: 'Undo last action' }).click();
  await expect(a.getByText("Undid Ana's red mark")).toBeVisible();
  await expect(b.getByText("Undid Ana's red mark")).toBeVisible();

  await ctxA.close();
  await ctxB.close();
  await request.delete('/api/current').catch(() => undefined);
});
