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

/**
 * Native-platform glue (Capacitor). No-ops on the web so the same codebase runs
 * unchanged in the browser and in the Android app:
 *  - themes the status bar to match THE SYSTEM's dark palette
 *  - wires the Android hardware back button to in-app navigation
 *  - dismisses the splash screen once the app is ready
 *  - schedules local reminders (fire even when the app is closed)
 *  - refreshes player state when the app resumes from background
 *  - enforces biometric lock on resume (if biometrics available)
 */
@Injectable({ providedIn: 'root' })
export class NativeService {
  private location         = inject(Location);
  private localNotifications = inject(LocalNotificationsService);
  private biometric        = inject(BiometricService);
  private auth             = inject(AuthService);
  private playerService    = inject(PlayerService);

  /** Exposed so AppComponent can show/hide the biometric lock overlay. */
  get biometricLocked(): boolean { return this.biometric.isLocked; }

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

    // App resume — two things happen:
    // 1. Sync fresh player state (SSE re-connects on its own)
    // 2. Check if biometric re-auth is needed (outside 5-min grace period)
    App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive && this.auth.isAuthenticated()) {
        this.playerService.getStatus().subscribe({ error: () => {} });

        if (this.biometric.shouldLock()) {
          // Biometric is enabled and grace period expired → prompt.
          await this.biometric.authenticate();
        } else if (!this.biometric.isBiometricEnabled) {
          // Biometric is disabled → make sure overlay is never shown.
          this.biometric.unlock();
        }
      }
    });

    // Initialize biometrics (check device capability).
    await this.biometric.init();

    // Hide Splash Screen early so the UI is visible before the native biometric dialog overlays it
    try {
      await SplashScreen.hide();
    } catch {
      /* SplashScreen unavailable — ignore */
    }

    // Lock on first open if biometrics are available, user enabled it, and user is logged in.
    // If biometrics are disabled → ensure unlocked so user goes straight to the app.
    if (this.auth.isAuthenticated()) {
      if (this.biometric.shouldLock()) {
        await this.biometric.authenticate();
      } else {
        this.biometric.unlock();
      }
    }

    // 1. Initialize action types and listeners
    await this.localNotifications.init();
    
    // 2. Create notification channels
    await this.localNotifications.createChannels();

    // 3. Request POST_NOTIFICATIONS permissions (Android 13+)
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    try {
      let perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        perm = await LocalNotifications.requestPermissions();
      }
      
      if (perm.display === 'granted') {
        // 4. Schedule exact alarms and soft reminders
        await this.localNotifications.scheduleAlarms();
        await this.localNotifications.scheduleReminders();
      }
    } catch {
      /* ignore if permissions check fails or unsupported */
    }
  }
}
