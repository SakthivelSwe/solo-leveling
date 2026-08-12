import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../core/services/toast.service';

/**
 * AppToastComponent — renders the app-wide toast stack.
 *
 * Positioned via CSS: fixed, top-right, above everything (z-index 99999).
 * Uses zero Angular Material / CDK — entirely our own DOM + CSS.
 * Add <app-toast></app-toast> to app.component.html once.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="false">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast-item toast-{{ t.type }}" role="alert">
          <span class="toast-msg">{{ t.message }}</span>
          <div class="toast-actions">
            @if (t.actionLabel && t.onAction) {
              <button class="toast-action-btn" (click)="act(t)">{{ t.actionLabel }}</button>
            }
            <button class="toast-dismiss" (click)="toast.dismiss(t.id)" aria-label="Dismiss">✕</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: min(420px, calc(100vw - 32px));
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 11px 14px;
      border-radius: 10px;
      border-left: 3px solid;
      font-family: 'Rajdhani', 'Segoe UI', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      line-height: 1.4;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 4px 24px rgba(0,0,0,0.55);
      animation: toastSlideIn 0.22s cubic-bezier(0.16,1,0.36,1) both;
      word-break: break-word;
    }

    /* INFO — purple */
    .toast-info {
      background: rgba(12, 12, 26, 0.96);
      border-color: rgba(108,99,255,0.8);
      color: #d0d0f0;
    }

    /* SUCCESS — green */
    .toast-success {
      background: rgba(6, 20, 14, 0.96);
      border-color: rgba(31,190,142,0.8);
      color: #a0f0cc;
    }

    /* WARN — red */
    .toast-warn {
      background: rgba(20, 6, 6, 0.96);
      border-color: rgba(226,75,74,0.8);
      color: #f0a0a0;
    }

    /* ACTION — gold */
    .toast-action {
      background: rgba(20, 16, 6, 0.96);
      border-color: rgba(250,199,117,0.8);
      color: #fce4a0;
    }

    .toast-msg {
      flex: 1;
      min-width: 0;
    }

    .toast-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .toast-action-btn {
      background: rgba(250,199,117,0.18);
      border: 1px solid rgba(250,199,117,0.5);
      color: #FAC775;
      border-radius: 5px;
      padding: 3px 9px;
      font-family: inherit;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 1px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .toast-action-btn:hover { background: rgba(250,199,117,0.32); }

    .toast-dismiss {
      background: none;
      border: none;
      color: rgba(255,255,255,0.35);
      font-size: 0.75rem;
      cursor: pointer;
      padding: 2px 4px;
      line-height: 1;
      border-radius: 3px;
      transition: color 0.15s;
    }
    .toast-dismiss:hover { color: rgba(255,255,255,0.75); }

    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateX(32px) scale(0.96); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }

    /* On native Android — no backdrop-filter to avoid GPU heat */
    :host-context(body.native-platform) .toast-item {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
  `]
})
export class AppToastComponent {
  toast = inject(ToastService);

  act(t: Toast): void {
    t.onAction?.();
    this.toast.dismiss(t.id);
  }
}
