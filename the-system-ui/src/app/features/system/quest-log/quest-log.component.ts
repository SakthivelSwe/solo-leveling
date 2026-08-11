import { Component, EventEmitter, Input, Output, signal, inject, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../../environments/environment';
import { Quest, CustomQuestRequest, JobChangeQuest } from '../../../core/models/models';
import { UiStateService } from '../../../core/services/ui-state.service';
import { PlayerService } from '../../../core/services/player.service';
import { AuthService } from '../../../core/services/auth.service';
import { CATEGORY_META } from '../../../shared/system.constants';
import { listStagger } from '../../../shared/animations';
import { SkipPromptModalComponent } from '../../../shared/components/skip-prompt-modal.component';
import { DifficultyPromptModalComponent } from '../../../shared/components/difficulty-prompt-modal.component';

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestLogComponent implements OnInit, OnChanges {
  todayDateNum = new Date().getDate();
  @Input({ required: true }) quests: Quest[] = [];      // daily quests
  @Input() weeklyQuests: Quest[] = [];
  @Input() monthlyQuests: Quest[] = [];
  @Input() milestoneQuests: Quest[] = [];
  @Input() pendingKey: string | null = null;
  @Input() pressureLevel = 'STANDARD';
  @Output() complete = new EventEmitter<{ quest: Quest; difficultyFeedback?: string | null }>();
  @Output() skip = new EventEmitter<{ quest: Quest; reason: string }>();
  @Output() verify = new EventEmitter<{ quest: Quest; imageBase64: string; mimeType: string }>();
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

  showBossBattle = false;

  get aiVisionEnabled(): boolean {
    return localStorage.getItem('ai_vision_enabled') === 'true';
  }

  readonly cats = CATEGORY_META;
  private auth = inject(AuthService);
  
  get dailyCategories() {
    const isSakthi = this.auth.player()?.email === 'sakthiveltony@gmail.com';
    const cats = [
      { key: 'ALL',          label: 'All Quests',      color: '#4fc3f7' },
      { key: 'DAILY',        label: 'Daily Habits',    color: CATEGORY_META['DAILY'].color },
      { key: 'SKILL',        label: 'Skill Grind',     color: CATEGORY_META['SKILL'].color },
      { key: 'DISCIPLINE',   label: 'Discipline',      color: CATEGORY_META['DISCIPLINE'].color }
    ];
    if (isSakthi) {
      cats.push({ key: 'TESTOSTERONE', label: 'Testosterone',    color: '#D85A30' });
    }
    return cats;
  }

  jobChangeQuest = signal<JobChangeQuest | null>(null);
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  ngOnInit() {
    this.http.get<JobChangeQuest>(`${this.api}/job-change`).subscribe({
      next: (q) => this.jobChangeQuest.set(q),
      error: () => {}
    });
  }

  constructor(
    private playerService: PlayerService,
    private uiState: UiStateService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['quests'] || changes['weeklyQuests'] || changes['monthlyQuests'] || changes['milestoneQuests']) {
      this.recalculateArrays();
    }
  }

  setCategory(cat: string): void {
    this.selectedCategory = cat;
    this.recalculateArrays();
  }

  // ── Cached lists ────────────────────────────────────────────────────────────
  _filteredDaily: Quest[] = [];
  _filteredWeekly: Quest[] = [];
  _filteredMonthly: Quest[] = [];
  _filteredMilestones: Quest[] = [];
  
  _doneCount = 0;
  _pendingCount = 0;
  _weeklyDone = 0;
  _monthlyDone = 0;
  _milestonesDone = 0;

  recalculateArrays(): void {
    const list = this.selectedCategory === 'ALL'
      ? this.quests
      : this.quests.filter(q => q.category === this.selectedCategory);
    this._filteredDaily = [...list].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));
    
    this._filteredWeekly = [...this.weeklyQuests].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));
    this._filteredMonthly = [...this.monthlyQuests].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));
    this._filteredMilestones = [...this.milestoneQuests].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));
    
    this._doneCount = this.quests.filter(q => q.isCompleted).length;
    this._pendingCount = this.quests.filter(q => !q.isCompleted).length;
    this._weeklyDone = this.weeklyQuests.filter(q => q.isCompleted).length;
    this._monthlyDone = this.monthlyQuests.filter(q => q.isCompleted).length;
    this._milestonesDone = this.milestoneQuests.filter(q => q.isCompleted).length;
  }

  /** Expose Math to template for progress calculations. */
  readonly Math = Math;


  // ── Tab helpers ─────────────────────────────────────────────────────────────

  setTab(tab: QuestTab): void {
    this.activeTab = tab;
    this.skipWarningKey = null;
    if (tab === 'today') {
       this.selectedCategory = 'ALL';
       this.recalculateArrays();
    }
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

  get filteredDaily(): Quest[] { return this._filteredDaily; }
  get filteredWeekly(): Quest[] { return this._filteredWeekly; }
  get filteredMonthly(): Quest[] { return this._filteredMonthly; }
  get filteredMilestones(): Quest[] { return this._filteredMilestones; }

  // ── Counts ──────────────────────────────────────────────────────────────────

  get doneCount():      number { return this._doneCount; }
  get pendingCount():   number { return this._pendingCount; }
  get weeklyDone():     number { return this._weeklyDone; }
  get monthlyDone():    number { return this._monthlyDone; }
  get milestonesDone(): number { return this._milestonesDone; }

  progressPct(tab: QuestTab): number {
    switch (tab) {
      case 'today':      return this.quests.length ? (this.doneCount / this.quests.length) * 100 : 0;
      case 'weekly':     return this.weeklyQuests.length ? (this.weeklyDone / this.weeklyQuests.length) * 100 : 0;
      case 'monthly':    return this.monthlyQuests.length ? (this.monthlyDone / this.monthlyQuests.length) * 100 : 0;
      case 'milestones': return this.milestoneQuests.length ? (this.milestonesDone / this.milestoneQuests.length) * 100 : 0;
    }
  }

  // ── Quest actions ────────────────────────────────────────────────────────────

  onComplete(q: Quest, event?: MouseEvent): void {
    if (q.isCompleted || this.pendingKey || q.isSkipped) return;
    
    const dialogRef = this.dialog.open(DifficultyPromptModalComponent, {
      data: { questName: q.label },
      panelClass: 'transparent-panel',
      hasBackdrop: false,
    });

    dialogRef.afterClosed().subscribe((feedback: string | null | undefined) => {
      if (feedback !== undefined) {
        if (event) {
          this.uiState.spawnXpParticle(q.xpReward || 50, 0, event.clientX, event.clientY);
        }
        this.complete.emit({ quest: q, difficultyFeedback: feedback });
        this.skipWarningKey = null;
      }
    });
  }

  private readonly dialog = inject(MatDialog);

  onSkip(q: Quest, event: Event): void {
    event.stopPropagation();
    if (q.isCompleted || this.pendingKey || q.isSkipped) return;
    
    const dialogRef = this.dialog.open(SkipPromptModalComponent, {
      data: { questName: q.label },
      panelClass: 'transparent-panel',
      hasBackdrop: false,
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((reason: string | null) => {
      if (reason && reason.trim().length > 0) {
        this.skip.emit({ quest: q, reason: reason.trim() });
      }
    });
  }

  onVerify(q: Quest, event: Event): void {
    event.stopPropagation();
    if (q.isCompleted || this.pendingKey) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const result = e.target.result as string;
          const mimeType = result.split(';')[0].split(':')[1];
          const base64 = result.split(',')[1];
          this.verify.emit({ quest: q, imageBase64: base64, mimeType });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
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

    let parsedStats: Record<string, number> | undefined;
    if (this.newQuestStatBoosts.trim()) {
      parsedStats = {};
      for (const p of this.newQuestStatBoosts.split(',')) {
        const parts = p.split(':');
        if (parts.length === 2 && !isNaN(Number(parts[1]))) {
          parsedStats[parts[0].trim().toUpperCase()] = Number(parts[1]);
        }
      }
    }
    const req: CustomQuestRequest = {
      label: this.newQuestLabel.trim(),
      category: this.newQuestCategory,
      xpReward: this.newQuestXp ?? undefined,
      statBoosts: parsedStats,
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

  // ── Solo Leveling Ranks ───────────────────────────────────────────────────────

  getRank(xpReward: number | undefined): string {
    const xp = xpReward || 0;
    if (xp <= 50) return 'E-RANK';
    if (xp <= 100) return 'D-RANK';
    if (xp <= 200) return 'C-RANK';
    if (xp <= 500) return 'B-RANK';
    if (xp <= 1000) return 'A-RANK';
    return 'S-RANK';
  }

  getRankColor(xpReward: number | undefined): string {
    const xp = xpReward || 0;
    if (xp <= 50) return '#94a3b8'; // E-Rank gray
    if (xp <= 100) return '#1FBE8E'; // D-Rank green
    if (xp <= 200) return '#4fc3f7'; // C-Rank blue
    if (xp <= 500) return '#A855F7'; // B-Rank purple
    if (xp <= 1000) return '#FAC775'; // A-Rank gold
    return '#E24B4A'; // S-Rank red
  }

  getDifficulty(xp: number | undefined): string {
    const v = xp || 0;
    if (v <= 50)   return 'EASY';
    if (v <= 150)  return 'MEDIUM';
    if (v <= 400)  return 'HARD';
    return 'LEGENDARY';
  }

  getDifficultyClass(xp: number | undefined): string {
    const d = this.getDifficulty(xp);
    return `diff-${d.toLowerCase()}`;
  }
}
