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
}
