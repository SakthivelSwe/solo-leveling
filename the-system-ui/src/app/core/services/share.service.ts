import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

export interface SharePayload {
  title: string;
  text: string;
  /** Optional URL to include (e.g. app store link). */
  url?: string;
}

/**
 * ShareService — wraps the native Android Share Sheet via @capacitor/share.
 *
 * On Android, opens the system share sheet so the user can share quest
 * completions, level-up milestones and streak records to any installed app
 * (WhatsApp, Instagram, Twitter, etc.) without any API keys.
 *
 * On the web, falls back to the W3C Web Share API if available, or copies
 * the text to clipboard as a last resort.
 *
 * Usage (from any component):
 *   const share = inject(ShareService);
 *   await share.shareAchievement('Level 10 reached!', 'I just hit Level 10 on THE SYSTEM ⚡');
 */
@Injectable({ providedIn: 'root' })
export class ShareService {

  /** Whether the current platform can share natively. */
  async canShare(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) return true;
    return !!(navigator as any).share;
  }

  /**
   * Share a quest / level-up / streak achievement.
   * @param title  Short headline (shown in share preview).
   * @param text   Body text (the message the user shares).
   * @param url    Optional URL (defaults to app's Play Store page if desired).
   */
  async shareAchievement(title: string, text: string, url?: string): Promise<void> {
    const payload: SharePayload = { title, text, url };
    await this.share(payload);
  }

  /** Generic share. Handles native, Web Share API, and clipboard fallback. */
  async share(payload: SharePayload): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await this._nativeShare(payload);
    } else if ((navigator as any).share) {
      await this._webShare(payload);
    } else {
      await this._clipboardFallback(payload.text);
    }
  }

  // ── Native (Android Share Sheet) ─────────────────────────────────────────

  private async _nativeShare(payload: SharePayload): Promise<void> {
    try {
      await Share.share({
        title:         payload.title,
        text:          payload.text,
        url:           payload.url,
        dialogTitle:   'Share your achievement',
      });
    } catch (e: any) {
      // User cancelled — not an error.
      if (e?.errorMessage !== 'Share canceled') {
        console.warn('[ShareService] native share failed', e);
      }
    }
  }

  // ── Web Share API fallback ────────────────────────────────────────────────

  private async _webShare(payload: SharePayload): Promise<void> {
    try {
      await (navigator as any).share({
        title: payload.title,
        text:  payload.text,
        url:   payload.url,
      });
    } catch {
      // User cancelled or not supported.
    }
  }

  // ── Clipboard fallback ────────────────────────────────────────────────────

  private async _clipboardFallback(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      console.info('[ShareService] Copied to clipboard:', text);
    } catch {
      // Clipboard unavailable — silently ignore.
    }
  }
}
