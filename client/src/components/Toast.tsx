import { useEffect } from 'react';
import styles from './Toast.module.css';

export type ToastProps = {
  /** The message to show. When `null`, nothing renders. */
  message: string | null;
  /** Called when the toast auto-dismisses. */
  onDismiss: () => void;
  /** How long the toast stays visible before auto-dismissing. */
  durationMs?: number;
};

/**
 * Transient status notice. Announces itself to assistive tech via
 * `role="status"` / `aria-live="polite"` and auto-dismisses after `durationMs`.
 * Consumed by the undo notice (US5) and the share confirmation (US6).
 */
export function Toast({ message, onDismiss, durationMs = 4000 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(id);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  // <output> carries an implicit role="status" / polite live region.
  return (
    <output className={styles.toast} aria-live="polite">
      {message}
    </output>
  );
}
