import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HabitService, HabitHistoryEntry } from '../../core/services/habit.service';
import { HapticsService } from '../../core/services/haptics.service';
import { LocalNotificationsService } from '../../core/services/local-notifications.service';
import { SseService } from '../../core/services/sse.service';
import { Habit, HabitTemplate } from '../../core/models/models';

/**
 * Habits Dashboard — the Atomic Habits & Power of Habit engine, rendered
 * as a Solo-Leveling "Discipline Grid". Different from Quests (daily reset);
 * habits track streaks, identity mastery and compounding 1% growth.
 */
@Component({
  selector: 'app-habits',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './habits.component.html',
  styleUrls: ['./habits.component.scss'],
})
export class HabitsComponent implements OnInit {
  private habitService = inject(HabitService);
  private haptics = inject(HapticsService);
  private localNotifs = inject(LocalNotificationsService);
  private sse = inject(SseService);
  private snack = inject(MatSnackBar);

  overview = this.habitService.overview;
  loading = this.habitService.loading;

  showEditor = signal(false);
  editorMode = signal<'create' | 'edit'>('create');
  showTemplates = signal(false);
  templates = signal<HabitTemplate[]>([]);
  templatesLoading = signal(false);

  // Complete-flow modal (quality + note journal)
  showComplete = signal(false);
  completeTarget = signal<Habit | null>(null);
  completeQuality = signal(3);
  completeNote = signal('');
  completeTwoMin = signal(false);

  // History (Cue Log) modal
  showHistory = signal(false);
  historyTarget = signal<Habit | null>(null);
  historyEntries = signal<HabitHistoryEntry[]>([]);
  historyLoading = signal(false);

  form = signal<Partial<Habit>>(this.blankForm());

  // Compounding curve: 30-day sparkline of 1.01^d vs 0.99^d, scaled to card height.
  compoundingCurve = computed(() => {
    const days = 30;
    const pts: { up: number; down: number }[] = [];
    for (let i = 0; i < days; i++) {
      pts.push({ up: Math.pow(1.01, i), down: Math.pow(0.99, i) });
    }
    const maxUp = pts[days - 1].up;   // ≈ 1.347
    const minDown = pts[days - 1].down; // ≈ 0.739
    const span = maxUp - minDown;
    const upPath = pts.map((p, i) => `${(i / (days - 1)) * 100},${100 - ((p.up - minDown) / span) * 100}`).join(' ');
    const downPath = pts.map((p, i) => `${(i / (days - 1)) * 100},${100 - ((p.down - minDown) / span) * 100}`).join(' ');
    return { upPath, downPath };
  });

  hasHabits = computed(() => (this.overview()?.habits.length ?? 0) > 0);
  identityKeys = computed(() => Object.keys(this.overview()?.identityScores ?? {}));

  /** Non-archived habits available as "stack-after" anchors (excludes editing target). */
  stackCandidates = computed(() =>
    (this.overview()?.habits ?? []).filter(h => !h.archived && h.id !== this.form().id));

  private firstLoad = true;

  constructor() {
    // Live SSE tick — any player-update or habit-update (both bump playerTick) refreshes the grid.
    effect(() => {
      const tick = this.sse.playerTick();
      if (tick > 0 && !this.firstLoad) this.reload();
    });
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.habitService.fetchOverview().subscribe({
      next: (o) => {
        this.localNotifs.scheduleHabits(o.habits);
        // First-run onboarding: if zero habits after first load, auto-open templates.
        if (this.firstLoad && o.habits.length === 0) this.openTemplates();
        this.firstLoad = false;
      },
    });
  }

  // ============ Complete flow ============

  /** Quick complete (default quality=3, no note). Used for one-tap card button. */
  completeHabit(h: Habit, twoMinute = false): void {
    if (h.completedToday) return;
    this.habitService.complete(h.id, { twoMinute }).subscribe({
      next: (res) => {
        this.haptics[twoMinute ? 'light' : 'success']();
        this.snack.open(
          `◈ +${res.xpGained} XP · streak ${res.newCurrentStreak} — ${res.systemMessage}`,
          '✕',
          { duration: 5000, panelClass: 'system-snack' },
        );
        this.reload();
      },
      error: (e) => {
        this.haptics.warning();
        this.snack.open(`◈ ${e.error?.message || 'Could not complete'}`, '✕', { duration: 4000 });
      },
    });
  }

  /** Open the reflect-and-complete modal (quality rating + optional Cue Log note). */
  openCompleteModal(h: Habit, twoMinute = false): void {
    if (h.completedToday) return;
    this.completeTarget.set(h);
    this.completeQuality.set(3);
    this.completeNote.set('');
    this.completeTwoMin.set(twoMinute);
    this.showComplete.set(true);
  }

  submitComplete(): void {
    const h = this.completeTarget();
    if (!h) return;
    this.habitService.complete(h.id, {
      quality: this.completeQuality(),
      twoMinute: this.completeTwoMin(),
      note: this.completeNote().trim() || undefined,
    }).subscribe({
      next: (res) => {
        this.haptics[this.completeTwoMin() ? 'light' : 'success']();
        this.snack.open(
          `◈ +${res.xpGained} XP · streak ${res.newCurrentStreak} — ${res.systemMessage}`,
          '✕', { duration: 5000, panelClass: 'system-snack' },
        );
        this.showComplete.set(false);
        this.reload();
      },
      error: (e) => {
        this.haptics.warning();
        this.snack.open(`◈ ${e.error?.message || 'Could not complete'}`, '✕', { duration: 4000 });
      },
    });
  }

  closeComplete(): void { this.showComplete.set(false); }

  // ============ History (Cue Log) ============

  openHistory(h: Habit): void {
    this.historyTarget.set(h);
    this.historyEntries.set([]);
    this.historyLoading.set(true);
    this.showHistory.set(true);
    this.habitService.history(h.id).subscribe({
      next: (list) => { this.historyEntries.set(list); this.historyLoading.set(false); },
      error: () => this.historyLoading.set(false),
    });
  }

  closeHistory(): void { this.showHistory.set(false); }

  // ============ Editor ============

  openCreate(): void {
    this.form.set(this.blankForm());
    this.editorMode.set('create');
    this.showEditor.set(true);
  }

  openEdit(h: Habit): void {
    this.form.set({ ...h });
    this.editorMode.set('edit');
    this.showEditor.set(true);
  }

  closeEditor(): void {
    this.showEditor.set(false);
  }

  /** Toggle a weekday bit in the activeDays mask. bit0=Mon … bit6=Sun. */
  toggleDay(bit: number): void {
    const mask = this.form().activeDays ?? 127;
    const next = mask ^ (1 << bit);
    this.updateForm('activeDays', next || 1); // never allow 0 — force at least one day
  }

  dayOn(bit: number): boolean {
    return ((this.form().activeDays ?? 127) & (1 << bit)) !== 0;
  }

  saveHabit(): void {
    const f = this.form();
    if (!f.name || !f.name.trim()) {
      this.snack.open('◈ Habit name required', '✕', { duration: 3000 });
      return;
    }
    const req = this.editorMode() === 'create'
      ? this.habitService.create(f)
      : this.habitService.update(f.id!, f);
    req.subscribe({
      next: () => {
        this.snack.open('◈ Habit saved. Identity vote registered.', '✕', { duration: 3500 });
        this.showEditor.set(false);
        this.reload();
      },
      error: (e) => this.snack.open(`◈ ${e.error?.message || 'Save failed'}`, '✕', { duration: 3500 }),
    });
  }

  archive(h: Habit): void {
    if (!confirm(`Archive "${h.name}"? Streak history is preserved.`)) return;
    this.habitService.archive(h.id).subscribe({
      next: () => { this.snack.open('◈ Habit archived.', '✕', { duration: 3000 }); this.reload(); },
    });
  }

  // ============ Templates ============

  openTemplates(): void {
    this.showTemplates.set(true);
    this.templatesLoading.set(true);
    this.habitService.templates().subscribe({
      next: (t) => { this.templates.set(t); this.templatesLoading.set(false); },
      error: () => this.templatesLoading.set(false),
    });
  }

  closeTemplates(): void { this.showTemplates.set(false); }

  adopt(t: HabitTemplate): void {
    this.habitService.adopt(t.key).subscribe({
      next: () => {
        this.haptics.success();
        this.snack.open(`◈ "${t.name}" adopted. Cue set at ${t.cueTime}.`, '✕', { duration: 4000 });
        this.reload();
      },
      error: (e) => this.snack.open(`◈ ${e.error?.message || 'Adopt failed'}`, '✕', { duration: 3500 }),
    });
  }

  // ============ UI helpers ============

  identityColor(tag: string | null | undefined): string {
    switch ((tag || '').toLowerCase()) {
      case 'hunter':  return '#E24B4A';
      case 'scholar': return '#4AA3E2';
      case 'monk':    return '#7EC7A8';
      case 'warrior': return '#FAC775';
      default:        return '#8892B0';
    }
  }

  streakEmoji(days: number): string {
    if (days >= 66) return '👑';
    if (days >= 30) return '🔥🔥';
    if (days >= 7)  return '🔥';
    if (days >= 3)  return '✧';
    return '·';
  }

  activeDayLabels(mask: number): string {
    if (mask === 127) return 'DAILY';
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return days.map((d, i) => (mask & (1 << i)) ? d : '·').join(' ');
  }

  /** Look up a habit's name by id for the "stack after" hint on cards. */
  habitName(id: number | null | undefined): string {
    if (!id) return '';
    return this.overview()?.habits.find(h => h.id === id)?.name ?? '';
  }

  private blankForm(): Partial<Habit> {
    return {
      name: '',
      identityTag: 'Hunter',
      cue: '',
      craving: '',
      routine: '',
      reward: '',
      twoMinuteVersion: '',
      cueTime: '',
      difficulty: 1,
      keystone: false,
      activeDays: 127,
      stackAfterHabitId: null,
    };
  }

  updateForm<K extends keyof Habit>(key: K, value: any): void {
    this.form.update(f => ({ ...f, [key]: value }));
  }
}
