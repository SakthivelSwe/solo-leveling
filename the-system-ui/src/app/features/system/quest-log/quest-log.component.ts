import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quest } from '../../../core/models/models';
import { CATEGORY_META } from '../../../shared/system.constants';
import { listStagger } from '../../../shared/animations';

const SKIP_MSGS: Record<string, string[]> = {
  BRUTAL: [
    'THE SYSTEM DOES NOT NEGOTIATE. COMPLETE THIS QUEST.',
    'SUNG JIN-WOO NEVER SKIPPED A DUNGEON. NEITHER WILL YOU.',
    'THIS IS EXACTLY HOW E-RANK HUNTERS STAY E-RANK.',
    'SKIPPING = CHOOSING WEAKNESS. THE SYSTEM REJECTS THIS.',
  ],
  STANDARD: [
    'Quest required. Mark it done or earn it.',
    'The gate cannot be closed without this.',
    'Each skip adds to the gap. Close it now.',
  ],
  MILD: [
    'Try to complete this one.',
    'This helps. Give it a shot.',
  ],
};

@Component({
  selector: 'app-quest-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quest-log.component.html',
  styleUrls: ['./quest-log.component.scss'],
  animations: [listStagger],
})
export class QuestLogComponent {
  @Input({ required: true }) quests: Quest[] = [];
  @Input() pendingKey: string | null = null;
  @Input() pressureLevel = 'STANDARD';
  @Output() complete = new EventEmitter<Quest>();

  selectedCategory = 'ALL';
  skipWarningKey: string | null = null;
  skipMsg = '';

  readonly categories = [
    { key: 'ALL',          label: 'All Quests',   color: '#4fc3f7' },
    { key: 'DAILY',        label: 'Daily Habits', color: CATEGORY_META['DAILY'].color },
    { key: 'SKILL',        label: 'Skill Grind',  color: CATEGORY_META['SKILL'].color },
    { key: 'TESTOSTERONE', label: 'Testosterone', color: CATEGORY_META['TESTOSTERONE'].color },
    { key: 'SIDE',         label: 'Side Quests',  color: CATEGORY_META['SIDE'].color },
  ];

  get filtered(): Quest[] {
    const list = this.selectedCategory === 'ALL'
      ? this.quests
      : this.quests.filter(q => q.category === this.selectedCategory);
    // Sort: incomplete first, then completed
    return [...list].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));
  }

  get doneCount(): number { return this.quests.filter(q => q.isCompleted).length; }
  get pendingCount(): number { return this.quests.filter(q => !q.isCompleted).length; }

  categoryColor(cat: string): string { return CATEGORY_META[cat]?.color ?? '#4fc3f7'; }

  onComplete(q: Quest): void {
    if (q.isCompleted || this.pendingKey) return;
    this.complete.emit(q);
    this.skipWarningKey = null;
  }

  /** Called when user tries to navigate away from a quest (for future no-skip enforcement UI) */
  showSkipWarning(questKey: string): void {
    const msgs = SKIP_MSGS[this.pressureLevel] ?? SKIP_MSGS['STANDARD'];
    this.skipMsg = msgs[Math.floor(Math.random() * msgs.length)];
    this.skipWarningKey = questKey;
    setTimeout(() => { if (this.skipWarningKey === questKey) this.skipWarningKey = null; }, 4000);
  }

  dismissWarning(): void { this.skipWarningKey = null; }

  trackByKey(_: number, q: Quest) { return q.questKey; }

  formatBoosts(json: string | null): string {
    if (!json) return '';
    try {
      const obj = JSON.parse(json);
      return Object.entries(obj).map(([k, v]) => `${k}+${v}`).join(' · ');
    } catch { return ''; }
  }
}


