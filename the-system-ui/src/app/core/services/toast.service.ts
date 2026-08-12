import { Injectable, signal } from '@angular/core';

export type ToastType = 'info' | 'success' | 'warn' | 'action';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  /** Label for the action button (optional) */
  actionLabel?: string;
  /** Callback when action button is clicked */
  onAction?: () => void;
  /** Auto-dismiss duration in ms. 0 = persist until manually closed */
  duration: number;
}

let _id = 0;

/**
 * ToastService — 100% custom, zero Angular Material / CDK dependency.
 *
 * Toasts are rendered by <app-toast> in the app root template via a fixed
 * CSS overlay (top-right), so positioning is entirely in our hands.
 *
 * Usage:
 *   toastSvc.show('Quest completed!');
 *   toastSvc.warn('Something failed.');
 *   toastSvc.success('XP gained!');
 *   toastSvc.action('New version ready', 'RELOAD', () => location.reload());
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /** Reactive list of active toasts — consumed by AppToastComponent */
  readonly toasts = signal<Toast[]>([]);

  /** Info / neutral toast */
  show(message: string, duration = 2800): void {
    this._push({ message, type: 'info', duration });
  }

  /** Error / warning toast */
  warn(message: string, duration = 3200): void {
    this._push({ message, type: 'warn', duration });
  }

  /** Success / green toast */
  success(message: string, duration = 2800): void {
    this._push({ message, type: 'success', duration });
  }

  /**
   * Toast with an action button (e.g. RELOAD, ALLOW).
   * duration = 0 keeps it open until the user acts or dismisses.
   */
  action(message: string, actionLabel: string, onAction: () => void, duration = 0): void {
    this._push({ message, type: 'action', actionLabel, onAction, duration });
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private _push(partial: Omit<Toast, 'id'>): void {
    const toast: Toast = { id: ++_id, ...partial };
    this.toasts.update(list => [toast, ...list].slice(0, 5)); // max 5 stacked

    if (toast.duration > 0) {
      setTimeout(() => this.dismiss(toast.id), toast.duration);
    }
  }
}
