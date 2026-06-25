import type { GameState } from '@qwixx/shared';
import { errorJson, noContent, ok } from '../http/respond.ts';
import { registerRoute } from '../index.ts';
import { broadcastCurrent, subscribe } from '../realtime/hub.ts';
import { deleteCurrent, readCurrent, writeCurrent } from '../storage/currentRepo.ts';
import { validateGameState } from '../validation/gameState.ts';

async function handleGet(): Promise<Response> {
  const game = await readCurrent();
  return ok({ game });
}

async function handleStream(): Promise<Response> {
  const game = await readCurrent();
  return subscribe(game);
}

async function handlePut(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorJson('INVALID_PAYLOAD', 'invalid JSON body');
  }
  const incoming = (body as { game?: unknown })?.game;
  const errs = validateGameState(incoming);
  if (errs.length > 0) {
    return errorJson('INVALID_PAYLOAD', errs.map((e) => `${e.path}: ${e.message}`).join('; '));
  }
  const game = incoming as GameState;
  const existing = await readCurrent();
  if (existing && existing.id !== game.id) {
    return errorJson(
      'CONFLICT',
      'a different game is in progress; DELETE /api/current to abandon it first',
    );
  }
  if (game.status !== 'in-progress' && !existing) {
    return errorJson('INVALID_PAYLOAD', 'new current game must have status=in-progress');
  }
  await writeCurrent(game);
  broadcastCurrent(game);
  return ok({ game });
}

async function handleDelete(): Promise<Response> {
  await deleteCurrent();
  broadcastCurrent(null);
  return noContent();
}

export function registerCurrentRoutes(): void {
  registerRoute('GET', /^\/api\/current$/, () => handleGet());
  registerRoute('GET', /^\/api\/current\/stream$/, () => handleStream());
  registerRoute('PUT', /^\/api\/current$/, (req) => handlePut(req));
  registerRoute('DELETE', /^\/api\/current$/, () => handleDelete());
}
