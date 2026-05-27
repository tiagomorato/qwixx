import { errorJson } from './http/respond.ts';

const PORT = Number(process.env.PORT ?? 8787);

const routeTable: Array<{
  method: string;
  pattern: RegExp;
  handler: (req: Request, params: Record<string, string>) => Promise<Response>;
}> = [];

export function registerRoute(
  method: string,
  pattern: RegExp,
  handler: (req: Request, params: Record<string, string>) => Promise<Response>,
): void {
  routeTable.push({ method, pattern, handler });
}

export async function dispatch(req: Request): Promise<Response> {
  const url = new URL(req.url);
  for (const route of routeTable) {
    if (route.method !== req.method) continue;
    const match = route.pattern.exec(url.pathname);
    if (!match) continue;
    const params = match.groups ?? {};
    try {
      return await route.handler(req, params);
    } catch (err) {
      console.error('[server] handler error', err);
      return errorJson('INTERNAL', (err as Error).message);
    }
  }
  return errorJson('NOT_FOUND', `No route for ${req.method} ${url.pathname}`);
}

if (import.meta.main) {
  await import('./routes/register.ts');
  Bun.serve({ port: PORT, fetch: dispatch });
  console.log(`[server] listening on http://localhost:${PORT}`);
}
