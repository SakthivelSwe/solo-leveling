import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DayProgress } from '../../core/models/models';

@Component({
  selector: 'app-progress-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './progress-chart.component.html',
  styleUrls: ['./progress-chart.component.scss'],
})
export class ProgressChartComponent implements OnChanges {
  @Input({ required: true }) weekly: DayProgress[] = [];

  barData: ChartData<'bar'> = { labels: [], datasets: [] };

  options: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0d0d1c',
        borderColor: '#534AB7',
        borderWidth: 1,
        titleColor: '#E6EDF3',
        bodyColor: '#9fd8f5',
        padding: 10,
        callbacks: {
          label: (ctx) => `${ctx.parsed.y} quests · ${this.weekly[ctx.dataIndex]?.xpEarned ?? 0} XP`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6E7681', font: { family: 'Rajdhani', size: 12 } },
        border: { color: '#1a1a2c' },
      },
      y: {
        beginAtZero: true,
        suggestedMax: 10,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#6E7681', stepSize: 2, font: { family: 'Rajdhani' } },
        border: { color: '#1a1a2c' },
      },
    },
  };

  ngOnChanges(): void {
    this.buildChart();
  }

  private buildChart(): void {
    const labels = this.weekly.map(d => d.dayLabel);
    const data = this.weekly.map(d => d.questsCompleted);
    const colors = this.weekly.map(d => {
      if (d.isToday) return '#D85A30';
      return d.questsCompleted >= 8 ? '#1D9E75' : '#85B7EB';
    });

    this.barData = {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        hoverBackgroundColor: colors.map(c => c),
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.62,
        categoryPercentage: 0.7,
      }],
    };
  }

  get totalWeekXp(): number {
    return this.weekly.reduce((s, d) => s + d.xpEarned, 0);
  }
  get totalWeekQuests(): number {
    return this.weekly.reduce((s, d) => s + d.questsCompleted, 0);
  }
}


