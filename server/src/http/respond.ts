export type ErrorCode = 'NOT_FOUND' | 'CONFLICT' | 'INVALID_PAYLOAD' | 'INTERNAL';

const STATUS: Record<ErrorCode, number> = {
  NOT_FOUND: 404,
  CONFLICT: 409,
  INVALID_PAYLOAD: 400,
  INTERNAL: 500,
};

const jsonHeaders = { 'content-type': 'application/json' } as const;

export function ok<T>(body: T): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: jsonHeaders });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function errorJson(code: ErrorCode, message: string): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status: STATUS[code],
    headers: jsonHeaders,
  });
}

export function notFound(message = 'Not found'): Response {
  return errorJson('NOT_FOUND', message);
}
