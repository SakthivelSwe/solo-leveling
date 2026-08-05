import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LifeOsService } from '../../core/services/life-os.service';
import { DopamineLog } from '../../core/models/models';

interface ScoreItem {
  label: string;
  icon: string;
  penalty: number;
  color: string;
}

@Component({
  selector: 'app-dopamine-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dopamine-tracker.component.html',
  styleUrls: ['./dopamine-tracker.component.scss']
})
export class DopamineTrackerComponent implements OnInit {

  // Today's form data
  socialMediaMin = signal(0);
  reelsMin = signal(0);
  gamingMin = signal(0);
  junkFoodItems = signal(0);
  screenTimeHrs = signal(0);   // NEW: total phone screen hours
  pornViewed = signal(false);
  exerciseDone = signal(false);
  coldShower = signal(false);
  meditationDone = signal(false); // NEW: meditation bonus

  // UI state
  isSaving = signal(false);
  saveSuccess = signal(false);
  activeView = signal<'LOG' | 'HISTORY' | 'BREAKDOWN'>('LOG');

  // Data
  todayLog = signal<DopamineLog | null>(null);
  history = signal<DopamineLog[]>([]);

  // ========== COMPUTED ==========

  /** Projected Dopamine Load (0-100) */
  projectedScore = computed(() => {
    let score = 0;
    score += Math.floor(this.socialMediaMin() / 30) * 8;
    score += Math.floor(this.reelsMin() / 30) * 15;
    if (this.gamingMin() > 60) score += 12;
    score += this.junkFoodItems() * 5;
    if (this.screenTimeHrs() > 4) score += 10;
    else if (this.screenTimeHrs() > 2) score += 5;
    if (this.pornViewed()) score += 20;
    if (this.exerciseDone()) score -= 20;
    if (this.coldShower()) score -= 10;
    if (this.meditationDone()) score -= 8;
    return Math.max(0, Math.min(100, score));
  });

  projectedMultiplier = computed(() => {
    const s = this.projectedScore();
    if (s <= 20) return 1.2;   // Bonus for clean day!
    if (s <= 30) return 1.0;
    if (s <= 60) return 0.85;
    if (s <= 80) return 0.70;
    return 0.55;
  });

  /** Score category label */
  scoreLabel = computed(() => {
    const s = this.projectedScore();
    if (s <= 20) return { text: 'NEURAL CLARITY', color: '#00ff88' };
    if (s <= 40) return { text: 'CONTROLLED', color: '#1D9E75' };
    if (s <= 60) return { text: 'ELEVATED', color: '#FAC775' };
    if (s <= 80) return { text: 'BRAIN FOG', color: '#E24B4A' };
    return { text: 'CRITICAL DRAIN', color: '#ff2244' };
  });

  /** Per-item score breakdown for visual display */
  scoreBreakdown = computed((): ScoreItem[] => {
    const items: ScoreItem[] = [];
    const sm = Math.floor(this.socialMediaMin() / 30) * 8;
    if (sm > 0) items.push({ label: 'Social Media', icon: '📱', penalty: sm, color: '#FAC775' });

    const rls = Math.floor(this.reelsMin() / 30) * 15;
    if (rls > 0) items.push({ label: 'Reels/Shorts', icon: '🎬', penalty: rls, color: '#E24B4A' });

    if (this.gamingMin() > 60) items.push({ label: 'Gaming (>1hr)', icon: '🎮', penalty: 12, color: '#F0997B' });

    const jf = this.junkFoodItems() * 5;
    if (jf > 0) items.push({ label: 'Junk Food', icon: '🍔', penalty: jf, color: '#FAC775' });

    const st = this.screenTimeHrs() > 4 ? 10 : this.screenTimeHrs() > 2 ? 5 : 0;
    if (st > 0) items.push({ label: 'Screen Time (>2h)', icon: '📺', penalty: st, color: '#b3aef0' });

    if (this.pornViewed()) items.push({ label: 'Adult Content', icon: '⚠️', penalty: 20, color: '#ff2244' });

    if (this.exerciseDone()) items.push({ label: 'Exercise ✓', icon: '💪', penalty: -20, color: '#1D9E75' });
    if (this.coldShower()) items.push({ label: 'Cold Shower ✓', icon: '🚿', penalty: -10, color: '#378ADD' });
    if (this.meditationDone()) items.push({ label: 'Meditation ✓', icon: '🧘', penalty: -8, color: '#5DCAA5' });

    return items;
  });

  /** Clean streak: consecutive days with load ≤ 30 */
  cleanStreak = computed(() => {
    const hist = [...this.history()].reverse(); // Most recent first
    let streak = 0;
    for (const log of hist) {
      if (log.dopamineScore <= 30) streak++;
      else break;
    }
    return streak;
  });

  /** Weekly average dopamine load */
  weeklyAvg = computed(() => {
    const last7 = this.history().slice(-7);
    if (!last7.length) return 0;
    return Math.round(last7.reduce((acc, l) => acc + l.dopamineScore, 0) / last7.length);
  });

  /** 7-day history for sparkline */
  last7Days = computed(() => this.history().slice(-7));

  /** Days saved this week (score <= 30) */
  weekCleanDays = computed(() => this.last7Days().filter(d => d.dopamineScore <= 30).length);

  /** Budget usage percentage (daily limit = 40) */
  budgetPct = computed(() => Math.min(100, Math.round((this.projectedScore() / 40) * 100)));

  readonly Math = Math; // expose for template

  constructor(private api: LifeOsService) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.api.getDopamineHistory(14).subscribe((res: DopamineLog[]) => {
      this.history.set(res.sort((a, b) => a.logDate.localeCompare(b.logDate)));

      const todayStr = new Date().toISOString().split('T')[0];
      const today = res.find((r: DopamineLog) => r.logDate === todayStr);

      if (today) {
        this.todayLog.set(today);
        this.socialMediaMin.set(today.socialMediaMin);
        this.reelsMin.set(today.reelsMin);
        this.gamingMin.set(today.gamingMin);
        this.junkFoodItems.set(today.junkFoodItems);
        this.pornViewed.set(today.pornViewed);
        this.exerciseDone.set(today.exerciseDone);
        this.coldShower.set(today.coldShower);
      }
    });
  }

  saveLog() {
    this.isSaving.set(true);
    const payload: DopamineLog = {
      logDate: new Date().toISOString().split('T')[0],
      socialMediaMin: this.socialMediaMin(),
      reelsMin: this.reelsMin(),
      gamingMin: this.gamingMin(),
      junkFoodItems: this.junkFoodItems(),
      pornViewed: this.pornViewed(),
      exerciseDone: this.exerciseDone(),
      coldShower: this.coldShower(),
      dopamineScore: 0,
      focusPct: 0
    };

    this.api.logDopamine(payload).subscribe({
      next: (res: DopamineLog) => {
        this.todayLog.set(res);
        this.isSaving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
        this.loadHistory();
      },
      error: () => this.isSaving.set(false)
    });
  }

  adjust(sig: any, amount: number, max: number = 999) {
    const current = sig();
    const next = Math.max(0, Math.min(max, current + amount));
    sig.set(next);
  }

  getBarColor(score: number): string {
    if (score <= 30) return '#1D9E75';
    if (score <= 60) return '#FAC775';
    return '#E24B4A';
  }

  getStreakIcon(): string {
    const s = this.cleanStreak();
    if (s >= 7) return '🔥';
    if (s >= 3) return '⚡';
    if (s >= 1) return '✅';
    return '💀';
  }
}
