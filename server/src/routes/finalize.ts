import { finalize as finalizeGame, gameShouldEnd } from '@qwixx/shared';
import { errorJson, ok } from '../http/respond.ts';
import { registerRoute } from '../index.ts';
import { deleteCurrent, readCurrent } from '../storage/currentRepo.ts';
import { appendCompleted } from '../storage/historyRepo.ts';

async function handleFinalize(): Promise<Response> {
  const current = await readCurrent();
  if (!current) {
    return errorJson('CONFLICT', 'no in-progress game');
  }
  if (!gameShouldEnd(current)) {
    return errorJson('CONFLICT', 'game has not reached an end condition');
  }
  const finalized = finalizeGame(current);
  await appendCompleted(finalized);
  await deleteCurrent();
  return ok({ game: finalized });
}

export function registerFinalizeRoutes(): void {
  registerRoute('POST', /^\/api\/current\/finalize$/, () => handleFinalize());
}
