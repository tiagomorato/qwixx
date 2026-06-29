import { useState } from 'react';
import { type ThemePreference, loadTheme, setTheme } from '../lib/theme.ts';
import styles from './ThemeToggle.module.css';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/**
 * Light / dark / system theme selector. Applies the choice immediately and
 * persists it per-device (see `lib/theme.ts`). The preference never enters
 * `GameState`, so it does not cross to other synced devices.
 */
export function ThemeToggle() {
  const [pref, setPref] = useState<ThemePreference>(() => loadTheme());

  function choose(next: ThemePreference): void {
    setTheme(next);
    setPref(next);
  }

  return (
    <div className={styles.toggle} role="radiogroup" aria-label="Theme">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={styles.option}
          aria-pressed={pref === opt.value}
          onClick={() => choose(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
