import { Injectable, signal } from '@angular/core';
import { LevelUpData } from '../../shared/components/level-up-modal.component';

@Injectable({ providedIn: 'root' })
export class UiStateService {
  levelUpData = signal<LevelUpData | null>(null);

  triggerLevelUp(data: LevelUpData): void {
    this.levelUpData.set(data);
  }

  clearLevelUp(): void {
    this.levelUpData.set(null);
  }

  /** Evening Review (9 PM check-in) overlay visibility. */
  eveningReviewOpen = signal(false);

  openEveningReview(): void {
    this.eveningReviewOpen.set(true);
  }

  // Badge Counts
  dueFlashcardsCount = signal(0);
  dueQuestsCount = signal(0);

  closeEveningReview(): void {
    this.eveningReviewOpen.set(false);
    // Don't auto-prompt again today.
    localStorage.setItem('sys_evening_review_date', new Date().toISOString().slice(0, 10));
  }

  // ── Floating XP Animations ────────────────────────────────────────────────
  
  /** Stores active XP particles that are floating on screen */
  xpParticles = signal<{ id: number; xp: number;
  gold?: number; x: number; y: number }[]>([]);
  private particleId = 0;

  public comboCount = signal<number>(0);
  private comboTimeout: any;

  incrementCombo() {
    this.comboCount.update(c => c + 1);
    if (this.comboTimeout) {
      clearTimeout(this.comboTimeout);
    }
    this.comboTimeout = setTimeout(() => {
      this.comboCount.set(0);
    }, 10000); // 10 seconds to keep combo alive
  }

  /**
   * Spawns a floating "+XP" particle at the given screen coordinates.
   */
  spawnXpParticle(xp: number, gold: number, clientX: number, clientY: number): void {
    this.incrementCombo();
    const id = this.particleId++;
    this.xpParticles.update(p => [...p, { id, xp, gold, x: clientX, y: clientY }]);
    
    // Auto-remove after animation completes (1.5s)
    setTimeout(() => {
      this.xpParticles.update(p => p.filter(x => x.id !== id));
    }, 1500);
  }
}
