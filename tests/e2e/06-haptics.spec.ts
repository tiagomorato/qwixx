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

test('US3: a stubbed navigator.vibrate fires once per state-changing tap', async ({
  page,
  request,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { __vibes: number }).__vibes = 0;
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: () => {
        (window as unknown as { __vibes: number }).__vibes += 1;
        return true;
      },
    });
  });

  await startTwoPlayerGame(page);
  const ana = page.getByRole('region', { name: 'Scoreboard for Ana' });

  await ana.getByRole('button', { name: 'red 2' }).click();
  await ana.getByRole('button', { name: 'red 3' }).click();

  const vibes = await page.evaluate(() => (window as unknown as { __vibes: number }).__vibes);
  expect(vibes).toBe(2);

  await request.delete('/api/current').catch(() => undefined);
});

test('US3: marking still works when the Vibration API is unavailable', async ({
  page,
  request,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: undefined });
  });

  await startTwoPlayerGame(page);
  const ana = page.getByRole('region', { name: 'Scoreboard for Ana' });
  await ana.getByRole('button', { name: 'red 2' }).click();
  // No error thrown; the mark applied normally.
  await expect(ana.getByLabel('Total 1')).toBeVisible();

  await request.delete('/api/current').catch(() => undefined);
});
