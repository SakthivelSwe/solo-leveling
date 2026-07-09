import { Component, OnInit, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';
import { AiService } from '../../core/services/ai.service';
import { SseService } from '../../core/services/sse.service';
import { HeatmapDay, MonthlyReport, Title } from '../../core/models/models';
import { fadeInUp, listStagger } from '../../shared/animations';

@Component({
  selector: 'app-progress-report',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
}





