import { Injectable, signal } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

// Create a proxy to the native plugin without importing its JS implementation.
// This prevents Angular's esbuild from bundling the ancient web implementation.
const NativeBiometric = registerPlugin<any>('NativeBiometric');

/**
 * Biometric authentication service using capacitor-biometric-auth.
 *
 * Behaviour (mirrors Instagram):
 *  - First login: user enters username + password (handled by LoginComponent).
 *  - Subsequent opens: if biometric is ENABLED by the user → show biometric prompt.
 *  - Subsequent opens: if biometric is DISABLED → open directly, no credentials asked.
 *  - Grace period (5 min): short background switches don't re-prompt.
 *
 * Key storage keys (localStorage so they survive process kills):
 *  - system_biometric_enabled   → 'true' | 'false'  (user preference)
 *  - system_last_biometric_auth → timestamp ms       (grace period anchor)
 */
@Injectable({ providedIn: 'root' })
export class BiometricService {
  /** Grace period after a successful auth — won't re-prompt within this window (5 min). */
  private static readonly GRACE_MS      = 5 * 60 * 1000;
  private static readonly LAST_AUTH_KEY = 'system_last_biometric_auth';
  private static readonly ENABLED_KEY   = 'system_biometric_enabled';

  // Angular signals — computed() in AppComponent will react to these automatically.
  private readonly _isLocked    = signal(false);
  private readonly _isAvailable = signal(false);

  private _biometricPlugin: any = null;

  /** True when the full-screen lock overlay should be shown. */
  get isLocked(): boolean { return this._isLocked(); }

  /** True when the device has biometric hardware. */
  get isAvailable(): boolean { return this._isAvailable(); }

  /** Signal reference — use inside computed() for reactive template binding. */
  readonly lockedSignal    = this._isLocked.asReadonly();
  readonly availableSignal = this._isAvailable.asReadonly();

  // ─── User Preference ────────────────────────────────────────────────────────

  /** Whether the user has opted-in to biometric locking. */
  get isBiometricEnabled(): boolean {
    return localStorage.getItem(BiometricService.ENABLED_KEY) === 'true';
  }

  /**
   * Enable or disable biometric locking (surfaced in a settings toggle).
   * Disabling immediately unlocks so the user isn't trapped.
   */
  setBiometricEnabled(enabled: boolean): void {
    localStorage.setItem(BiometricService.ENABLED_KEY, String(enabled));
    if (!enabled) {
      this._isLocked.set(false);
    }
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Initialize: check if biometrics are available on this device.
   * Call once at app startup (in NativeService.init).
   */
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      this._biometricPlugin = NativeBiometric;
      const result = await this._biometricPlugin.isAvailable();
      this._isAvailable.set(result.isAvailable ?? false);
    } catch {
      this._isAvailable.set(false);
    }
  }

  // ─── Lock logic ─────────────────────────────────────────────────────────────

  /**
   * Returns true if we need to show the biometric prompt right now.
   * Conditions: hardware available AND user enabled biometrics AND outside grace period.
   */
  shouldLock(): boolean {
    if (!this._isAvailable()) return false;
    if (!this.isBiometricEnabled) return false;
    const last = Number(localStorage.getItem(BiometricService.LAST_AUTH_KEY) ?? '0');
    return Date.now() - last > BiometricService.GRACE_MS;
  }

  /**
   * Show the device biometric prompt.
   * Sets isLocked = true before the native dialog, then false on success.
   * Resolves true on success, false on cancellation/failure.
   */
  async authenticate(): Promise<boolean> {
    if (!this._biometricPlugin) {
      // No native plugin (web/dev environment) — treat as success.
      this._isLocked.set(false);
      this._updateGrace();
      return true;
    }

    this._isLocked.set(true);
    try {
      await this._biometricPlugin.verifyIdentity({
        reason:      'Verify your identity to access THE SYSTEM',
        title:       'Authentication Required',
        subtitle:    'THE SYSTEM',
        description: 'Please authenticate to unlock.',
      });
      this._updateGrace();
      this._isLocked.set(false);
      return true;
    } catch {
      // Auth failed or cancelled — stay locked.
      this._isLocked.set(true);
      return false;
    }
  }

  /**
   * Lock the app immediately (e.g. on logout or explicit lock request).
   */
  lock(): void {
    this._isLocked.set(true);
    localStorage.removeItem(BiometricService.LAST_AUTH_KEY);
  }

  /**
   * Unlock without biometrics (e.g. when biometric pref is off or on web).
   */
  unlock(): void {
    this._isLocked.set(false);
    this._updateGrace();
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private _updateGrace(): void {
    localStorage.setItem(BiometricService.LAST_AUTH_KEY, String(Date.now()));
  }
}
