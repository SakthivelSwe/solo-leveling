import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LifeOsService } from '../../core/services/life-os.service';
import { BodyMetric } from '../../core/models/models';

const KG_PER_LB = 0.45359237;

@Component({
  selector: 'app-body-metrics',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  template: `
  <section class="pt-card system-card">
    <div class="pt-head">
      <h3 class="mono">⚖ BODY METRICS</h3>
      <div class="unit-toggle tech">
        <button [class.active]="unit()==='kg'" (click)="setUnit('kg')">KG</button>
        <button [class.active]="unit()==='lb'" (click)="setUnit('lb')">LB</button>
      </div>
    </div>

    <div class="pt-form">
      <label class="fld">
        <span class="tech">WEIGHT ({{ unit() | uppercase }})</span>
        <input class="fin" type="number" step="0.1" min="0" [(ngModel)]="weightInput" placeholder="e.g. {{ unit()==='kg' ? '72.5' : '160' }}" />
      </label>
      <label class="fld">
        <span class="tech">BODY FAT %</span>
        <input class="fin" type="number" step="0.1" min="0" max="70" [(ngModel)]="bodyFatInput" placeholder="optional" />
      </label>
      <button class="pt-save mono" (click)="save()" [disabled]="saving()">{{ saving() ? 'SAVING…' : 'LOG TODAY' }}</button>
    </div>

    <div class="pt-stats tech" *ngIf="history().length">
      <div><span class="lbl">LATEST</span><b>{{ display(latest()?.weightKg) }} {{ unit() }}</b></div>
      <div><span class="lbl">CHANGE</span>
        <b [class.up]="change() > 0" [class.down]="change() < 0">
          {{ change() > 0 ? '+' : '' }}{{ change().toFixed(1) }} {{ unit() }}
        </b>
      </div>
      <div *ngIf="latest()?.bodyFatPct != null"><span class="lbl">BODY FAT</span><b>{{ latest()?.bodyFatPct }}%</b></div>
    </div>

    <div class="chart-box" *ngIf="history().length > 1; else empty">
      <canvas baseChart [type]="'line'" [data]="chartData" [options]="options"></canvas>
    </div>
    <ng-template #empty>
      <p class="pt-empty tech">Log your weight for a few days to see your trend graph.</p>
    </ng-template>
  </section>
  `,
  styles: [`
  :host { display: block; }
  .pt-card { padding: 20px; }
  .pt-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .pt-head h3 { margin: 0; font-size: .82rem; letter-spacing: 3px; color: var(--accent-gold); }
  .unit-toggle { display: flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  .unit-toggle button { background: none; border: none; color: var(--text-secondary); padding: 6px 12px; cursor: pointer; font-size: .7rem; letter-spacing: 1px; }
  .unit-toggle button.active { background: rgba(108,99,255,0.2); color: #b3aef0; }
  .pt-form { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 16px; }
  .fld { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 120px; }
  .fld span { font-size: .62rem; letter-spacing: 1.5px; color: var(--text-secondary); }
  .fin { background: rgba(6,6,16,0.9); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); padding: 9px 12px; font-family: inherit; font-size: .82rem; }
  .fin:focus { outline: none; border-color: var(--accent-purple); }
  .pt-save { cursor: pointer; border: 1px solid var(--accent-gold); border-radius: 8px; background: rgba(250,199,117,0.1); color: var(--accent-gold); padding: 10px 16px; font-size: .72rem; letter-spacing: 2px; white-space: nowrap; }
  .pt-save:disabled { opacity: .5; cursor: not-allowed; }
  .pt-stats { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 12px; padding: 10px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .pt-stats > div { display: flex; flex-direction: column; gap: 2px; }
  .pt-stats .lbl { font-size: .56rem; letter-spacing: 1.5px; color: var(--text-dim); }
  .pt-stats b { font-size: .95rem; color: var(--text-primary); }
  .pt-stats b.up { color: var(--accent-red); }
  .pt-stats b.down { color: var(--accent-teal); }
  .chart-box { height: 220px; position: relative; }
  .pt-empty { text-align: center; color: var(--text-secondary); padding: 30px 0; font-size: .8rem; }
  `],
})
export class BodyMetricsComponent implements OnInit {
  history = signal<BodyMetric[]>([]);
  unit = signal<'kg' | 'lb'>((localStorage.getItem('sys_weight_unit') as 'kg' | 'lb') ?? 'kg');
  saving = signal(false);

  weightInput: number | null = null;
  bodyFatInput: number | null = null;

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
        callbacks: { label: (ctx) => `${ctx.parsed.y} ${this.unit()}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6E7681', font: { family: 'Rajdhani', size: 11 }, maxRotation: 0, autoSkipPadding: 16 } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6E7681', font: { family: 'Rajdhani' } } },
    },
  };

  constructor(private lifeOs: LifeOsService, private snack: MatSnackBar) {
    Chart.register(...registerables);
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.lifeOs.bodyMetricHistory().subscribe({
      next: (list) => {
        // API returns most-recent first; reverse for a left-to-right chart.
        this.history.set([...list].reverse());
        this.buildChart();
        const today = this.history()[this.history().length - 1];
        if (today?.weightKg != null && !this.weightInput) this.weightInput = this.round(this.toDisplay(today.weightKg));
      },
      error: () => {},
    });
  }

  latest(): BodyMetric | undefined { return this.history()[this.history().length - 1]; }

  change(): number {
    const h = this.history();
    if (h.length < 2) return 0;
    const last = h[h.length - 1].weightKg;
    const first = h[0].weightKg;
    if (last == null || first == null) return 0;
    return this.toDisplay(last) - this.toDisplay(first);
  }

  display(kg?: number | null): string {
    if (kg == null) return '—';
    return this.round(this.toDisplay(kg)).toString();
  }

  setUnit(u: 'kg' | 'lb'): void {
    if (this.unit() === u) return;
    // Convert the in-progress input so the number stays the same weight.
    if (this.weightInput != null) {
      const kg = this.unit() === 'kg' ? this.weightInput : this.weightInput * KG_PER_LB;
      this.weightInput = this.round(u === 'kg' ? kg : kg / KG_PER_LB);
    }
    this.unit.set(u);
    localStorage.setItem('sys_weight_unit', u);
    this.buildChart();
  }

  save(): void {
    if (this.weightInput == null || this.weightInput <= 0) {
      this.snack.open('Enter a weight first.', '✕', { duration: 2500, panelClass: 'system-snack' });
      return;
    }
    const weightKg = this.unit() === 'kg' ? this.weightInput : this.weightInput * KG_PER_LB;
    this.saving.set(true);
    this.lifeOs.upsertBodyMetric({ weightKg: this.round(weightKg, 2), bodyFatPct: this.bodyFatInput }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('◈ BODY METRIC LOGGED', '✕', { duration: 2500, panelClass: 'system-snack' });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.snack.open('⚠ Failed to save.', '✕', { duration: 2500, panelClass: 'system-snack-warn' });
      },
    });
  }

  private toDisplay(kg: number): number { return this.unit() === 'kg' ? kg : kg / KG_PER_LB; }
  private round(n: number, dp = 1): number { const f = Math.pow(10, dp); return Math.round(n * f) / f; }

  private buildChart(): void {
    const h = this.history().filter(m => m.weightKg != null);
    const labels = h.map(m => (m.logDate ?? '').slice(5)); // MM-DD
    const data = h.map(m => this.round(this.toDisplay(m.weightKg!)));
    this.chartData = {
      labels,
      datasets: [{
        data,
        label: `Weight (${this.unit()})`,
        borderColor: '#FAC775',
        backgroundColor: 'rgba(250,199,117,0.12)',
        pointBackgroundColor: '#FAC775',
        pointRadius: 3,
        borderWidth: 2,
        tension: 0.35,
        fill: true,
      }],
    };
  }
}

