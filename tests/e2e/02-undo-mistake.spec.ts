import AxeBuilder from '@axe-core/playwright';
import { type Page, expect, test } from '@playwright/test';

async function startTwoPlayerGame(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page.getByLabel('Player 1').fill('Ana');
  await page.getByLabel('Player 2').fill('Beto');
  await page.getByRole('button', { name: 'Start new game' }).click();
  await expect(page.getByRole('heading', { name: 'Qwixx — game in progress' })).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  await request.delete('/api/current').catch(() => undefined);
});

test('US2: undo most recent mark', async ({ page, request }) => {
  await startTwoPlayerGame(page);
  const ana = page.getByRole('region', { name: 'Scoreboard for Ana' });
  await ana.getByRole('button', { name: 'red 2' }).click();
  await ana.getByRole('button', { name: 'red 3' }).click();
  await expect(ana.getByLabel('Total 3')).toBeVisible();

  await page.getByRole('button', { name: 'Undo last action' }).click();
  await expect(ana.getByLabel('Total 1')).toBeVisible();
  await expect(ana.getByRole('button', { name: 'red 2 marked' })).toBeVisible();
  await expect(ana.getByRole('button', { name: 'red 3', exact: true })).toBeVisible();

  await request.delete('/api/current').catch(() => undefined);
});

test('US2: undo a penalty', async ({ page, request }) => {
  await startTwoPlayerGame(page);
  const ana = page.getByRole('region', { name: 'Scoreboard for Ana' });
  await ana.getByRole('button', { name: 'Take Penalty' }).click();
  await expect(ana.getByLabel('Total -5')).toBeVisible();
  await page.getByRole('button', { name: 'Undo last action' }).click();
  await expect(ana.getByLabel('Total 0')).toBeVisible();

  await request.delete('/api/current').catch(() => undefined);
});

test('US2: undo button disabled when action log empty + axe-core a11y check', async ({
  page,
  request,
}) => {
  await startTwoPlayerGame(page);
  const undoBtn = page.getByRole('button', { name: 'Undo last action' });
  await expect(undoBtn).toBeDisabled();

  const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
  expect(results.violations).toEqual([]);

  await request.delete('/api/current').catch(() => undefined);
});
