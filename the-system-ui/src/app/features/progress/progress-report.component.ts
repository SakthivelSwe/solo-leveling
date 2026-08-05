import { Component, OnInit, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';
import { AiService } from '../../core/services/ai.service';
import { SseService } from '../../core/services/sse.service';
import { HeatmapDay, MonthlyReport, Title, NoFapStatus, NetWorthLog, SleepEntry, WorkoutEntry, StatusWindow, DopamineLog } from '../../core/models/models';
import { LifeOsService } from '../../core/services/life-os.service';
import { fadeInUp, listStagger } from '../../shared/animations';
import { ProgressChartComponent } from './progress-chart.component';
import { ChartConfiguration, ChartData } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-progress-report',
  standalone: true,
  imports: [CommonModule, RouterLink, ProgressChartComponent, NgChartsModule],
  templateUrl: './progress-report.component.html',
  styleUrls: ['./progress-report.component.scss'],
  animations: [fadeInUp, listStagger],
})
export class ProgressReportComponent implements OnInit {
  report = signal<MonthlyReport | null>(null);
  heatmap = signal<HeatmapDay[]>([]);
  loading = signal(true);

  aiReview = signal<string>('');
  aiLoading = signal(false);

  titles = signal<Title[]>([]);
  equipping = signal<string | null>(null);

  // Unified Dashboard Signals
  status = signal<StatusWindow | null>(null);
  noFap = signal<NoFapStatus | null>(null);
  netWorth = signal<NetWorthLog[]>([]);
  sleep = signal<SleepEntry[]>([]);
  workouts = signal<WorkoutEntry[]>([]);
  dopamine = signal<DopamineLog[]>([]);

  // Dopamine Chart
  dopaChartData: ChartData<'line'> | undefined;
  dopaChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    scales: { y: { display: false, min: 0 }, x: { display: false } },
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    elements: { line: { tension: 0.4 }, point: { radius: 2, hoverRadius: 4 } }
  };

  // Computed Stats
  syncRate = computed(() => {
    const r = this.report();
    if (!r) return 0;
    if (r.daysElapsed === 0) return 100;
    
    let base = (r.perfectDays / r.daysElapsed) * 100;
    
    const nf = this.noFap();
    if (nf && nf.currentStreak > 10) base += 5;
    
    const w = this.workouts();
    if (w.length > r.daysElapsed * 0.5) base += 5;
    
    return Math.min(100, Math.round(base));
  });

  sleepAvgStr = computed(() => {
    const logs = this.sleep();
    if (!logs.length) return '0h 0m';
    const sumMins = logs.slice(0, 7).reduce((acc, l) => {
      // Calculate minutes difference
      const d1 = new Date(l.bedtime);
      const d2 = new Date(l.wakeTime);
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return acc;
      let diff = (d2.getTime() - d1.getTime()) / 60000;
      if (diff < 0) diff += 24 * 60; // Cross-midnight
      return acc + diff;
    }, 0);
    const avg = sumMins / Math.min(logs.length, 7);
    return `${Math.floor(avg / 60)}h ${Math.round(avg % 60)}m`;
  });

  workoutCountThisMonth = computed(() => {
    const logs = this.workouts();
    const now = new Date();
    return logs.filter(l => {
      const d = new Date(l.workoutDate || '');
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  });

  netWorthChange = computed(() => {
    const logs = this.netWorth();
    if (logs.length < 2) return 0;
    // Sorted by date descending usually
    return logs[0].netWorth - logs[logs.length - 1].netWorth;
  });

  /** Heatmap cells padded at the front so the first column aligns to the weekday (Sun start). */
  cells = computed<(HeatmapDay | null)[]>(() => {
    const days = this.heatmap();
    if (!days.length) return [];
    const firstWeekday = new Date(days[0].date + 'T00:00:00').getDay(); // 0=Sun
    return [...Array(firstWeekday).fill(null), ...days];
  });

  totalDays = computed(() => this.heatmap().filter(d => d.count > 0).length);

  constructor(
    private playerService: PlayerService,
    private ai: AiService,
    public sse: SseService,
    private lifeOs: LifeOsService
  ) {
    // Live: refresh analytics when a real-time player-update arrives.
    let last = 0;
    effect(() => {
      const tick = this.sse.playerTick();
      if (tick !== last && tick > 0 && !this.loading()) { last = tick; this.load(); }
      else { last = tick; }
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.playerService.getMonthlyReport().subscribe({
      next: r => this.report.set(r),
      error: () => {},
    });
    this.playerService.getHeatmap(126).subscribe({
      next: h => { this.heatmap.set(h); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.playerService.getTitles().subscribe({
      next: t => this.titles.set(t),
      error: () => {},
    });

    this.status.set(this.playerService.getCachedStatus());

    this.lifeOs.getNoFapStatus().subscribe({ next: v => this.noFap.set(v), error: () => {} });
    this.lifeOs.getNetWorthHistory().subscribe({ next: v => this.netWorth.set(v), error: () => {} });
    this.lifeOs.sleepHistory().subscribe({ next: v => this.sleep.set(v), error: () => {} });
    this.lifeOs.workoutHistory().subscribe({ next: v => this.workouts.set(v), error: () => {} });
    this.lifeOs.getDopamineHistory().subscribe({ 
      next: v => { 
        this.dopamine.set(v); 
        this.updateDopaChart(v);
      }, 
      error: () => {} 
    });
  }

  updateDopaChart(logs: DopamineLog[]): void {
    if (!logs || !logs.length) { this.dopaChartData = undefined; return; }
    const sorted = [...logs].reverse();
    this.dopaChartData = {
      labels: sorted.map(d => d.logDate?.substring(5, 10) || ''),
      datasets: [
        { data: sorted.map(d => d.dopamineScore || 0), label: 'Dopamine Score', borderColor: '#FAC775', backgroundColor: 'rgba(250, 199, 117, 0.1)', fill: true }
      ]
    };
  }

  intensityColor(level: number): string {
    switch (level) {
      case 1: return '#2e2a5e';
      case 2: return '#4b3fa0';
      case 3: return '#1D9E75';
      case 4: return '#FAC775';
      default: return '#14142a';
    }
  }

  tooltip(cell: HeatmapDay | null): string {
    if (!cell) return '';
    return `${cell.date} · ${cell.count} quest${cell.count === 1 ? '' : 's'} · ${cell.xp} XP`;
  }

  activeRatioPct(): number {
    const r = this.report();
    if (!r || r.daysElapsed === 0) return 0;
    return Math.round((r.daysActive / r.daysElapsed) * 100);
  }

  generateReview(): void {
    this.aiLoading.set(true);
    this.ai.getWeeklyReview().subscribe({
      next: r => { this.aiReview.set(r.review); this.aiLoading.set(false); },
      error: () => { this.aiReview.set('The System is unreachable. Try again shortly.'); this.aiLoading.set(false); },
    });
  }

  equip(t: Title): void {
    if (!t.unlocked || t.equipped) return;
    this.equipping.set(t.key);
    this.playerService.equipTitle(t.key).subscribe({
      next: list => { this.titles.set(list); this.equipping.set(null); },
      error: () => this.equipping.set(null),
    });
  }

  // ── Radar / Spider Chart ─────────────────────────────────────────────────
  private readonly RADAR_KEYS = ['str', 'intelligence', 'vit', 'agi', 'per', 'dis'];
  private readonly RADAR_LABELS_MAP = ['STR', 'INT', 'VIT', 'AGI', 'PER', 'DIS'];
  private readonly RADAR_COLORS = ['#ff6b6b', '#4fc3f7', '#1D9E75', '#FAC775', '#b366ff', '#E24B4A'];

  hexPoints(cx: number, cy: number, r: number): string {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
  }

  axisPoints(cx: number, cy: number, r: number): { x: number; y: number }[] {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
  }

  get radarPoints(): string {
    return this.RADAR_KEYS.map((key, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const pct = Math.min(100, (this.status()?.stats as any)?.[key] ?? 0) / 100;
      const radius = pct * 80;
      return `${110 + radius * Math.cos(angle)},${110 + radius * Math.sin(angle)}`;
    }).join(' ');
  }

  get radarDots(): { x: number; y: number; color: string }[] {
    return this.RADAR_KEYS.map((key, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const pct = Math.min(100, (this.status()?.stats as any)?.[key] ?? 0) / 100;
      const radius = pct * 80;
      return { x: 110 + radius * Math.cos(angle), y: 110 + radius * Math.sin(angle), color: this.RADAR_COLORS[i] };
    });
  }

  get radarLabels(): { x: number; y: number; text: string; color: string }[] {
    return this.RADAR_KEYS.map((key, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const radius = 97;
      return {
        x: 110 + radius * Math.cos(angle),
        y: 110 + radius * Math.sin(angle),
        text: this.RADAR_LABELS_MAP[i],
        color: this.RADAR_COLORS[i]
      };
    });
  }
}
