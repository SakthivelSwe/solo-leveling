import { Injectable, OnDestroy, inject, signal, computed } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * NetworkService — reactive Android-native connectivity detection.
 *
 * On Android (Capacitor), uses the @capacitor/network plugin which listens to
 * the system ConnectivityManager broadcasts — instant, battery-efficient, and
 * fires even when the app is foregrounded from the background.
 *
 * On the web, falls back to the browser's navigator.onLine + 'online'/'offline'
 * window events so the same code works everywhere without guard checks.
 *
 * Usage:
 *   inject(NetworkService).isOnline  // boolean signal
 *   inject(NetworkService).isOffline // computed inverse
 */
@Injectable({ providedIn: 'root' })
export class NetworkService implements OnDestroy {
  private snack = inject(MatSnackBar);

  // Reactive signal — true when the device has an active network connection.
  private readonly _isOnline = signal<boolean>(true);

  /** True when connected. Use in templates: networkSvc.isOnline() */
  readonly isOnline  = this._isOnline.asReadonly();
  /** Convenience inverse. */
  readonly isOffline = computed(() => !this._isOnline());

  private listenerHandle: any = null;
  private offlineFired = false;

  async init(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await this._initNative();
    } else {
      this._initWeb();
    }
  }

  // ── Native (Android) ─────────────────────────────────────────────────────

  private async _initNative(): Promise<void> {
    try {
      // Get current state immediately on startup.
      const status: ConnectionStatus = await Network.getStatus();
      this._isOnline.set(status.connected);

      // Listen for future changes.
      this.listenerHandle = await Network.addListener('networkStatusChange', (s) => {
        this._handleChange(s.connected);
      });
    } catch {
      // Plugin unavailable — assume online.
      this._isOnline.set(true);
    }
  }

  // ── Web fallback ──────────────────────────────────────────────────────────

  private _initWeb(): void {
    this._isOnline.set(navigator.onLine);
    window.addEventListener('online',  () => this._handleChange(true));
    window.addEventListener('offline', () => this._handleChange(false));
  }

  // ── Shared change handler ─────────────────────────────────────────────────

  private _handleChange(connected: boolean): void {
    this._isOnline.set(connected);

    if (!connected && !this.offlineFired) {
      this.offlineFired = true;
      this.snack.open('⚠ No network connection — working offline', '', {
        duration: 0,
        panelClass: ['system-snack', 'system-snack-warn'],
      });
    } else if (connected && this.offlineFired) {
      this.offlineFired = false;
      this.snack.dismiss();
      this.snack.open('✅ Connection restored', '', {
        duration: 2500,
        panelClass: ['system-snack'],
      });
    }
  }

  ngOnDestroy(): void {
    if (this.listenerHandle) {
      this.listenerHandle.remove?.();
    }
  }
}
