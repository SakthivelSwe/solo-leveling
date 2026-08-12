import { Component, EventEmitter, Input, Output, signal, inject, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy, HostListener } from '@angular/core';
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

// ── Rich local suggestion bank (Issue 1) ────────────────────────────────────
const LOCAL_SUGGESTIONS: Record<string, string[]> = {
  DAILY: [
    'Wake up at 5:30 AM without snoozing — 0 mins',
    'Drink 3 litres of water throughout the day',
    'Take a 10-min walk after lunch — no phone',
    'Write 3 daily goals + 3 gratitude entries in journal',
    'Sleep by 10:30 PM — full 7-hour recovery',
    'Meditate for 10 minutes — no guided audio',
    'Do 50 push-ups (any time of day) — 5 sets of 10',
    'Eat a protein-rich breakfast within 1 hour of waking',
    'No social media before 9 AM — start day with focus',
    'Cold shower for 2 minutes after workout',
    'Read 10 pages of a non-fiction book',
    'Track all meals for the day in any app or notebook',
  ],
  SKILL: [
    '[SKILL] Watch 1 beginner-friendly tutorial on Angular Guards — 15 min',
    '[SKILL] Practice writing 5 Java functions using OOP principles — 15 min',
    '[SKILL] Read 1 article on System Design basics (e.g. load balancing)',
    '[SKILL] Solve 1 LeetCode EASY problem without hints — 20 min',
    '[SKILL] Build a simple REST endpoint in Spring Boot — 30 min',
    '[SKILL] Study microservices: read about Kafka and event-driven patterns',
    '[SKILL] Watch a YouTube video on SQL indexing and query optimization',
    '[SKILL] Write 1 small React component from scratch — no copy-paste',
    '[SKILL] Learn and use 3 new Git commands you haven\'t used before',
    '[SKILL] Explain any tech concept you learned today in your own words',
    '[SKILL] Set up a Docker container for a sample Spring Boot app',
    '[SKILL] Practice speaking about a project you built — 5 min out loud',
  ],
  DISCIPLINE: [
    '[DISCIPLINE] No YouTube shorts or Instagram reels today — entire day',
    '[DISCIPLINE] Sit with boredom for 15 minutes — no phone, no music',
    '[DISCIPLINE] Complete your top 3 tasks before checking any social media',
    '[DISCIPLINE] Write down every urge you had today and how you resisted it',
    '[DISCIPLINE] Wake up within 5 minutes of your alarm — no snooze',
    '[DISCIPLINE] 30-minute deep work block — phone in another room',
    '[DISCIPLINE] Eat only what you planned — no random snacking',
    '[DISCIPLINE] Go 24 hours without complaining (even internally)',
    '[DISCIPLINE] Write a 5-sentence reflection on where you wasted time today',
    '[DISCIPLINE] Spend 0 minutes on entertainment until all quests are done',
    '[DISCIPLINE] Decline one comfortable shortcut today — choose the hard path',
    '[DISCIPLINE] Log your sleep time and wake-up time — track your recovery',
  ],
  TESTOSTERONE: [
    '[TESTO] Heavy compound lift: Deadlifts 4×5 with progressive overload',
    '[TESTO] Cold shower — 2 minutes cold, no warm water — first thing AM',
    '[TESTO] 30-minute sunlight exposure before 9 AM — no sunglasses',
    '[TESTO] Intermittent fasting: 16-hour fast (e.g. 8 PM to 12 PM next day)',
    '[TESTO] Eat 200g+ of red meat or eggs today — quality protein',
    '[TESTO] Zero alcohol, zero seed oils, zero processed sugar today',
    '[TESTO] Sprint intervals: 8 × 30-second all-out sprints with 90s rest',
    '[TESTO] Sleep by 10 PM — testosterone peaks during deep sleep before midnight',
    '[TESTO] No porn, no arousal content — dopamine reset for hormonal health',
    '[TESTO] Zinc + Vitamin D supplement today — foundational hormone support',
    '[TESTO] One social challenge: start a conversation with a stranger today',
    '[TESTO] Heavy squat session: 4×6 back squats — most testosterone-boosting lift',
  ],
  WEEKLY: [
    'Complete 5 LeetCode problems (mix of Easy + Medium) this week',
    'Build one full feature end-to-end in a side project this week',
    'Read one full tech article or chapter per day — 5 articles by Sunday',
    'Hit the gym at least 4 times this week — no excuses',
    'Write a weekly review: what worked, what failed, what to improve',
    'Practice English speaking for 30 mins daily — record yourself once',
    'Apply to at least 3 job positions with customized resumes',
    'Complete all 5 daily quest logs without missing a single day',
    'Spend 0 money on non-essentials this week — track every expense',
    'Finish one online course module or certification chapter',
  ],
  MONTHLY: [
    'Complete a full LeetCode study plan topic (e.g. Arrays, Trees)',
    'Build and deploy a mini-project to GitHub with a proper README',
    'Read one entire tech book or career development book',
    'Achieve a 30-day streak on at least one daily habit',
    'Apply to 15+ jobs this month with tailored cover letters',
    'Lose 1–2 kg of body fat through consistent diet + training',
    'Set up one new income stream or skill certification',
    'Complete all daily quests for 25+ days this month',
    'Write a technical blog post or LinkedIn article and publish it',
    'Review your stats and rank up in at least 2 skill areas',
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

  // ── Multi-select (Issue 3) ─────────────────────────────────────────────────
  multiSelectMode = signal(false);
  selectedKeys = signal<Set<string>>(new Set());
  batchLoading = signal(false);
  private longPressTimer: any = null;

  /** XP default shown in the form based on selected category */
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

  get isSakthi(): boolean {
    return this.auth.player()?.email === 'sakthiveltony@gmail.com';
  }

  get dailyCategories() {
    const cats = [
      { key: 'ALL',          label: 'All Quests',      color: '#4fc3f7' },
      { key: 'DAILY',        label: 'Daily Habits',    color: CATEGORY_META['DAILY'].color },
      { key: 'SKILL',        label: 'Skill Grind',     color: CATEGORY_META['SKILL'].color },
      { key: 'DISCIPLINE',   label: 'Discipline',      color: CATEGORY_META['DISCIPLINE'].color }
    ];
    if (this.isSakthi) {
      cats.push({ key: 'TESTOSTERONE', label: 'Testosterone', color: '#D85A30' });
    }
    return cats;
  }

  jobChangeQuest = signal<JobChangeQuest | null>(null);
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  ngOnInit() {
    this.http.get<JobChangeQuest>(`${this.api}/job-change?t=${Date.now()}`).subscribe({
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

  // ── Cached lists ─────────────────────────────────────────────────────────
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

  /** Expose Math to template */
  readonly Math = Math;

  // ── Tab helpers ──────────────────────────────────────────────────────────

  setTab(tab: QuestTab): void {
    this.activeTab = tab;
    this.skipWarningKey = null;
    this.exitMultiSelect();
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

  // ── Quest lists ──────────────────────────────────────────────────────────

  get filteredDaily(): Quest[] { return this._filteredDaily; }
  get filteredWeekly(): Quest[] { return this._filteredWeekly; }
  get filteredMonthly(): Quest[] { return this._filteredMonthly; }
  get filteredMilestones(): Quest[] { return this._filteredMilestones; }

  // ── Counts ───────────────────────────────────────────────────────────────

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

  // ── Multi-select logic (Issue 3) ─────────────────────────────────────────

  onQuestTouchStart(q: Quest, event: TouchEvent): void {
    if (q.isCompleted || q.isSkipped) return;
    this.longPressTimer = setTimeout(() => {
      this.longPressTimer = null;
      this.enterMultiSelect(q);
    }, 480);
  }

  onQuestTouchEnd(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  enterMultiSelect(q: Quest): void {
    this.multiSelectMode.set(true);
    const keys = new Set<string>();
    if (q.questKey) keys.add(q.questKey);
    this.selectedKeys.set(keys);
    // Haptic feedback if available
    if ((navigator as any).vibrate) {
      (navigator as any).vibrate(30);
    }
  }

  exitMultiSelect(): void {
    this.multiSelectMode.set(false);
    this.selectedKeys.set(new Set());
    this.batchLoading.set(false);
  }

  toggleQuestSelection(q: Quest, event: Event): void {
    event.stopPropagation();
    if (!this.multiSelectMode() || q.isCompleted || q.isSkipped) return;
    const keys = new Set(this.selectedKeys());
    if (keys.has(q.questKey)) {
      keys.delete(q.questKey);
      if (keys.size === 0) {
        this.exitMultiSelect();
        return;
      }
    } else {
      keys.add(q.questKey);
    }
    this.selectedKeys.set(keys);
  }

  isSelected(q: Quest): boolean {
    return this.selectedKeys().has(q.questKey);
  }

  get selectedCount(): number { return this.selectedKeys().size; }

  // ── Single quest complete ────────────────────────────────────────────────

  onComplete(q: Quest, event?: MouseEvent): void {
    // If multi-select mode is active, toggle selection instead
    if (this.multiSelectMode()) {
      this.toggleQuestSelection(q, event || new Event('click'));
      return;
    }
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

  // ── Batch complete (Issue 3 — Option B) ─────────────────────────────────

  batchComplete(): void {
    if (this.selectedCount === 0 || this.batchLoading()) return;

    const pendingQuests = this._filteredDaily.filter(q =>
      this.selectedKeys().has(q.questKey) && !q.isCompleted && !q.isSkipped
    );
    if (pendingQuests.length === 0) { this.exitMultiSelect(); return; }

    // Show ONE difficulty dialog for the whole batch
    const dialogRef = this.dialog.open(DifficultyPromptModalComponent, {
      data: { questName: `${pendingQuests.length} selected quests` },
      panelClass: 'transparent-panel',
      hasBackdrop: false,
    });

    dialogRef.afterClosed().subscribe((feedback: string | null | undefined) => {
      if (feedback === undefined) return; // user cancelled

      this.batchLoading.set(true);
      // Emit complete for each selected quest with the same difficulty feedback
      for (const q of pendingQuests) {
        this.complete.emit({ quest: q, difficultyFeedback: feedback });
      }
      // Exit multi-select after a short delay
      setTimeout(() => this.exitMultiSelect(), 600);
    });
  }

  // ── Escape key exits multi-select ────────────────────────────────────────
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.multiSelectMode()) this.exitMultiSelect();
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

  // ── Add Quest form ────────────────────────────────────────────────────────

  toggleAddForm(): void {
    this.showAddForm.set(!this.showAddForm());
    if (!this.showAddForm()) {
      this.resetForm();
    } else {
      this.fetchSuggestions();
    }
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

  // ── AI Suggestions — Rich local engine + API (Issue 1) ───────────────────

  suggestions = signal<string[]>([]);
  suggestionsLoading = signal<boolean>(false);

  onCategoryChange() {
    this.newQuestXp = null;
    this.fetchSuggestions();
  }

  fetchSuggestions() {
    this.suggestionsLoading.set(true);

    // 1. Immediately show local rich suggestions (instant, no network)
    const localPool = LOCAL_SUGGESTIONS[this.newQuestCategory] ?? LOCAL_SUGGESTIONS['DAILY'];
    // Shuffle and pick 10
    const shuffled = [...localPool].sort(() => Math.random() - 0.5).slice(0, 10);
    this.suggestions.set(shuffled);
    this.suggestionsLoading.set(false);

    // 2. Also fetch from backend to get AI-personalized extras (non-blocking)
    this.playerService.getQuestSuggestions(this.newQuestCategory).subscribe({
      next: (aiSuggestions) => {
        if (aiSuggestions && aiSuggestions.length > 0) {
          // Merge AI suggestions at the top (deduplicated), keep max 12 total
          const existing = new Set(this.suggestions().map(s => s.toLowerCase().slice(0, 30)));
          const fresh = aiSuggestions.filter(s =>
            s.trim().length > 5 && !existing.has(s.toLowerCase().slice(0, 30))
          );
          const merged = [...fresh.slice(0, 4), ...this.suggestions()].slice(0, 12);
          this.suggestions.set(merged);
        }
      },
      error: () => { /* local suggestions already showing — ignore */ }
    });
  }

  useSuggestion(suggestion: string) {
    this.newQuestLabel = suggestion;
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  trackByKey(_: number, q: Quest) { return q.questKey; }

  categoryColor(cat: string): string { return CATEGORY_META[cat]?.color ?? '#4fc3f7'; }

  formatBoosts(json: string | null): string {
    if (!json) return '';
    try {
      const obj = JSON.parse(json);
      return Object.entries(obj).map(([k, v]) => `${k}+${v}`).join(' · ');
    } catch { return ''; }
  }

  weeklyProgress(q: Quest): string {
    const done = q.weeklyDoneCount ?? 0;
    return `${done} completed this week`;
  }

  monthlyProgress(q: Quest): string {
    const done = q.monthlyDoneCount ?? 0;
    return `${done} completed this month`;
  }

  // ── Solo Leveling Ranks ───────────────────────────────────────────────────

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
    if (xp <= 50) return '#94a3b8';
    if (xp <= 100) return '#1FBE8E';
    if (xp <= 200) return '#4fc3f7';
    if (xp <= 500) return '#A855F7';
    if (xp <= 1000) return '#FAC775';
    return '#E24B4A';
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
