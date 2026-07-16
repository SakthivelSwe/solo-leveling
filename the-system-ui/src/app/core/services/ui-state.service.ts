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

  closeEveningReview(): void {
    this.eveningReviewOpen.set(false);
    // Don't auto-prompt again today.
    localStorage.setItem('sys_evening_review_date', new Date().toISOString().slice(0, 10));
  }
}
