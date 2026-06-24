import { describe, expect, it } from 'bun:test';
import { formatElapsed } from '../../src/format/duration.ts';

describe('formatElapsed', () => {
  const start = '2026-06-24T10:00:00.000Z';

  it('returns null when endedAt is missing', () => {
    expect(formatElapsed(start, null)).toBeNull();
    expect(formatElapsed(start, undefined)).toBeNull();
  });

  it('formats elapsed time as MM:SS', () => {
    expect(formatElapsed(start, '2026-06-24T10:00:05.000Z')).toBe('00:05');
    expect(formatElapsed(start, '2026-06-24T10:01:30.000Z')).toBe('01:30');
    expect(formatElapsed(start, '2026-06-24T11:05:09.000Z')).toBe('65:09');
  });

  it('floors sub-second remainders', () => {
    expect(formatElapsed(start, '2026-06-24T10:00:05.900Z')).toBe('00:05');
  });

  it('returns null when the end precedes the start', () => {
    expect(formatElapsed(start, '2026-06-24T09:59:59.000Z')).toBeNull();
  });

  it('returns null for unparseable timestamps', () => {
    expect(formatElapsed('not-a-date', start)).toBeNull();
    expect(formatElapsed(start, 'not-a-date')).toBeNull();
  });
});
