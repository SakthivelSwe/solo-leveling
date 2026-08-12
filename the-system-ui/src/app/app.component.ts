import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { SseService } from './core/services/sse.service';
import { PwaUpdateService } from './core/services/pwa-update.service';
import { NativeService } from './core/services/native.service';
import { NetworkService } from './core/services/network.service';
import { BiometricService } from './core/services/biometric.service';
import { BiometricLockComponent } from './features/auth/biometric-lock.component';
import { LevelUpModalComponent } from './shared/components/level-up-modal.component';
import { EveningReviewComponent } from './shared/components/evening-review.component';
import { XpParticlesComponent } from './shared/components/xp-particles.component';
import { SystemBroadcastComponent } from './shared/components/system-broadcast/system-broadcast.component';

import { AppToastComponent } from './shared/components/app-toast.component';
import { UiStateService } from './core/services/ui-state.service';
import { AuthService } from './core/services/auth.service';
import { LifeOsService } from './core/services/life-os.service';
import { PlayerService } from './core/services/player.service';

import { MatDialog } from '@angular/material/dialog';
import { routeFade } from './shared/animations';

/** Routes where the bottom nav should NOT be shown (auth screens). */
const AUTH_ROUTES = new Set(['/login', '/register', '/']);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LevelUpModalComponent,
    EveningReviewComponent,
    BiometricLockComponent,
    XpParticlesComponent,
    SystemBroadcastComponent,
    AppToastComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'the-system-ui';

  private biometric = inject(BiometricService);
  private router    = inject(Router);
  public uiState    = inject(UiStateService);
  public auth       = inject(AuthService);

  private dialog    = inject(MatDialog);

  /** Expose network service to template for offline indicator */
  public network    = inject(NetworkService);

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

  constructor(
    private sse: SseService,
    private pwaUpdate: PwaUpdateService,
    private native: NativeService,
    private lifeOs: LifeOsService,
    private playerService: PlayerService,
  ) {
    this.pwaUpdate.init();
    // Native glue (status bar, hardware back button, splash hide, biometric init). No-ops on web.
    this.native.init();

    this.maybePromptEveningReview();

    // Badge polling: defer until AFTER biometric resolves and app is stable.
    // On locked startup the user hasn't authenticated yet, so network calls would
    // fail or return stale data. Using a 3-second delay covers the biometric grace
    // period and ensures the SSE connection is already established.
    setTimeout(() => this.initBadgePolling(), 3000);
  }

  private initBadgePolling(): void {
    const poll = () => {
      // Guard: don't poll when the user is not authenticated or app is offline.
      if (!this.auth.isAuthenticated()) return;
      if (this.network.isOffline()) return;

      this.lifeOs.getDueFlashcards().subscribe(cards =>
        this.uiState.dueFlashcardsCount.set(cards.length));
      this.playerService.getTodayQuests().subscribe(quests =>
        this.uiState.dueQuestsCount.set(quests.filter(q => !q.isCompleted).length));
    };

    // Initial fetch.
    poll();
    // Refresh every 2 minutes.
    setInterval(poll, 120_000);
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
