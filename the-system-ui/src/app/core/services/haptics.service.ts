import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Native haptic feedback. No-ops on the web so the same code runs everywhere.
 * Use for game-feel moments (quest complete, level up, HP damage).
 */
@Injectable({ providedIn: 'root' })
export class HapticsService {
  private native = Capacitor.isNativePlatform();

  async light(): Promise<void> {
    if (!this.native) return;
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* ignore */ }
  }

  async medium(): Promise<void> {
    if (!this.native) return;
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch { /* ignore */ }
  }

  async success(): Promise<void> {
    if (!this.native) return;
    try { await Haptics.notification({ type: NotificationType.Success }); } catch { /* ignore */ }
  }

  async warning(): Promise<void> {
    if (!this.native) return;
    try { await Haptics.notification({ type: NotificationType.Warning }); } catch { /* ignore */ }
  }

  /**
   * 3-beat celebration pattern for streak milestones.
   * Medium → pause → Medium → pause → Heavy.
   * Creates a triumphant, distinct feel different from a normal success tap.
   */
  async streak(): Promise<void> {
    if (!this.native) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      await new Promise(r => setTimeout(r, 120));
      await Haptics.impact({ style: ImpactStyle.Medium });
      await new Promise(r => setTimeout(r, 120));
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch { /* ignore */ }
  }
}
