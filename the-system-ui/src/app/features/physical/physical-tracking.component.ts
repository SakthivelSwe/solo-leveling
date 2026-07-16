import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BodyMetricsComponent } from './body-metrics.component';
import { SleepTrackerComponent } from './sleep-tracker.component';
import { MoodTrendComponent } from './mood-trend.component';
import { WorkoutLoggerComponent } from './workout-logger.component';

type Tab = 'body' | 'sleep' | 'mood' | 'workout';

@Component({
  selector: 'app-physical-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink, BodyMetricsComponent, SleepTrackerComponent, MoodTrendComponent, WorkoutLoggerComponent],
  template: `
  <div class="pt-shell">
    <header class="pt-topbar">
      <a class="back tech" routerLink="/system" aria-label="Back to dashboard">‹ BACK</a>
      <h1 class="mono">💪 PHYSICAL TRACKING</h1>
      <span class="spacer"></span>
    </header>

    <nav class="pt-tabs tech" role="tablist">
      <button role="tab" [class.active]="tab()==='body'"    (click)="tab.set('body')">⚖ BODY</button>
      <button role="tab" [class.active]="tab()==='workout'" (click)="tab.set('workout')">🏋 LIFT</button>
      <button role="tab" [class.active]="tab()==='sleep'"   (click)="tab.set('sleep')">🌙 SLEEP</button>
      <button role="tab" [class.active]="tab()==='mood'"    (click)="tab.set('mood')">🧠 MOOD</button>
    </nav>

    <div class="pt-body">
      <app-body-metrics   *ngIf="tab()==='body'"></app-body-metrics>
      <app-workout-logger *ngIf="tab()==='workout'"></app-workout-logger>
      <app-sleep-tracker  *ngIf="tab()==='sleep'"></app-sleep-tracker>
      <app-mood-trend     *ngIf="tab()==='mood'"></app-mood-trend>
    </div>
  </div>
  `,
  styles: [`
  :host { display: block; }
  .pt-shell { max-width: 760px; margin: 0 auto; padding: 20px 16px 40px; }
  .pt-topbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .pt-topbar h1 { margin: 0; font-size: .9rem; letter-spacing: 3px; color: var(--text-primary); flex: 1; text-align: center; }
  .pt-topbar .back { text-decoration: none; color: var(--text-secondary); font-size: .72rem; letter-spacing: 1.5px; border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; }
  .pt-topbar .back:hover { color: var(--text-primary); border-color: var(--accent-purple); }
  .pt-topbar .spacer { width: 62px; }
  .pt-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
  .pt-tabs button {
    flex: 1; cursor: pointer; padding: 11px 6px; border-radius: 10px;
    border: 1px solid var(--border); background: none; color: var(--text-secondary);
    font-family: 'Rajdhani', sans-serif; font-size: .72rem; letter-spacing: 1.5px; transition: all .2s;
  }
  .pt-tabs button.active { border-color: rgba(108,99,255,0.6); background: rgba(108,99,255,0.14); color: #b3aef0; }
  .pt-body { display: block; }
  @media (max-width: 400px) { .pt-shell { padding-left: 12px; padding-right: 12px; } }
  `],
})
export class PhysicalTrackingComponent {
  tab = signal<Tab>('body');
}

