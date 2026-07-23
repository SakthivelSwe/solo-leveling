import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { SseService } from './core/services/sse.service';
import { PwaUpdateService } from './core/services/pwa-update.service';
import { NativeService } from './core/services/native.service';
import { BiometricService } from './core/services/biometric.service';
import { BiometricLockComponent } from './features/auth/biometric-lock.component';
import { LevelUpModalComponent } from './shared/components/level-up-modal.component';
import { EveningReviewComponent } from './shared/components/evening-review.component';
import { PenaltyZoneComponent } from './shared/components/penalty-zone.component';
import { UiStateService } from './core/services/ui-state.service';
import { AuthService } from './core/services/auth.service';
import { routeFade } from './shared/animations';

/** Routes where the bottom nav should NOT be shown (auth screens). */
const AUTH_ROUTES = new Set(['/login', '/register', '/']);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BiometricLockComponent, LevelUpModalComponent, EveningReviewComponent, PenaltyZoneComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [routeFade],
})
export class AppComponent {
  title = 'the-system-ui';

  private biometric = inject(BiometricService);
  private router    = inject(Router);
  public uiState    = inject(UiStateService);
  public auth       = inject(AuthService);

  /** Reactive signal: true when the biometric lock overlay should be shown. */
  isLocked = computed(() => this.biometric.lockedSignal());

  /** Show bottom nav on all authenticated routes; hide on login/register pages. */
  showBottomNav = computed(() => {
    const nav = this.navEnd();
    // On first load before any navigation event, fall back to router.url
    const url = (nav?.urlAfterRedirects ?? this.router.url).split('?')[0];
    return !AUTH_ROUTES.has(url);
  });

  private navEnd = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    ),
  );

  // Injecting the SSE service boots the real-time link (auto-connects when authenticated).
  constructor(
    private sse: SseService,
    private pwaUpdate: PwaUpdateService,
    private native: NativeService,
  ) {
    this.pwaUpdate.init();
    // Native glue (status bar, hardware back button, splash hide, biometric init). No-ops on web.
    this.native.init();
    this.maybePromptEveningReview();
  }

  /**
   * Auto-opens the Evening Review after 9 PM, once per day, for a logged-in
   * Hunter. Dismissing or saving marks it done for the day (see UiStateService).
   */
  private maybePromptEveningReview(): void {
    if (!this.auth.isAuthenticated()) return;
    const hour = new Date().getHours();
    const todayKey = new Date().toISOString().slice(0, 10);
    const lastDone = localStorage.getItem('sys_evening_review_date');
    if (hour >= 21 && lastDone !== todayKey) {
      // Small delay so it appears after the first paint, not mid-boot.
      setTimeout(() => this.uiState.openEveningReview(), 1400);
    }
  }

  /** Drives the @routeFade page-transition animation on navigation. */
  routeState(outlet: RouterOutlet): string {
    return outlet && outlet.isActivated
      ? outlet.activatedRoute.snapshot.routeConfig?.path ?? ''
      : '';
  }
}
