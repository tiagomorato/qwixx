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
  const { serveStatic } = await import('./http/static.ts');
  const { CLIENT_DIST } = await import('./paths.ts');
  // idleTimeout is raised to Bun's max so long-lived SSE connections
  // (GET /api/current/stream) aren't closed; heartbeats keep them warm.
  Bun.serve({
    port: PORT,
    idleTimeout: 255,
    fetch(req) {
      const { pathname } = new URL(req.url);
      // API routes go to the router; everything else is the built SPA.
      if (pathname === '/api' || pathname.startsWith('/api/')) return dispatch(req);
      return serveStatic(req, CLIENT_DIST);
    },
  });
  console.log(`[server] listening on http://localhost:${PORT}`);
}
