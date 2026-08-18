import { Injectable, OnDestroy, inject, signal, computed } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import { ToastService } from './toast.service';

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
  private toast = inject(ToastService);

  // Reactive signal — true when the device has an active network connection.
  private readonly _isOnline = signal<boolean>(true);

  /** True when connected. Use in templates: networkSvc.isOnline() */
  readonly isOnline  = this._isOnline.asReadonly();
  /** Convenience inverse. */
  readonly isOffline = computed(() => !this._isOnline());

  private listenerHandle: any = null;
  private offlineFired = false;

  // Bound web handlers kept as fields so they can be removed on destroy.
  private readonly _onlineHandler = () => this._handleChange(true);
  private readonly _offlineHandler = () => this._handleChange(false);

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
    window.addEventListener('online',  this._onlineHandler);
    window.addEventListener('offline', this._offlineHandler);
  }

  // ── Shared change handler ─────────────────────────────────────────────────

  private _handleChange(connected: boolean): void {
    this._isOnline.set(connected);

    if (!connected && !this.offlineFired) {
      this.offlineFired = true;
      this.toast.show('⚠ No network connection — working offline');
    } else if (connected && this.offlineFired) {
      this.offlineFired = false;

      this.toast.show('✅ Connection restored');
    }
  }

  ngOnDestroy(): void {
    if (this.listenerHandle) {
      this.listenerHandle.remove?.();
    }
    // Remove web fallback listeners to avoid duplicate handlers / leaks.
    window.removeEventListener('online',  this._onlineHandler);
    window.removeEventListener('offline', this._offlineHandler);
  }
}
