import { notFound, ok } from '../http/respond.ts';
import { registerRoute } from '../index.ts';
import { findHistoryGame, readHistory } from '../storage/historyRepo.ts';

async function handleList(): Promise<Response> {
  const history = await readHistory();
  return ok({ games: history.games });
}

async function handleDetail(_req: Request, params: Record<string, string>): Promise<Response> {
  const id = params.id ?? '';
  const game = await findHistoryGame(id);
  if (!game) return notFound(`no history game with id ${id}`);
  return ok({ game });
}

export function registerHistoryRoutes(): void {
  registerRoute('GET', /^\/api\/history$/, () => handleList());
  registerRoute('GET', /^\/api\/history\/(?<id>[^/]+)$/, (req, params) =>
    handleDetail(req, params),
  );
}
