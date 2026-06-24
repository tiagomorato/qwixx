/**
 * Formats the elapsed time between two ISO timestamps as `MM:SS`.
 * Returns `null` when `endedAt` is missing or either timestamp is unparseable,
 * or when the end precedes the start, leaving fallback wording to the caller.
 * Pass the current time as `endedAt` to render a live, running clock.
 */
export function formatElapsed(
  startedAt: string,
  endedAt: string | null | undefined,
): string | null {
  if (!endedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  const totalSeconds = Math.floor((end - start) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad(minutes)}:${pad(seconds)}`;
}
