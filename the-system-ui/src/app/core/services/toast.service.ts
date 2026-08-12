import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';

/**
 * ToastService — single source of truth for ALL toast/snackbar notifications.
 *
 * WHY: Angular CDK's GlobalPositionStrategy applies inline styles to the overlay
 * wrapper. When callers pass no position config, the default is bottom-center.
 * The MAT_SNACK_BAR_DEFAULT_OPTIONS token should fix this, but callers passing
 * their own partial config override only what they pass, resetting everything else
 * to CDK defaults (= bottom). This service ALWAYS forces top-right, regardless of
 * what the caller passes.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private snack = inject(MatSnackBar);

  /** Standard info/success toast (purple glow, top-right) */
  show(message: string, action = '✕', config: Partial<MatSnackBarConfig> = {}): void {
    this.snack.open(message, action, {
      duration: 2800,
      panelClass: 'system-snack',
      ...config,
      // These two MUST always be last — never let callers override position
      verticalPosition: 'top',
      horizontalPosition: 'right',
    });
  }

  /** Warning/error toast (red glow, top-right) */
  warn(message: string, action = '✕', config: Partial<MatSnackBarConfig> = {}): void {
    this.snack.open(message, action, {
      duration: 3200,
      panelClass: 'snack-danger',
      ...config,
      verticalPosition: 'top',
      horizontalPosition: 'right',
    });
  }

  /** Success confirmation toast (green glow, top-right) */
  success(message: string, action = '✕', config: Partial<MatSnackBarConfig> = {}): void {
    this.snack.open(message, action, {
      duration: 2800,
      panelClass: 'snack-success',
      ...config,
      verticalPosition: 'top',
      horizontalPosition: 'right',
    });
  }

  /**
   * Open a snackbar and return the ref — use when you need .onAction().subscribe().
   * Positions are still forced top-right.
   */
  openWithAction(message: string, action: string, config: Partial<MatSnackBarConfig> = {}): MatSnackBarRef<TextOnlySnackBar> {
    return this.snack.open(message, action, {
      duration: 8000,
      panelClass: 'system-snack',
      ...config,
      verticalPosition: 'top',
      horizontalPosition: 'right',
    });
  }
}
