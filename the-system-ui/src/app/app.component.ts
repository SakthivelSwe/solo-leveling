import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SseService } from './core/services/sse.service';
import { PwaUpdateService } from './core/services/pwa-update.service';
import { NativeService } from './core/services/native.service';
import { BiometricService } from './core/services/biometric.service';
import { BiometricLockComponent } from './features/auth/biometric-lock.component';
import { routeFade } from './shared/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BiometricLockComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [routeFade],
})
export class AppComponent {
  title = 'the-system-ui';

  private biometric = inject(BiometricService);

  /** Reactive signal: true when the biometric lock overlay should be shown. */
  isLocked = computed(() => this.biometric.isLocked);

  // Injecting the SSE service boots the real-time link (auto-connects when authenticated).
  constructor(
    private sse: SseService,
    private pwaUpdate: PwaUpdateService,
    private native: NativeService,
  ) {
    this.pwaUpdate.init();
    // Native glue (status bar, hardware back button, splash hide, biometric init). No-ops on web.
    this.native.init();
  }

  /** Drives the @routeFade page-transition animation on navigation. */
  routeState(outlet: RouterOutlet): string {
    return outlet && outlet.isActivated
      ? outlet.activatedRoute.snapshot.routeConfig?.path ?? ''
      : '';
  }
}
