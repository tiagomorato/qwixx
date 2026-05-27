import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { dispatch, setupDataDir } from '../helpers/testServer.ts';

let env: ReturnType<typeof setupDataDir>;
beforeEach(() => {
  env = setupDataDir();
});
afterEach(() => env.cleanup());

describe('GET /api/current', () => {
  it('returns { game: null } when no game has been written', async () => {
    const res = await dispatch(new Request('http://x/api/current'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ game: null });
  });
});
