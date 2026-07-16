import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LifeOsService } from '../../core/services/life-os.service';
import { SleepEntry } from '../../core/models/models';

@Component({
  selector: 'app-sleep-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  template: `
  <section class="pt-card system-card">
    <div class="pt-head"><h3 class="mono">🌙 SLEEP TRACKER</h3></div>

    <div class="pt-form">
      <label class="fld">
        <span class="tech">BEDTIME</span>
        <input class="fin" type="time" [(ngModel)]="bedtime" />
      </label>
      <label class="fld">
        <span class="tech">WAKE TIME</span>
        <input class="fin" type="time" [(ngModel)]="wakeTime" />
      </label>
      <label class="fld sm">
        <span class="tech">QUALITY 1–10</span>
        <input class="fin" type="number" min="1" max="10" [(ngModel)]="quality" placeholder="—" />
      </label>
      <button class="pt-save mono" (click)="save()" [disabled]="saving()">{{ saving() ? 'SAVING…' : 'LOG SLEEP' }}</button>
    </div>

    <p class="pt-preview tech" *ngIf="previewDuration() as d">
      ◈ That's <b>{{ d }}</b> of sleep.
    </p>

    <div class="pt-stats tech" *ngIf="history().length">
      <div><span class="lbl">LAST NIGHT</span><b>{{ fmt(history()[history().length-1].durationMinutes) }}</b></div>
      <div><span class="lbl">7-NIGHT AVG</span><b>{{ fmt(avgMinutes()) }}</b></div>
    </div>

    <div class="chart-box" *ngIf="history().length; else empty">
      <canvas baseChart [type]="'bar'" [data]="chartData" [options]="options"></canvas>
    </div>
    <ng-template #empty>
      <p class="pt-empty tech">Log your bed & wake times to build your sleep history.</p>
    </ng-template>
  </section>
  `,
  styles: [`
  :host { display: block; }
  .pt-card { padding: 20px; }
  .pt-head { margin-bottom: 16px; }
  .pt-head h3 { margin: 0; font-size: .82rem; letter-spacing: 3px; color: var(--accent-purple); }
  .pt-form { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 10px; }
  .fld { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 110px; }
  .fld.sm { max-width: 110px; flex: 0 0 auto; }
  .fld span { font-size: .62rem; letter-spacing: 1.5px; color: var(--text-secondary); }
  .fin { background: rgba(6,6,16,0.9); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); padding: 9px 12px; font-family: inherit; font-size: .82rem; color-scheme: dark; }
  .fin:focus { outline: none; border-color: var(--accent-purple); }
  .pt-save { cursor: pointer; border: 1px solid var(--accent-purple); border-radius: 8px; background: rgba(108,99,255,0.12); color: #b3aef0; padding: 10px 16px; font-size: .72rem; letter-spacing: 2px; white-space: nowrap; }
  .pt-save:disabled { opacity: .5; cursor: not-allowed; }
  .pt-preview { font-size: .78rem; color: var(--text-secondary); margin: 0 0 12px; }
  .pt-preview b { color: var(--accent-gold); }
  .pt-stats { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 12px; padding: 10px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .pt-stats > div { display: flex; flex-direction: column; gap: 2px; }
  .pt-stats .lbl { font-size: .56rem; letter-spacing: 1.5px; color: var(--text-dim); }
  .pt-stats b { font-size: .95rem; color: var(--text-primary); }
  .chart-box { height: 220px; position: relative; }
  .pt-empty { text-align: center; color: var(--text-secondary); padding: 30px 0; font-size: .8rem; }
  `],
})
export class SleepTrackerComponent implements OnInit {
  history = signal<SleepEntry[]>([]);
  saving = signal(false);

  bedtime = '23:00';
  wakeTime = '07:00';
  quality: number | null = null;

  chartData: ChartData<'bar'> = { labels: [], datasets: [] };
  options: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0d0d1c', borderColor: '#534AB7', borderWidth: 1,
        titleColor: '#E6EDF3', bodyColor: '#9fd8f5', padding: 10,
        callbacks: { label: (ctx) => this.fmt((ctx.parsed.y as number) * 60) },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6E7681', font: { family: 'Rajdhani', size: 11 }, maxRotation: 0, autoSkipPadding: 12 } },
      y: { beginAtZero: true, suggestedMax: 10, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6E7681', stepSize: 2, font: { family: 'Rajdhani' }, callback: (v) => `${v}h` } },
    },
  };

  constructor(private lifeOs: LifeOsService, private snack: MatSnackBar) {
    Chart.register(...registerables);
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.lifeOs.sleepHistory().subscribe({
      next: (list) => { this.history.set(list); this.buildChart(); },
      error: () => {},
    });
  }

  /** Minutes between the current bedtime/wake inputs, handling midnight. */
  previewDuration(): string | null {
    const m = this.durationBetween(this.bedtime, this.wakeTime);
    return m > 0 ? this.fmt(m) : null;
  }

  private durationBetween(bed: string, wake: string): number {
    if (!bed || !wake) return 0;
    const [bh, bm] = bed.split(':').map(Number);
    const [wh, wm] = wake.split(':').map(Number);
    let mins = (wh * 60 + wm) - (bh * 60 + bm);
    if (mins <= 0) mins += 24 * 60;
    return mins;
  }

  avgMinutes(): number {
    const last7 = this.history().slice(-7);
    if (!last7.length) return 0;
    return Math.round(last7.reduce((s, e) => s + e.durationMinutes, 0) / last7.length);
  }

  fmt(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }

  save(): void {
    if (!this.bedtime || !this.wakeTime) {
      this.snack.open('Set both bed and wake times.', '✕', { duration: 2500, panelClass: 'system-snack' });
      return;
    }
    this.saving.set(true);
    this.lifeOs.logSleep({ bedtime: this.bedtime, wakeTime: this.wakeTime, quality: this.quality }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('◈ SLEEP LOGGED', '✕', { duration: 2500, panelClass: 'system-snack' });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.snack.open('⚠ Failed to save.', '✕', { duration: 2500, panelClass: 'system-snack-warn' });
      },
    });
  }

  private buildChart(): void {
    const h = this.history();
    const labels = h.map(e => (e.date ?? '').slice(5)); // MM-DD
    const data = h.map(e => Math.round((e.durationMinutes / 60) * 10) / 10);
    const colors = data.map(v => v >= 7 ? '#1D9E75' : (v >= 6 ? '#FAC775' : '#E24B4A'));
    this.chartData = {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.72,
      }],
    };
  }
}

