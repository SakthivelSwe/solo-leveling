import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LifeOsService } from '../../core/services/life-os.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { NoFapStatus, ScienceDayCard, AddictionInsight } from '../../core/models/models';
import { RelapseDialogComponent } from './dialogs/relapse-dialog.component';
import { UrgeProtocolComponent } from './dialogs/urge-protocol.component';
import { PastAutopsiesComponent } from './dialogs/past-autopsies.component';

@Component({
  selector: 'app-nofap-challenge',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './nofap-challenge.component.html',
  styleUrls: ['./nofap-challenge.component.scss'],
})
export class NoFapChallengeComponent implements OnInit, OnDestroy {
  status = signal<NoFapStatus | null>(null);
  loading = signal(true);
  confirming = signal(false);
  reporting = signal(false);
  settingStartDate = signal(false);
  showStartDatePicker = signal(false);
  selectedStartDate = '';
  activeInsightTab = signal<'BRAIN' | 'TESTOSTERONE' | 'RELATIONSHIPS' | 'WORLD_STATS' | 'DOPAMINE'>('BRAIN');
  activeScienceDay = signal<ScienceDayCard | null>(null);
  showMilestoneAnimation = signal(false);

  // ── Live Elapsed Timer ───────────────────────────────────────────
  /** ISO timestamp saved in localStorage when user confirms clean for the current day */
  private readonly CONFIRM_TIME_KEY = 'nf_confirm_time';
  /** Displayed elapsed time string, updated every second */
  elapsedDisplay = signal<string>('0d 00h 00m 00s');
  /** Formatted datetime string of when clean day was confirmed e.g. "29 Jul 2026, 11:00 AM" */
  confirmTimeDisplay = signal<string | null>(null);
  /** Next milestone datetime string e.g. "30 Jul 2026, 11:00 AM" */
  nextDayTimeDisplay = signal<string | null>(null);
  private timerInterval: any = null;

  // Breathing widget
  breathingActive = signal(false);
  breathingPhase = signal<'inhale' | 'hold' | 'exhale' | 'idle'>('idle');
  breathingSeconds = signal(0);
  private breathingInterval: any = null;
  private breathingCycle = 0;

  // Timeline view mode
  timelineViewMode = signal<'scroll' | 'grid'>('scroll');
  selectedPhaseFilter = signal<string | null>(null);

  // Quote display
  quoteVisible = signal(true);
  showQuotePulse = signal(false);

  // Expanded day detail visibility
  showDayDetail = signal(true);

  // ── Mood Journal ─────────────────────────────────────────────
  readonly moods: MoodEntry['mood'][] = ['GREAT', 'GOOD', 'NEUTRAL', 'LOW', 'URGE'];
  readonly moodEmoji: Record<MoodEntry['mood'], string> = {
    GREAT: '🔥', GOOD: '😊', NEUTRAL: '😐', LOW: '😔', URGE: '⚡'
  };
  readonly moodColor: Record<MoodEntry['mood'], string> = {
    GREAT: '#1FBE8E', GOOD: '#6C63FF', NEUTRAL: '#FAC775', LOW: '#E24B4A', URGE: '#A855F7'
  };
  todayMood = signal<MoodEntry['mood'] | null>(null);
  moodHistory = signal<MoodEntry[]>([]);
  moodNote = '';

  // ── Trigger Tracker ────────────────────────────────────────────
  readonly commonTriggers = [
    { key: 'BOREDOM',    label: 'Boredom',         icon: '😴' },
    { key: 'STRESS',     label: 'Stress',           icon: '😤' },
    { key: 'LONELINESS', label: 'Loneliness',       icon: '😶' },
    { key: 'SOCIAL',     label: 'Social Media',     icon: '📱' },
    { key: 'NIGHT',      label: 'Late Night',       icon: '🌙' },
    { key: 'FANTASY',    label: 'Fantasy/Thoughts', icon: '💭' },
    { key: 'ANGER',      label: 'Anger/Frustration',icon: '😡' },
    { key: 'REJECTION',  label: 'Rejection',        icon: '💔' },
  ];
  triggerLog = signal<TriggerEntry[]>([]);
  triggerFreq = signal<Record<string, number>>({});
  customTriggerInput = '';
  todayTriggerLogged = signal(false);

  /** True when the user has zero logs — show the "I Already Started" onboarding banner */
  showOnboarding = computed(() => {
    const s = this.status();
    if (!s) return false;
    return s.currentStreak === 0 && !s.todayConfirmed && s.last90Days.every(d => d === null);
  });

  /** Today's date as YYYY-MM-DD for max attribute on date input */
  readonly todayDateString = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1); // yesterday = max valid start date
    return d.toISOString().split('T')[0];
  })();

  /** Earliest allowed start date (1 year ago) */
  readonly earliestDateString = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  })();

  // ── Nightfall Tracker ────────────────────────────────────────────
  nightfallDates = signal<string[]>([]);
  
  // Flatline Warning System
  isFlatline = computed(() => {
    const s = this.status();
    if (!s) return false;
    return s.currentStreak >= 14 && s.currentStreak <= 45;
  });

  // Milestone definitions
  readonly milestones = [
    { day: 7,   label: 'Week Warrior',       xp: 500,   icon: '⚔️' },
    { day: 30,  label: 'Iron Will',          xp: 2000,  icon: '🛡️' },
    { day: 90,  label: 'Neurological Reboot', xp: 5000,  icon: '🧠' },
    { day: 365, label: 'Shadow Monarch',      xp: 15000, icon: '👑' },
  ];

  constructor(
    private lifeOs: LifeOsService,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadMoodJournal();
    this.loadTriggerLog();
    this.loadNightfalls();
    this.startElapsedTimer();
  }

  ngOnDestroy(): void {
    this.stopElapsedTimer();
    if (this.breathingInterval) clearInterval(this.breathingInterval);
  }

  load(): void {
    this.loading.set(true);
    this.lifeOs.getNoFapStatus().subscribe({
      next: (s: NoFapStatus) => {
        this.status.set(s);
        // Select the card for the current streak day
        const cards = s.dayByDayScience ?? [];
        const todayCard = cards.find(c => c.day === s.currentStreak)
          ?? cards.reduce((best, c) => c.day <= s.currentStreak ? c : best, cards[0]);
        this.activeScienceDay.set(todayCard ?? cards[0] ?? null);
        this.loading.set(false);
        // Brief quote pulse animation
        this.showQuotePulse.set(true);
        setTimeout(() => this.showQuotePulse.set(false), 1200);
      },
      error: () => {
        this.loading.set(false);
        this.toast('⚠ Could not connect to the System');
      },
    });
  }

  confirmClean(): void {
    if (this.confirming()) return;
    this.confirming.set(true);
    this.lifeOs.confirmCleanDay().subscribe({
      next: (s: NoFapStatus) => {
        const prev = this.status()?.currentStreak ?? 0;
        this.status.set(s);
        this.confirming.set(false);
        // Save confirmation timestamp to localStorage for the live timer
        const now = new Date();
        localStorage.setItem(this.CONFIRM_TIME_KEY, now.toISOString());
        this.updateTimerDisplays(now);
        this.startElapsedTimer();
        // Trigger milestone animation if a milestone was just crossed
        if ([7, 30, 90, 365].includes(s.currentStreak) && s.currentStreak > prev) {
          this.triggerMilestone();
        }
        this.toast(`◈ Day ${s.currentStreak} confirmed. ${s.phaseIcon} ${s.phaseName} phase active.`);
      },
      error: () => { this.confirming.set(false); this.toast('⚠ Failed to confirm'); },
    });
  }

  reportRelapse(): void {
    const dialogRef = this.dialog.open(RelapseDialogComponent, {
      panelClass: 'transparent-panel',
      hasBackdrop: false,
      maxWidth: '100vw',
      width: '100vw',
      height: '100vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.trigger) {
        this.reporting.set(true);
        this.lifeOs.reportRelapse().subscribe({
          next: (s: NoFapStatus) => {
            this.status.set(s);
            this.reporting.set(false);
            // Clear the confirm timer on relapse
            localStorage.removeItem(this.CONFIRM_TIME_KEY);
            this.confirmTimeDisplay.set(null);
            this.nextDayTimeDisplay.set(null);
            this.elapsedDisplay.set('0d 00h 00m 00s');
            this.stopElapsedTimer();
            this.toast(`◈ Relapse logged (Trigger: ${result.trigger}). Day 0. The System respects your honesty. Begin again.`);
          },
          error: () => { this.reporting.set(false); this.toast('⚠ Failed to log relapse'); },
        });
      }
    });
  }

  // ── Live Elapsed Timer Helpers ─────────────────────────────────

  private startElapsedTimer(): void {
    this.stopElapsedTimer(); // clear any existing interval

    const stored = localStorage.getItem(this.CONFIRM_TIME_KEY);
    if (!stored) return;

    const confirmDate = new Date(stored);
    if (isNaN(confirmDate.getTime())) return;

    // Check if stored timestamp is from a previous day's streak (relapse happened)
    const s = this.status();
    if (s && !s.todayConfirmed && s.currentStreak === 0) {
      // Don't show timer if not confirmed today
      return;
    }

    this.updateTimerDisplays(confirmDate);
    this.timerInterval = setInterval(() => this.updateTimerDisplays(confirmDate), 1000);
  }

  private stopElapsedTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private updateTimerDisplays(confirmDate: Date): void {
    // Format the confirmation time: "29 Jul 2026, 11:00 AM"
    this.confirmTimeDisplay.set(
      confirmDate.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      }).toUpperCase()
    );

    // Next day = 24h after confirmation
    const nextDay = new Date(confirmDate.getTime() + 24 * 60 * 60 * 1000);
    this.nextDayTimeDisplay.set(
      nextDay.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      }).toUpperCase()
    );

    // Compute elapsed
    const elapsed = this.computeElapsed(confirmDate);
    this.elapsedDisplay.set(elapsed);
  }

  private computeElapsed(from: Date): string {
    const now = new Date();
    let diff = Math.max(0, now.getTime() - from.getTime());

    const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * 1000 * 60 * 60 * 24;
    const hours   = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * 1000 * 60 * 60;
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * 1000 * 60;
    const seconds = Math.floor(diff / 1000);

    return `${days}d ${this.pad(hours)}h ${this.pad(minutes)}m ${this.pad(seconds)}s`;
  }

  private pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  viewPastAutopsies(): void {
    this.dialog.open(PastAutopsiesComponent, {
      panelClass: 'transparent-panel',
      hasBackdrop: false,
      maxWidth: '100vw',
      width: '100vw',
      height: '100vh'
    });
  }

  openUrgeProtocol(): void {
    const s = this.status();
    const dialogRef = this.dialog.open(UrgeProtocolComponent, {
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      panelClass: 'fullscreen-dark-dialog',
      data: { insights: s?.addictionInsights || [] }
    });

    dialogRef.afterClosed().subscribe(survived => {
      if (survived) {
        this.lifeOs.reportUrgeSurvived().subscribe({
          next: (res: any) => {
            this.toast(`◈ ${res.message} (+${res.xpAwarded} XP)`);
          },
          error: () => { this.toast('⚠ System error updating XP, but good job surviving.'); }
        });
      }
    });
  }

  setStartDate(): void {
    if (!this.selectedStartDate) {
      this.toast('⚠ Please pick your actual start date first');
      return;
    }
    if (this.settingStartDate()) return;
    this.settingStartDate.set(true);

    this.lifeOs.setNoFapStartDate(this.selectedStartDate).subscribe({
      next: (s: NoFapStatus) => {
        this.status.set(s);
        this.settingStartDate.set(false);
        this.showStartDatePicker.set(false);
        this.triggerMilestone();
        this.toast(`◈ Streak backfilled! ${s.currentStreak} days of discipline recognized. Welcome back, Hunter.`);
      },
      error: (e: any) => {
        this.settingStartDate.set(false);
        const msg = e?.error ?? '⚠ Failed to set start date';
        this.toast(typeof msg === 'string' ? msg : '⚠ Failed to set start date');
      },
    });
  }

  /** How many days ago a given date is (for the quick-select buttons) */
  dateForDaysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }

  selectDaysAgo(days: number): void {
    this.selectedStartDate = this.dateForDaysAgo(days);
  }

  /** Days from a date string (YYYY-MM-DD) to today */
  daysBetween(dateStr: string): number {
    if (!dateStr) return 0;
    const start = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    start.setHours(0,0,0,0);
    return Math.max(0, Math.round((today.getTime() - start.getTime()) / 86400000));
  }

  setInsightTab(tab: 'BRAIN' | 'TESTOSTERONE' | 'RELATIONSHIPS' | 'WORLD_STATS' | 'DOPAMINE'): void {
    this.activeInsightTab.set(tab);
  }

  selectScienceDay(card: ScienceDayCard): void {
    this.activeScienceDay.set(card);
  }

  filteredInsights(category: string): AddictionInsight[] {
    return (this.status()?.addictionInsights ?? []).filter(i => i.category === category);
  }

  heatmapClass(val: boolean | null): string {
    if (val === null) return 'hm-empty';
    return val ? 'hm-clean' : 'hm-relapse';
  }

  milestoneUnlocked(day: number): boolean {
    return (this.status()?.currentStreak ?? 0) >= day;
  }

  milestoneLocked(day: number): boolean {
    return !this.milestoneUnlocked(day);
  }

  daysToMilestone(day: number): number {
    return Math.max(0, day - (this.status()?.currentStreak ?? 0));
  }

  phaseProgressPct(): number {
    const s = this.status();
    if (!s) return 0;
    const current = s.currentStreak;
    const next = s.nextMilestone;
    const prev = this.prevMilestone(next);
    return Math.min(100, Math.round(((current - prev) / (next - prev)) * 100));
  }

  circleOffset(): number {
    const pct = this.phaseProgressPct();
    const circumference = 2 * Math.PI * 54; // r=54
    return circumference - (pct / 100) * circumference;
  }

  percentileLabel(streak: number): string {
    if (streak >= 90) return 'Top 3% Globally 🌍';
    if (streak >= 30) return 'Top 15% Globally 🌍';
    if (streak >= 7) return 'Top 30% Globally 🌍';
    if (streak >= 3) return 'Top 50% Globally 🌍';
    return 'Starting the journey';
  }

  private prevMilestone(next: number): number {
    if (next === 7) return 0;
    if (next === 30) return 7;
    if (next === 90) return 30;
    return 90;
  }

  getCategoryIcon(category: string): string {
    const map: Record<string, string> = {
      DOPAMINE: '⚡', TESTOSTERONE: '💪', MEMORY: '📚',
      FOCUS: '🎯', CONFIDENCE: '😤', SLEEP: '💤', NEUROPLASTICITY: '🧬',
    };
    return map[category] ?? '🧠';
  }

  phaseColor(phase: string): string {
    const map: Record<string, string> = {
      REWIRING: '#E24B4A', CLARITY: '#FAC775',
      TRANSFORMATION: '#1FBE8E', MASTERY: '#A855F7',
    };
    return map[phase] ?? '#6C63FF';
  }

  isTodayCard(card: ScienceDayCard, streak: number): boolean {
    // The current day card is the one whose day matches the streak exactly,
    // or the closest one without exceeding it
    const cards = this.status()?.dayByDayScience ?? [];
    let bestDay = -1;
    for (const c of cards) {
      if (c.day <= streak) bestDay = c.day;
    }
    return card.day === bestDay;
  }

  toggleTimelineView(): void {
    this.timelineViewMode.set(this.timelineViewMode() === 'scroll' ? 'grid' : 'scroll');
  }

  setPhaseFilter(phase: string | null): void {
    this.selectedPhaseFilter.set(phase);
  }

  filteredTimelineCards(): ScienceDayCard[] {
    const cards = this.status()?.dayByDayScience ?? [];
    const filter = this.selectedPhaseFilter();
    if (!filter) return cards;
    return cards.filter(c => c.phase === filter);
  }

  recoveryVelocityLabel(velocity: number): string {
    if (velocity >= 1000) return 'LEGENDARY';
    if (velocity >= 500) return 'ELITE';
    if (velocity >= 200) return 'STRONG';
    if (velocity >= 100) return 'ON TRACK';
    if (velocity >= 50) return 'BUILDING';
    return 'STARTING';
  }

  recoveryVelocityColor(velocity: number): string {
    if (velocity >= 1000) return '#A855F7';
    if (velocity >= 500) return '#1FBE8E';
    if (velocity >= 200) return '#FAC775';
    if (velocity >= 100) return '#6C63FF';
    return '#E24B4A';
  }

  // ── Breathing Widget ────────────────────────────────────────────
  startBreathing(): void {
    if (this.breathingActive()) {
      this.stopBreathing();
      return;
    }
    this.breathingActive.set(true);
    this.breathingCycle = 0;
    this.runBreathingCycle();
  }

  private runBreathingCycle(): void {
    const phases: Array<{ phase: 'inhale' | 'hold' | 'exhale'; duration: number; label: string }> = [
      { phase: 'inhale', duration: 4, label: 'BREATHE IN' },
      { phase: 'hold',   duration: 7, label: 'HOLD' },
      { phase: 'exhale', duration: 8, label: 'BREATHE OUT' },
    ];

    let phaseIdx = 0;
    let secondsLeft = phases[0].duration;
    this.breathingPhase.set(phases[0].phase);
    this.breathingSeconds.set(secondsLeft);

    this.breathingInterval = setInterval(() => {
      secondsLeft--;
      this.breathingSeconds.set(secondsLeft);

      if (secondsLeft <= 0) {
        phaseIdx = (phaseIdx + 1) % phases.length;
        if (phaseIdx === 0) {
          this.breathingCycle++;
          if (this.breathingCycle >= 3) {
            this.stopBreathing();
            this.toast('◈ 4-7-8 breathing complete. Urge suppressed.');
            return;
          }
        }
        secondsLeft = phases[phaseIdx].duration;
        this.breathingPhase.set(phases[phaseIdx].phase);
        this.breathingSeconds.set(secondsLeft);
      }
    }, 1000);
  }

  stopBreathing(): void {
    if (this.breathingInterval) {
      clearInterval(this.breathingInterval);
      this.breathingInterval = null;
    }
    this.breathingActive.set(false);
    this.breathingPhase.set('idle');
    this.breathingSeconds.set(0);
    this.breathingCycle = 0;
  }

  private triggerMilestone(): void {
    this.showMilestoneAnimation.set(true);
    setTimeout(() => this.showMilestoneAnimation.set(false), 4000);
  }

  // ── Mood Journal Methods ──────────────────────────────────────

  private moodStorageKey(): string {
    return `nf_mood_${new Date().getFullYear()}`;
  }

  loadMoodJournal(): void {
    try {
      const raw = localStorage.getItem(this.moodStorageKey());
      const entries: MoodEntry[] = raw ? JSON.parse(raw) : [];
      this.moodHistory.set(entries.slice(-30)); // Last 30 days
      // Set today's mood if already logged
      const todayStr = new Date().toISOString().split('T')[0];
      const todayEntry = entries.find(e => e.date === todayStr);
      if (todayEntry) this.todayMood.set(todayEntry.mood);
    } catch { this.moodHistory.set([]); }
  }

  logMood(mood: MoodEntry['mood']): void {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const raw = localStorage.getItem(this.moodStorageKey());
      const entries: MoodEntry[] = raw ? JSON.parse(raw) : [];
      // Remove today's entry if exists
      const filtered = entries.filter(e => e.date !== todayStr);
      filtered.push({ date: todayStr, mood, note: this.moodNote.trim() || undefined });
      localStorage.setItem(this.moodStorageKey(), JSON.stringify(filtered));
      this.todayMood.set(mood);
      this.moodHistory.set(filtered.slice(-30));
      this.moodNote = '';
      this.toast(`${this.moodEmoji[mood]} Mood logged: ${mood}`);
    } catch { this.toast('⚠ Could not save mood'); }
  }

  last7MoodHistory(): MoodEntry[] {
    const all = this.moodHistory();
    return all.slice(-7);
  }

  moodBarHeight(mood: MoodEntry['mood']): number {
    const map: Record<MoodEntry['mood'], number> = {
      GREAT: 100, GOOD: 80, NEUTRAL: 55, LOW: 30, URGE: 20
    };
    return map[mood];
  }

  // ── Trigger Tracker Methods ───────────────────────────────────

  private triggerStorageKey(): string {
    return `nf_triggers_${new Date().getFullYear()}`;
  }

  loadTriggerLog(): void {
    try {
      const raw = localStorage.getItem(this.triggerStorageKey());
      const entries: TriggerEntry[] = raw ? JSON.parse(raw) : [];
      this.triggerLog.set(entries.slice(-50));
      // Build frequency map
      const freq: Record<string, number> = {};
      for (const e of entries) { freq[e.trigger] = (freq[e.trigger] ?? 0) + 1; }
      this.triggerFreq.set(freq);
      // Check if already logged today
      const todayStr = new Date().toISOString().split('T')[0];
      this.todayTriggerLogged.set(entries.some(e => e.date === todayStr));
    } catch { this.triggerLog.set([]); }
  }

  logTrigger(triggerKey: string, label: string): void {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const raw = localStorage.getItem(this.triggerStorageKey());
      const entries: TriggerEntry[] = raw ? JSON.parse(raw) : [];
      entries.push({ date: todayStr, trigger: triggerKey, label });
      localStorage.setItem(this.triggerStorageKey(), JSON.stringify(entries));
      this.loadTriggerLog();
      this.toast(`◈ Trigger logged: ${label}. Awareness is the first defence.`);
    } catch { this.toast('⚠ Could not save trigger'); }
  }

  logCustomTrigger(): void {
    const val = this.customTriggerInput.trim();
    if (!val) { this.toast('⚠ Enter a trigger first'); return; }
    this.logTrigger('CUSTOM_' + val.toUpperCase().replace(/\s/g, '_'), val);
    this.customTriggerInput = '';
  }

  topTriggers(): Array<{ trigger: string; label: string; count: number }> {
    const freq = this.triggerFreq();
    const all = this.triggerLog();
    const map = new Map<string, { label: string; count: number }>();
    for (const e of all) {
      if (!map.has(e.trigger)) map.set(e.trigger, { label: e.label, count: 0 });
      map.get(e.trigger)!.count++;
    }
    return Array.from(map.entries())
      .map(([trigger, v]) => ({ trigger, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private toast(msg: string): void {
    this.snack.open(msg, '✕', {
      duration: 3500,
      panelClass: 'system-snack',
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  // ── Nightfall Tracker Methods ─────────────────────────────────

  private nightfallStorageKey(): string {
    return `nf_nightfalls_${new Date().getFullYear()}`;
  }

  loadNightfalls(): void {
    try {
      const raw = localStorage.getItem(this.nightfallStorageKey());
      const entries: string[] = raw ? JSON.parse(raw) : [];
      this.nightfallDates.set(entries);
    } catch {
      this.nightfallDates.set([]);
    }
  }

  logNightfall(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const raw = localStorage.getItem(this.nightfallStorageKey());
      const entries: string[] = raw ? JSON.parse(raw) : [];
      
      if (!entries.includes(todayStr)) {
        entries.push(todayStr);
        localStorage.setItem(this.nightfallStorageKey(), JSON.stringify(entries));
        this.nightfallDates.set(entries);
        this.toast(`◈ Nightfall logged. This is a natural release. Your streak remains pure.`);
      } else {
        this.toast(`⚠ Nightfall already logged for today.`);
      }
    } catch { 
      this.toast('⚠ Could not log nightfall'); 
    }
  }

  isNightfall(dateStr: string): boolean {
    return this.nightfallDates().includes(dateStr);
  }

  isNightfallForHeatmapIndex(index: number): boolean {
    const daysAgo = 89 - index;
    const dateStr = this.dateForDaysAgo(daysAgo);
    return this.isNightfall(dateStr);
  }
}

// ── Local-storage data types ──────────────────────────────────────
interface MoodEntry {
  date: string;         // YYYY-MM-DD
  mood: 'GREAT' | 'GOOD' | 'NEUTRAL' | 'LOW' | 'URGE';
  note?: string;
}

interface TriggerEntry {
  date: string;         // YYYY-MM-DD
  trigger: string;      // key e.g. BOREDOM, STRESS, CUSTOM_...
  label: string;        // human label
}

