import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LifeOsService } from '../../core/services/life-os.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { NoFapStatus, ScienceDayCard, AddictionInsight } from '../../core/models/models';
import { RelapseDialogComponent } from './dialogs/relapse-dialog.component';
import { UrgeProtocolComponent } from './dialogs/urge-protocol.component';

@Component({
  selector: 'app-nofap-challenge',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './nofap-challenge.component.html',
  styleUrls: ['./nofap-challenge.component.scss'],
})
export class NoFapChallengeComponent implements OnInit {
  status = signal<NoFapStatus | null>(null);
  loading = signal(true);
  confirming = signal(false);
  reporting = signal(false);
  settingStartDate = signal(false);
  showStartDatePicker = signal(false);
  selectedStartDate = '';
  activeInsightTab = signal<'BRAIN' | 'TESTOSTERONE' | 'RELATIONSHIPS' | 'WORLD_STATS'>('BRAIN');
  activeScienceDay = signal<ScienceDayCard | null>(null);
  showMilestoneAnimation = signal(false);

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

  // Milestone definitions
  readonly milestones = [
    { day: 7,   label: 'Week Warrior',       xp: 500,   icon: '⚔️' },
    { day: 30,  label: 'Iron Will',          xp: 2000,  icon: '🛡️' },
    { day: 90,  label: 'Neurological Reboot', xp: 5000,  icon: '🧠' },
    { day: 365, label: 'Shadow Monarch',      xp: 15000, icon: '👑' },
  ];

  constructor(private lifeOs: LifeOsService, private snack: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.lifeOs.getNoFapStatus().subscribe({
      next: (s: NoFapStatus) => {
        this.status.set(s);
        this.activeScienceDay.set(s.dayByDayScience?.[0] ?? null);
        this.loading.set(false);
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
      width: '500px',
      disableClose: true,
      panelClass: 'dark-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.trigger) {
        this.reporting.set(true);
        this.lifeOs.reportRelapse().subscribe({
          next: (s: NoFapStatus) => {
            this.status.set(s);
            this.reporting.set(false);
            this.toast(`◈ Relapse logged (Trigger: ${result.trigger}). Day 0. The System respects your honesty. Begin again.`);
          },
          error: () => { this.reporting.set(false); this.toast('⚠ Failed to log relapse'); },
        });
      }
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

  setInsightTab(tab: 'BRAIN' | 'TESTOSTERONE' | 'RELATIONSHIPS' | 'WORLD_STATS'): void {
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
    const cards = this.status()?.dayByDayScience ?? [];
    let bestDay = 0;
    for (const c of cards) {
      if (c.day <= streak) bestDay = c.day;
    }
    return card.day === bestDay;
  }

  private triggerMilestone(): void {
    this.showMilestoneAnimation.set(true);
    setTimeout(() => this.showMilestoneAnimation.set(false), 4000);
  }

  private toast(msg: string): void {
    this.snack.open(msg, '✕', {
      duration: 3500,
      panelClass: 'system-snack',
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
