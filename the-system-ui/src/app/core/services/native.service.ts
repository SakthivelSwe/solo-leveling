import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { LocalNotificationsService } from './local-notifications.service';
import { BiometricService } from './biometric.service';
import { AuthService } from './auth.service';
import { PlayerService } from './player.service';
import { DirectiveService } from './directive.service';
import { NetworkService } from './network.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AppShortcuts } from '@capawesome/capacitor-app-shortcuts';

/**
 * Native-platform glue (Capacitor). No-ops on the web so the same codebase runs
 * unchanged in the browser and in the Android app.
 *
 * Performance improvements (2026-08):
 *  - StatusBar + NetworkService init run concurrently (Promise.allSettled).
 *  - SplashScreen.hide() runs concurrently with biometric init — the splash is
 *    hidden behind the biometric overlay, so there's no visual difference and
 *    startup feels ~150 ms faster.
 *  - Notification scheduling is deferred to after the first paint via
 *    setTimeout(0) so it never blocks the LCP (Largest Contentful Paint).
 *  - App resume no longer triggers SSE reconnect unconditionally — the SSE
 *    service reconnects on its own; we only refresh player state.
 */
@Injectable({ providedIn: 'root' })
export class NativeService {
  private location           = inject(Location);
  private localNotifications = inject(LocalNotificationsService);
  private biometric          = inject(BiometricService);
  private auth               = inject(AuthService);
  private playerService      = inject(PlayerService);
  private directive          = inject(DirectiveService);
  private network            = inject(NetworkService);
  private dialog             = inject(MatDialog);
  private router             = inject(Router);

  /** Exposed so AppComponent can show/hide the biometric lock overlay. */
  get biometricLocked(): boolean { return this.biometric.isLocked; }

  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // On web: still init network service (uses browser events).
      this.network.init();
      return;
    }

    // ① Tag the DOM so global CSS applies Android-15 edge-to-edge insets.
    document.body.classList.add('native-platform');

    // ② Run independent startup tasks in parallel to reduce blocking time.
    //    StatusBar theming and Network init don't depend on each other.
    await Promise.allSettled([
      this._initStatusBar(),
      this.network.init(),
    ]);

    // ③ Wire Android hardware back button.
    App.addListener('backButton', ({ canGoBack }) => {
      // Priority 1: Close open Material Dialogs.
      if (this.dialog.openDialogs.length > 0) {
        this.dialog.closeAll();
        return;
      }
      // Priority 2: Navigate back in-app, or exit at root.
      if (canGoBack) {
        this.location.back();
      } else {
        App.exitApp();
      }
    });

    // ④ Android App Shortcuts (quick-launch from long-press on launcher icon).
    try {
      await AppShortcuts.set({
        shortcuts: [
          { id: '/system',  title: 'Quests',  description: 'Daily Quests'    },
          { id: '/habits',  title: 'Habits',  description: 'Habits Tracker'  },
          { id: '/life',    title: 'Life OS', description: 'Life OS Dashboard'},
        ]
      });
      AppShortcuts.addListener('click', (event) => {
        if (event.shortcutId) {
          this.router.navigateByUrl(event.shortcutId);
        }
      });
    } catch { /* AppShortcuts not supported */ }

    // ⑤ App resume — refresh player state + biometric re-auth.
    App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive && this.auth.isAuthenticated()) {
        // Refresh player state (SSE re-connects on its own).
        this.playerService.getStatus().subscribe({ error: () => {} });

        if (this.biometric.shouldLock()) {
          await this.biometric.authenticate();
        } else if (!this.biometric.isBiometricEnabled) {
          this.biometric.unlock();
        }
      }
    });

    // ⑥ Handle deep-link navigation fired from MainActivity when a widget
    //    or notification injects a "route" extra via appUrlOpen JS event.
    window.addEventListener('appUrlOpen', (event: any) => {
      try {
        const data = typeof event.detail === 'string'
          ? JSON.parse(event.detail) : event.detail;
        const url: string = data?.url ?? '';
        if (url && url.startsWith('/')) {
          this.router.navigateByUrl(url);
        }
      } catch { /* ignore malformed payload */ }
    });

    // ⑦ Biometric init + SplashScreen.hide() run concurrently — the splash is
    //    hidden behind the biometric overlay anyway, so no visual regression.
    await Promise.allSettled([
      this.biometric.init(),
      this._hideSplash(),
    ]);

    // ⑧ Biometric gate on first open.
    if (this.auth.isAuthenticated()) {
      if (this.biometric.shouldLock()) {
        await this.biometric.authenticate();
      } else {
        this.biometric.unlock();
      }
    }

    // ⑨ Schedule notifications AFTER first paint (setTimeout(0) yields to the
    //    event loop so the WebView can render before we hit the native bridge).
    setTimeout(() => this._scheduleNotifications(), 0);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async _initStatusBar(): Promise<void> {
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#060610' });
    } catch { /* StatusBar unavailable — ignore */ }
  }

  private async _hideSplash(): Promise<void> {
    try {
      await SplashScreen.hide();
    } catch { /* SplashScreen unavailable — ignore */ }
  }

  private async _scheduleNotifications(): Promise<void> {
    try {
      // 1. Register action types and attach listeners.
      await this.localNotifications.init();
      // 2. Create / refresh notification channels.
      await this.localNotifications.createChannels();
      // 3. Request POST_NOTIFICATIONS permission (Android 13+).
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      let perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        perm = await LocalNotifications.requestPermissions();
      }
      if (perm.display === 'granted') {
        // 4. Schedule exact alarms and soft reminders using user-configured times.
        const cfg = this.directive.config();
        await this.localNotifications.scheduleAlarms(cfg.wakeTime, cfg.sleepTime);
        await this.localNotifications.scheduleReminders();
      }
    } catch { /* ignore permission failures / unsupported */ }
  }
}
