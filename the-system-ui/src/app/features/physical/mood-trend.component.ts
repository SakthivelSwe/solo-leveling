import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { LifeOsService } from '../../core/services/life-os.service';
import { MoodPoint } from '../../core/models/models';

@Component({
  selector: 'app-mood-trend',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  template: `
  <section class="pt-card system-card">
    <div class="pt-head">
      <h3 class="mono">🧠 MOOD TREND</h3>
      <span class="tech sub">LAST 30 DAYS</span>
    </div>

    <div class="pt-stats tech" *ngIf="points().length">
      <div><span class="lbl">AVG MOOD</span><b>{{ avg().toFixed(1) }}/10</b></div>
      <div><span class="lbl">LOGGED DAYS</span><b>{{ points().length }}</b></div>
      <div><span class="lbl">TREND</span>
        <b [class.up]="slope() > 0" [class.down]="slope() < 0">
          {{ slope() > 0 ? '↗ RISING' : (slope() < 0 ? '↘ DIPPING' : '→ STEADY') }}
        </b>
      </div>
    </div>

    <div class="chart-box" *ngIf="points().length > 1; else empty">
      <canvas baseChart [type]="'line'" [data]="chartData" [options]="options"></canvas>
    </div>
    <ng-template #empty>
      <p class="pt-empty tech">Log your mood in Mind OS for a few days to map your 30-day trend.</p>
    </ng-template>
  </section>
  `,
  styles: [`
  :host { display: block; }
  .pt-card { padding: 20px; }
  .pt-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 16px; }
  .pt-head h3 { margin: 0; font-size: .82rem; letter-spacing: 3px; color: var(--accent-teal); }
  .pt-head .sub { font-size: .6rem; letter-spacing: 2px; color: var(--text-dim); }
  .pt-stats { display: flex; gap: 22px; flex-wrap: wrap; margin-bottom: 12px; padding: 10px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .pt-stats > div { display: flex; flex-direction: column; gap: 2px; }
  .pt-stats .lbl { font-size: .56rem; letter-spacing: 1.5px; color: var(--text-dim); }
  .pt-stats b { font-size: .95rem; color: var(--text-primary); }
  .pt-stats b.up { color: var(--accent-teal); }
  .pt-stats b.down { color: var(--accent-red); }
  .chart-box { height: 240px; position: relative; }
  .pt-empty { text-align: center; color: var(--text-secondary); padding: 30px 0; font-size: .8rem; }
  `],
})
export class MoodTrendComponent implements OnInit {
  points = signal<MoodPoint[]>([]);

  chartData: ChartData<'line'> = { labels: [], datasets: [] };
  options: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0d0d1c', borderColor: '#534AB7', borderWidth: 1,
        titleColor: '#E6EDF3', bodyColor: '#9fd8f5', padding: 10,
        callbacks: { label: (ctx) => `Mood ${ctx.parsed.y}/10` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6E7681', font: { family: 'Rajdhani', size: 11 }, maxRotation: 0, autoSkipPadding: 16 } },
      y: { min: 0, max: 10, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6E7681', stepSize: 2, font: { family: 'Rajdhani' } } },
    },
  };

  constructor(private lifeOs: LifeOsService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.lifeOs.moodTrend(30).subscribe({
      next: (list) => { this.points.set(list); this.buildChart(); },
      error: () => {},
    });
  }

  avg(): number {
    const p = this.points();
    if (!p.length) return 0;
    return p.reduce((s, x) => s + x.mood, 0) / p.length;
  }

  /** Simple first-vs-last-half comparison to label the trend direction. */
  slope(): number {
    const p = this.points();
    if (p.length < 2) return 0;
    const mid = Math.floor(p.length / 2);
    const first = p.slice(0, mid);
    const second = p.slice(mid);
    const a = first.reduce((s, x) => s + x.mood, 0) / first.length;
    const b = second.reduce((s, x) => s + x.mood, 0) / second.length;
    return Math.round((b - a) * 10) / 10;
  }

  private buildChart(): void {
    const p = this.points();
    this.chartData = {
      labels: p.map(x => (x.date ?? '').slice(5)),
      datasets: [{
        data: p.map(x => Math.round(x.mood * 10) / 10),
        label: 'Mood',
        borderColor: '#1FBE8E',
        backgroundColor: 'rgba(31,190,142,0.14)',
        pointBackgroundColor: p.map(x => x.mood >= 7 ? '#1FBE8E' : (x.mood >= 4 ? '#FAC775' : '#E24B4A')),
        pointRadius: 3,
        borderWidth: 2,
        tension: 0.35,
        fill: true,
      }],
    };
  }
}

