export type ApiError = {
  code: 'NOT_FOUND' | 'CONFLICT' | 'INVALID_PAYLOAD' | 'INTERNAL';
  message: string;
};

export class ApiCallError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiError['code'],
    message: string,
  ) {
    super(message);
    this.name = 'ApiCallError';
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const { timeoutMs = 5_000, headers, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path, {
      ...rest,
      signal: controller.signal,
      headers: { 'content-type': 'application/json', ...headers },
    });
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    const body = text.length > 0 ? (JSON.parse(text) as unknown) : null;
    if (!res.ok) {
      const err = (body as { error?: ApiError } | null)?.error;
      throw new ApiCallError(res.status, err?.code ?? 'INTERNAL', err?.message ?? res.statusText);
    }
    return body as T;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  request,
};
