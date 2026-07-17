import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { PlayerService } from '../../core/services/player.service';
import { LifeOsService } from '../../core/services/life-os.service';
import { StatusWindow, LeetcodeStats, LeetcodeLog } from '../../core/models/models';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, RouterLink, NgChartsModule],
  template: `
  <div class="st-shell">
    <header class="st-topbar">
      <a class="back tech" routerLink="/system">‹ BACK</a>
      <h1 class="mono">📊 STATISTICS DEEP-DIVE</h1>
      <span class="spacer"></span>
    </header>

    <!-- Summary cards -->
    <div class="st-cards" *ngIf="status() as s">
      <div class="st-card system-card"><span class="lbl tech">RANK</span><b class="mono">{{ s.player.rankLevel }}</b></div>
      <div class="st-card system-card"><span class="lbl tech">LEVEL</span><b class="mono">{{ s.player.level }}</b></div>
      <div class="st-card system-card"><span class="lbl tech">TOTAL XP</span><b class="mono">{{ s.player.totalXp | number }}</b></div>
      <div class="st-card system-card"><span class="lbl tech">LEETCODE</span><b class="mono">{{ leet()?.total ?? 0 }}</b></div>
    </div>

    <!-- Attribute radar -->
    <section class="st-block system-card">
      <h3 class="mono">◈ ATTRIBUTE BREAKDOWN</h3>
      <p class="tech sub">STR vs INT vs VIT vs AGI vs PER vs HOR</p>
      <div class="chart-box radar"><canvas baseChart [type]="'radar'" [data]="radarData" [options]="radarOpts"></canvas></div>
    </section>

    <div class="st-two">
      <!-- LeetCode difficulty -->
      <section class="st-block system-card">
        <h3 class="mono">◈ LEETCODE MIX</h3>
        <p class="tech sub">By difficulty</p>
        <div class="chart-box donut" *ngIf="(leet()?.total ?? 0) > 0; else noLeet">
          <canvas baseChart [type]="'doughnut'" [data]="donutData" [options]="donutOpts"></canvas>
        </div>
        <ng-template #noLeet><p class="st-empty tech">Log LeetCode problems in Career OS.</p></ng-template>
      </section>

      <!-- LeetCode cumulative -->
      <section class="st-block system-card">
        <h3 class="mono">◈ SOLVE TREND</h3>
        <p class="tech sub">Cumulative problems solved</p>
        <div class="chart-box line" *ngIf="lcPoints() > 1; else noTrend">
          <canvas baseChart [type]="'line'" [data]="lineData" [options]="lineOpts"></canvas>
        </div>
        <ng-template #noTrend><p class="st-empty tech">Not enough history yet.</p></ng-template>
      </section>
    </div>
  </div>
  `,
  styles: [`
  :host { display: block; }
  .st-shell { max-width: 900px; margin: 0 auto; padding: max(env(safe-area-inset-top, 20px), 20px) 16px 48px; }
  .st-topbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .st-topbar h1 { margin: 0; flex: 1; text-align: center; font-size: .88rem; letter-spacing: 2px; color: var(--text-primary); }
  .st-topbar .back { text-decoration: none; color: var(--text-secondary); font-size: .72rem; letter-spacing: 1.5px; border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; }
  .st-topbar .spacer { width: 62px; }
  .st-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
  .st-card { padding: 14px 10px; text-align: center; display: flex; flex-direction: column; gap: 6px; }
  .st-card .lbl { font-size: .54rem; letter-spacing: 1.5px; color: var(--text-dim); }
  .st-card b { font-size: 1.15rem; color: var(--accent-gold); }
  .st-block { padding: 20px; margin-bottom: 16px; }
  .st-block h3 { margin: 0; font-size: .8rem; letter-spacing: 3px; color: var(--accent-purple); }
  .st-block .sub { margin: 4px 0 14px; font-size: .64rem; color: var(--text-secondary); letter-spacing: 1px; }
  .chart-box { position: relative; }
  .chart-box.radar { height: 300px; }
  .chart-box.donut { height: 240px; }
  .chart-box.line { height: 240px; }
  .st-two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .st-empty { text-align: center; color: var(--text-secondary); padding: 40px 0; font-size: .78rem; }
  @media (max-width: 640px) {
    .st-cards { grid-template-columns: repeat(2, 1fr); }
    .st-two { grid-template-columns: 1fr; }
  }
  `],
})
export class StatisticsComponent implements OnInit {
  status = signal<StatusWindow | null>(null);
  leet = signal<LeetcodeStats | null>(null);
  lcPoints = signal(0);

  radarData: ChartData<'radar'> = { labels: [], datasets: [] };
  radarOpts: ChartConfiguration<'radar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        angleLines: { color: 'rgba(255,255,255,0.08)' },
        grid: { color: 'rgba(255,255,255,0.08)' },
        pointLabels: { color: '#9fb0c3', font: { family: 'Rajdhani', size: 12 } },
        ticks: { color: '#6E7681', backdropColor: 'transparent', showLabelBackdrop: false },
        beginAtZero: true,
      },
    },
  };

  donutData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  donutOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '62%',
    plugins: { legend: { position: 'bottom', labels: { color: '#9fb0c3', font: { family: 'Rajdhani' } } } },
  };

  lineData: ChartData<'line'> = { labels: [], datasets: [] };
  lineOpts: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6E7681', font: { family: 'Rajdhani', size: 11 }, maxRotation: 0, autoSkipPadding: 16 } },
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6E7681', font: { family: 'Rajdhani' } } },
    },
  };

  constructor(private players: PlayerService, private lifeOs: LifeOsService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.players.getStatus().subscribe({
      next: (s) => { this.status.set(s); this.buildRadar(s); },
      error: () => {},
    });
    this.lifeOs.leetcodeStats().subscribe({
      next: (st) => { this.leet.set(st); this.buildDonut(st); },
      error: () => {},
    });
    this.lifeOs.leetcodeHistory().subscribe({
      next: (h) => this.buildLine(h),
      error: () => {},
    });
  }

  private buildRadar(s: StatusWindow): void {
    const st = s.stats;
    this.radarData = {
      labels: ['STR', 'INT', 'VIT', 'AGI', 'PER', 'HOR'],
      datasets: [{
        data: [st.str, st.intelligence, st.vit, st.agi, st.per, st.hor],
        label: 'Attributes',
        borderColor: '#6C63FF',
        backgroundColor: 'rgba(108,99,255,0.22)',
        pointBackgroundColor: '#FAC775',
        borderWidth: 2,
      }],
    };
  }

  private buildDonut(st: LeetcodeStats): void {
    this.donutData = {
      labels: ['Easy', 'Medium', 'Hard'],
      datasets: [{
        data: [st.easy, st.medium, st.hard],
        backgroundColor: ['#1FBE8E', '#FAC775', '#E24B4A'],
        borderColor: '#0d0d1c',
        borderWidth: 2,
      }],
    };
  }

  private buildLine(history: LeetcodeLog[]): void {
    const dated = history
      .filter(l => !!l.solvedDate)
      .sort((a, b) => (a.solvedDate! < b.solvedDate! ? -1 : 1));
    this.lcPoints.set(dated.length);
    let running = 0;
    const labels: string[] = [];
    const data: number[] = [];
    for (const l of dated) {
      running++;
      labels.push((l.solvedDate ?? '').slice(5));
      data.push(running);
    }
    this.lineData = {
      labels,
      datasets: [{
        data,
        label: 'Solved',
        borderColor: '#4fc3f7',
        backgroundColor: 'rgba(79,195,247,0.14)',
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      }],
    };
  }
}

