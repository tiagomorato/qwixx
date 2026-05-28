import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const HISTORY_FIXTURE = {
  version: 1,
  games: [
    {
      id: 'fixture-game-1',
      status: 'completed',
      startedAt: '2026-05-26T12:00:00.000Z',
      endedAt: '2026-05-26T13:00:00.000Z',
      players: [
        {
          id: 'p1',
          name: 'Ada',
          position: 1,
          penalties: 0,
          rows: makeRows('asc', [
            true,
            true,
            true,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
          ]),
        },
        {
          id: 'p2',
          name: 'Boris',
          position: 2,
          penalties: 1,
          rows: makeRows('mixed', null),
        },
      ],
      globalLocks: { red: false, yellow: false, green: false, blue: false },
      actionLog: [],
    },
  ],
};

function makeRows(_kind: string, marks: boolean[] | null) {
  const ascending = (color: 'red' | 'yellow' | 'green' | 'blue') =>
    color === 'red' || color === 'yellow';
  return (['red', 'yellow', 'green', 'blue'] as const).map((color) => ({
    color,
    locked: false,
    cells: Array.from({ length: 11 }, (_, i) => ({
      value: ascending(color) ? i + 2 : 12 - i,
      marked: marks ? (marks[i] ?? false) : false,
    })),
  }));
}

test.beforeEach(async ({ request }) => {
  await request.delete('/api/current').catch(() => undefined);
  await request.delete('/api/history').catch(() => undefined);
});

test('US3: history list lists completed games and detail view shows scoreboards', async ({
  page,
  request,
}) => {
  // Seed history via the storage layer by completing a real game through the API:
  // create + force-finalizable + finalize. Simpler: just submit a game in the
  // "completable" state then call finalize.
  const playable = {
    ...HISTORY_FIXTURE.games[0],
    status: 'in-progress',
    endedAt: null,
    globalLocks: { red: true, yellow: true, green: false, blue: false },
  };
  await request.put('/api/current', { data: { game: playable } });
  await request.post('/api/current/finalize');

  await page.goto('/');
  await page.getByRole('button', { name: 'View history' }).click();
  await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();
  await expect(page.getByText('Ada vs Boris').first()).toBeVisible();

  const a11y = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
  expect(a11y.violations).toEqual([]);

  // Drill into the detail
  await page
    .getByRole('button', { name: /Ada vs Boris/ })
    .first()
    .click();
  await expect(page.getByRole('region', { name: 'Scoreboard for Ada' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Scoreboard for Boris' })).toBeVisible();

  // Detail view's scoreboards should not allow new marks (cells should be unmarkable).
  const adaBoard = page.getByRole('region', { name: 'Scoreboard for Ada' });
  // Already-marked cells stay marked; unmarked cells are disabled (since the
  // game is completed, isCellMarkable returns false for all cells).
  await expect(adaBoard.getByRole('button', { name: 'red 2 marked' })).toBeVisible();
});
