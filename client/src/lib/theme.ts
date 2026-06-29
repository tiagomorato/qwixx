/**
 * Per-device theme preference. Stored in `localStorage` and applied via the
 * `data-theme` attribute on the document root. Deliberately NOT part of
 * `GameState` — appearance is a personal device choice and must never sync to
 * other players.
 */
export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'qwixx-theme';

function isThemePreference(v: unknown): v is ThemePreference {
  return v === 'light' || v === 'dark' || v === 'system';
}

/** Read the saved preference, defaulting to `'system'`. */
export function loadTheme(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (isThemePreference(raw)) return raw;
  } catch {
    /* storage unavailable */
  }
  return 'system';
}

/**
 * Apply a preference to the document. `'system'` removes the explicit override
 * so the `@media (prefers-color-scheme)` defaults take over.
 */
export function applyTheme(pref: ThemePreference): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (pref === 'system') {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = pref;
  }
}

/** Persist a preference (best-effort). */
export function persistTheme(pref: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* storage unavailable */
  }
}

/** Persist and immediately apply a preference. */
export function setTheme(pref: ThemePreference): void {
  persistTheme(pref);
  applyTheme(pref);
}

/** Load and apply the saved preference; returns it. Call before first paint. */
export function initTheme(): ThemePreference {
  const pref = loadTheme();
  applyTheme(pref);
  return pref;
}
