import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Quest, CustomQuestRequest } from '../../../core/models/models';
import { PlayerService } from '../../../core/services/player.service';
import { CATEGORY_META } from '../../../shared/system.constants';
import { listStagger } from '../../../shared/animations';

/** Active tab in the quest log */
type QuestTab = 'today' | 'weekly' | 'monthly' | 'milestones';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './quest-log.component.html',
  styleUrls: ['./quest-log.component.scss'],
  animations: [listStagger],
})
export class QuestLogComponent {
  @Input({ required: true }) quests: Quest[] = [];      // daily quests
  @Input() weeklyQuests: Quest[] = [];
  @Input() monthlyQuests: Quest[] = [];
  @Input() milestoneQuests: Quest[] = [];
  @Input() pendingKey: string | null = null;
  @Input() pressureLevel = 'STANDARD';
  @Output() complete = new EventEmitter<Quest>();
  @Output() questAdded = new EventEmitter<Quest>();
  @Output() questDeleted = new EventEmitter<string>();

  activeTab: QuestTab = 'today';
  selectedCategory = 'ALL';
  skipWarningKey: string | null = null;
  skipMsg = '';

  // Add Quest form
  showAddForm = signal(false);
  addLoading = signal(false);
  addError = signal<string | null>(null);
  newQuestLabel = '';
  newQuestCategory = 'DAILY';
  newQuestXp: number | null = null;
  newQuestStatBoosts = '';

  /** XP default shown in the form based on selected category (Option C) */
  get xpPlaceholder(): string {
    if (this.newQuestCategory === 'WEEKLY')  return '150 (default)';
    if (this.newQuestCategory === 'MONTHLY') return '300 (default)';
    return '50 (default)';
  }

  readonly dailyCategories = [
    { key: 'ALL',          label: 'All Quests',      color: '#4fc3f7' },
    { key: 'DAILY',        label: 'Daily Habits',    color: CATEGORY_META['DAILY'].color },
    { key: 'SKILL',        label: 'Skill Grind',     color: CATEGORY_META['SKILL'].color },
    { key: 'DISCIPLINE',   label: 'Discipline',      color: CATEGORY_META['DISCIPLINE'].color },
    { key: 'TESTOSTERONE', label: 'Testosterone',    color: '#D85A30' },
  ];

  constructor(private playerService: PlayerService) {}

  /** Expose Math to template for progress calculations. */
  readonly Math = Math;


  // ── Tab helpers ─────────────────────────────────────────────────────────────

  setTab(tab: QuestTab): void {
    this.activeTab = tab;
    this.skipWarningKey = null;
    if (tab === 'today') this.selectedCategory = 'ALL';
  }

  get tabLabel(): string {
    switch (this.activeTab) {
      case 'today':      return 'DAILY QUEST LOG';
      case 'weekly':     return 'WEEKLY MISSIONS';
      case 'monthly':    return 'MONTHLY GOALS';
      case 'milestones': return 'MILESTONES';
    }
  }

  get tabSubtitle(): string {
    switch (this.activeTab) {
      case 'today':      return `${this.doneCount}/${this.quests.length} CLEARED · ${this.pendingCount} REMAINING`;
      case 'weekly':     return `${this.weeklyDone}/${this.weeklyQuests.length} COMPLETED THIS WEEK`;
      case 'monthly':    return `${this.monthlyDone}/${this.monthlyQuests.length} COMPLETED THIS MONTH`;
      case 'milestones': return `${this.milestonesDone}/${this.milestoneQuests.length} ACHIEVED`;
    }
  }

  // ── Quest lists ─────────────────────────────────────────────────────────────

  get filteredDaily(): Quest[] {
    const list = this.selectedCategory === 'ALL'
      ? this.quests
      : this.quests.filter(q => q.category === this.selectedCategory);
    return [...list].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));
  }

  get filteredWeekly(): Quest[] {
    return [...this.weeklyQuests].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));
  }

  get filteredMonthly(): Quest[] {
    return [...this.monthlyQuests].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));
  }

  get filteredMilestones(): Quest[] {
    return [...this.milestoneQuests].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));
  }

  // ── Counts ──────────────────────────────────────────────────────────────────

  get doneCount():      number { return this.quests.filter(q => q.isCompleted).length; }
  get pendingCount():   number { return this.quests.filter(q => !q.isCompleted).length; }
  get weeklyDone():     number { return this.weeklyQuests.filter(q => q.isCompleted).length; }
  get monthlyDone():    number { return this.monthlyQuests.filter(q => q.isCompleted).length; }
  get milestonesDone(): number { return this.milestoneQuests.filter(q => q.isCompleted).length; }

  progressPct(tab: QuestTab): number {
    switch (tab) {
      case 'today':      return this.quests.length ? (this.doneCount / this.quests.length) * 100 : 0;
      case 'weekly':     return this.weeklyQuests.length ? (this.weeklyDone / this.weeklyQuests.length) * 100 : 0;
      case 'monthly':    return this.monthlyQuests.length ? (this.monthlyDone / this.monthlyQuests.length) * 100 : 0;
      case 'milestones': return this.milestoneQuests.length ? (this.milestonesDone / this.milestoneQuests.length) * 100 : 0;
    }
  }

  // ── Quest actions ────────────────────────────────────────────────────────────

  onComplete(q: Quest): void {
    if (q.isCompleted || this.pendingKey) return;
    this.complete.emit(q);
    this.skipWarningKey = null;
  }

  onDeleteCustom(q: Quest, event: Event): void {
    event.stopPropagation();
    if (!q.isCustom || !q.questKey) return;
    if (!confirm(`Delete "${q.label}"? This also removes your past completions.`)) return;
    this.playerService.deleteCustomQuest(q.questKey).subscribe({
      next: () => this.questDeleted.emit(q.questKey),
      error: () => {},
    });
  }

  showSkipWarning(questKey: string): void {
    const msgs = SKIP_MSGS[this.pressureLevel] ?? SKIP_MSGS['STANDARD'];
    this.skipMsg = msgs[Math.floor(Math.random() * msgs.length)];
    this.skipWarningKey = questKey;
    setTimeout(() => { if (this.skipWarningKey === questKey) this.skipWarningKey = null; }, 4000);
  }

  dismissWarning(): void { this.skipWarningKey = null; }

  // ── Add Quest form ──────────────────────────────────────────────────────────

  toggleAddForm(): void {
    this.showAddForm.set(!this.showAddForm());
    if (!this.showAddForm()) this.resetForm();
  }

  submitAddQuest(): void {
    if (!this.newQuestLabel.trim()) {
      this.addError.set('Quest label is required.');
      return;
    }
    this.addLoading.set(true);
    this.addError.set(null);

    const req: CustomQuestRequest = {
      label: this.newQuestLabel.trim(),
      category: this.newQuestCategory,
      xpReward: this.newQuestXp ?? undefined,
      statBoosts: this.newQuestStatBoosts.trim() || undefined,
    };

    this.playerService.addCustomQuest(req).subscribe({
      next: (quest) => {
        this.addLoading.set(false);
        this.questAdded.emit(quest);
        this.resetForm();
        this.showAddForm.set(false);
        // Switch to the appropriate tab after adding
        if (req.category === 'WEEKLY')  this.setTab('weekly');
        else if (req.category === 'MONTHLY') this.setTab('monthly');
        else this.setTab('today');
      },
      error: () => {
        this.addLoading.set(false);
        this.addError.set('Failed to add quest. Please try again.');
      },
    });
  }

  private resetForm(): void {
    this.newQuestLabel = '';
    this.newQuestCategory = 'DAILY';
    this.newQuestXp = null;
    this.newQuestStatBoosts = '';
    this.addError.set(null);
  }

  // ── Utilities ────────────────────────────────────────────────────────────────

  trackByKey(_: number, q: Quest) { return q.questKey; }

  categoryColor(cat: string): string { return CATEGORY_META[cat]?.color ?? '#4fc3f7'; }

  formatBoosts(json: string | null): string {
    if (!json) return '';
    try {
      const obj = JSON.parse(json);
      return Object.entries(obj).map(([k, v]) => `${k}+${v}`).join(' · ');
    } catch { return ''; }
  }

  /** Weekly progress fraction label e.g. "3/5 this week" */
  weeklyProgress(q: Quest): string {
    const done = q.weeklyDoneCount ?? 0;
    return `${done} completed this week`;
  }

  /** Monthly progress fraction label */
  monthlyProgress(q: Quest): string {
    const done = q.monthlyDoneCount ?? 0;
    return `${done} completed this month`;
  }
}
