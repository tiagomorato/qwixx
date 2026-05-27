import type { Color } from '@qwixx/shared';

export const COLOR_TOKENS: Record<Color, { bg: string; fg: string; border: string }> = {
  red: { bg: '#fde2e2', fg: '#8a1414', border: '#c23232' },
  yellow: { bg: '#fdf4c8', fg: '#7a5a07', border: '#c8a420' },
  green: { bg: '#d8f1d0', fg: '#16511f', border: '#3b8d3f' },
  blue: { bg: '#d6e4f6', fg: '#16345c', border: '#2e6cc2' },
};

export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
} as const;

export const RADII = {
  sm: '4px',
  md: '8px',
  lg: '12px',
} as const;

export const TYPOGRAPHY = {
  family: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  monospace: "ui-monospace, 'SF Mono', Consolas, monospace",
  size: {
    sm: '0.875rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
    xxl: '2rem',
  },
} as const;

// Non-color cues (FR-014) — every interactive state has a non-color signal.
export const STATE_CUES = {
  available: { weight: 400, decoration: 'none' },
  marked: { weight: 700, decoration: 'line-through', symbol: '✕' },
  disabled: { weight: 400, decoration: 'none', opacity: 0.35 },
  justChanged: { weight: 700, ring: true },
  locked: { symbol: '🔒' },
} as const;
