import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { LocalNotificationsService } from './local-notifications.service';
import { AuthService } from './auth.service';
import { PlayerService } from './player.service';

/**
 * Native-platform glue (Capacitor). No-ops on the web so the same codebase runs
 * unchanged in the browser and in the Android app:
 *  - themes the status bar to match THE SYSTEM's dark palette
 *  - wires the Android hardware back button to in-app navigation
 *  - dismisses the splash screen once the app is ready
 *  - schedules local reminders (fire even when the app is closed)
 *  - refreshes player state when the app resumes from background
 */
@Injectable({ providedIn: 'root' })
export class NativeService {
  private location = inject(Location);
  private localNotifications = inject(LocalNotificationsService);
  private auth = inject(AuthService);
  private playerService = inject(PlayerService);

  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    // Flags the DOM as native so global CSS can apply Android-15 edge-to-edge
    // safe-area insets (status bar / gesture navigation bar).
    document.body.classList.add('native-platform');

    try {
      await StatusBar.setStyle({ style: Style.Dark });        // light icons on dark bg
      await StatusBar.setBackgroundColor({ color: '#060610' });
    } catch {
      /* StatusBar unavailable — ignore */
    }

    // Android hardware back button → go back in-app, or exit at the root.
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        this.location.back();
      } else {
        App.exitApp();
      }
    });

    // App resume — sync fresh player state (SSE re-connects on its own, but
    // the WebView may have been paused while backgrounded).
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && this.auth.isAuthenticated()) {
        this.playerService.getStatus().subscribe({ error: () => {} });
      }
    });

    // Schedule the 5 System reminders on device (fire while app is closed).
    // Requests POST_NOTIFICATIONS permission on Android 13+.
    this.localNotifications.init();

    try {
      await SplashScreen.hide();
    } catch {
      /* SplashScreen unavailable — ignore */
    }
  }
}

