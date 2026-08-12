import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ToastService } from './toast.service';
import { filter } from 'rxjs';

/**
 * Watches the service worker for a freshly-deployed version and prompts the
 * Hunter to reload — so an installed/offline PWA never gets stuck on stale code.
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private updates = inject(SwUpdate);
  private toast = inject(ToastService);

  init(): void {
    if (!this.updates.isEnabled) return;

    this.updates.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => {
        this.toast.action(
          '◈ A new version of THE SYSTEM is ready.',
          'RELOAD',
          () => document.location.reload(),
          0  // persist until dismissed or reloaded
        );
      });
  }
}
