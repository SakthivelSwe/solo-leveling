import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter } from 'rxjs';

/**
 * Watches the service worker for a freshly-deployed version and prompts the
 * Hunter to reload — so an installed/offline PWA never gets stuck on stale code.
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private updates = inject(SwUpdate);
  private snack = inject(MatSnackBar);

  init(): void {
    if (!this.updates.isEnabled) return;

    this.updates.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => {
        const ref = this.snack.open(
          '◈ A new version of THE SYSTEM is ready.',
          'RELOAD',
          {
            duration: 0,
            panelClass: 'system-snack',
            horizontalPosition: 'center',
            verticalPosition: 'top',
          },
        );
        ref.onAction().subscribe(() => document.location.reload());
      });
  }
}

