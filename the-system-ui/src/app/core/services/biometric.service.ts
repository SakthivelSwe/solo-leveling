import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

// Create a proxy to the native plugin without importing its JS implementation.
// This prevents Angular's esbuild from bundling the ancient web implementation.
const NativeBiometric = registerPlugin<any>('NativeBiometric');

/**
 * Biometric authentication service using capacitor-biometric-auth.
 * Gates app access on resume with fingerprint / face / device PIN.
 *
 * Strategy:
 *  - On app resume, if user is logged in → show lock screen
 *  - If last successful auth was < GRACE_MS ago → skip (prevents repeated prompts)
 *  - On auth success → hide lock screen, update timestamp
 *  - If biometrics unavailable → skip silently (fallback to no lock)
 */
@Injectable({ providedIn: 'root' })
export class BiometricService {
  /** Grace period after a successful auth — won't re-prompt within this window (5 min). */
  private static readonly GRACE_MS = 5 * 60 * 1000;
  private static readonly LAST_AUTH_KEY = 'system_last_biometric_auth';

  private _isLocked = false;
  private _isAvailable = false;
  private _biometricPlugin: any = null;

  get isLocked(): boolean { return this._isLocked; }
  get isAvailable(): boolean { return this._isAvailable; }

  /**
   * Initialize: check if biometrics are available on this device.
   * Call once at app startup (in NativeService.init).
   */
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      this._biometricPlugin = NativeBiometric;
      const result = await this._biometricPlugin.isAvailable();
      this._isAvailable = result.isAvailable;
    } catch {
      this._isAvailable = false;
    }
  }

  /**
   * Check if we need to prompt (outside grace period) and lock the screen.
   * Call this on every app resume event.
   */
  shouldLock(): boolean {
    if (!this._isAvailable) return false;
    const last = Number(sessionStorage.getItem(BiometricService.LAST_AUTH_KEY) ?? '0');
    return Date.now() - last > BiometricService.GRACE_MS;
  }

  /**
   * Show the device biometric prompt.
   * Resolves true on success, false on cancellation/failure.
   */
  async authenticate(): Promise<boolean> {
    if (!this._biometricPlugin) return true; // graceful fallback

    this._isLocked = true;
    try {
      await this._biometricPlugin.verifyIdentity({
        reason: 'Verify your identity to access THE SYSTEM',
        title: 'Authentication Required',
        subtitle: 'THE SYSTEM',
        description: 'Please authenticate to unlock.',
      });
      sessionStorage.setItem(BiometricService.LAST_AUTH_KEY, String(Date.now()));
      this._isLocked = false;
      return true;
    } catch (e) {
      // Auth failed or cancelled — stay locked
      this._isLocked = true;
      return false;
    }
  }

  /**
   * Lock the app immediately (e.g. on logout or explicit lock request).
   */
  lock(): void {
    this._isLocked = true;
    sessionStorage.removeItem(BiometricService.LAST_AUTH_KEY);
  }

  /**
   * Unlock without biometrics (e.g. when biometrics unavailable or on web).
   */
  unlock(): void {
    this._isLocked = false;
    sessionStorage.setItem(BiometricService.LAST_AUTH_KEY, String(Date.now()));
  }
}
