import { resolve, sep } from 'node:path';

/**
 * Serve the built client (SPA) from `rootDir`. Unknown paths fall back to
 * index.html so client-side routing works on hard refresh. Requests are
 * confined to `rootDir` to prevent path traversal.
 */
export async function serveStatic(req: Request, rootDir: string): Promise<Response> {
  const url = new URL(req.url);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/' || pathname === '') pathname = '/index.html';

  const filePath = resolve(rootDir, `.${pathname}`);
  if (filePath !== rootDir && !filePath.startsWith(rootDir + sep)) {
    return new Response('Forbidden', { status: 403 });
  }

  const file = Bun.file(filePath);
  if (await file.exists()) {
    return new Response(file);
  }

  const index = Bun.file(resolve(rootDir, 'index.html'));
  if (await index.exists()) {
    return new Response(index);
  }
  return new Response('Not found', { status: 404 });
}
