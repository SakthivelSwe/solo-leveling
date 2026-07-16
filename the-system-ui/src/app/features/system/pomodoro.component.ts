import { Component, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LifeOsService } from '../../core/services/life-os.service';
import { HapticsService } from '../../core/services/haptics.service';

const RADIUS = 54;
const CIRC = 2 * Math.PI * RADIUS;

@Component({
  selector: 'app-pomodoro',
  standalone: true,
  imports: [CommonModule],
  template: `
  <section class="pomo system-card">
    <div class="pomo-head">
      <h3 class="mono">⏱ DEEP WORK</h3>
      <span class="tech sub" *ngIf="sessionsToday() > 0">◈ {{ sessionsToday() }} TODAY</span>
    </div>

    <div class="ring-wrap">
      <svg viewBox="0 0 128 128" class="ring" [class.running]="running()">
        <defs>
          <linearGradient id="pomoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stop-color="#4fc3f7" />
            <stop offset="60%" stop-color="#6C63FF" />
            <stop offset="100%" stop-color="#1FBE8E" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" [attr.r]="radius" class="track" />
        <circle cx="64" cy="64" [attr.r]="radius" class="prog"
                [attr.stroke-dasharray]="circ"
                [attr.stroke-dashoffset]="dashOffset()" />
      </svg>
      <div class="ring-center">
        <span class="time mono">{{ clock() }}</span>
        <span class="phase tech">{{ running() ? 'FOCUS' : (remaining() === 0 ? 'DONE' : 'READY') }}</span>
      </div>
    </div>

    <div class="presets tech" *ngIf="!running()">
      <button *ngFor="let p of presets" [class.active]="durationMin() === p" (click)="selectPreset(p)">{{ p }}m</button>
    </div>

    <div class="controls">
      <button class="ctl primary mono" (click)="toggle()">{{ running() ? '❚❚ PAUSE' : '▶ START' }}</button>
      <button class="ctl ghost tech" (click)="reset()" [disabled]="running() && remaining() === durationMin()*60">RESET</button>
    </div>
    <p class="pomo-note tech">Fell a focus block to log a Deep Work session (+focus XP).</p>
  </section>
  `,
  styles: [`
  :host { display: block; }
  .pomo { padding: 18px; text-align: center; }
  .pomo-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
  .pomo-head h3 { margin: 0; font-size: .8rem; letter-spacing: 3px; color: var(--accent-cyan); }
  .pomo-head .sub { font-size: .6rem; letter-spacing: 1.5px; color: var(--accent-teal); }
  .ring-wrap { position: relative; width: 180px; height: 180px; margin: 6px auto 14px; }
  .ring { width: 100%; height: 100%; transform: rotate(-90deg); }
  .ring .track { fill: none; stroke: rgba(255,255,255,0.06); stroke-width: 8; }
  .ring .prog {
    fill: none; stroke: url(#pomoGrad); stroke-width: 8; stroke-linecap: round;
    transition: stroke-dashoffset 1s linear;
    filter: drop-shadow(0 0 6px rgba(108,99,255,0.5));
  }
  .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
  .ring-center .time { font-size: 2rem; color: var(--text-primary); letter-spacing: 2px; }
  .ring-center .phase { font-size: .6rem; letter-spacing: 3px; color: var(--text-secondary); }
  .presets { display: flex; gap: 8px; justify-content: center; margin-bottom: 12px; }
  .presets button { cursor: pointer; border: 1px solid var(--border); background: none; color: var(--text-secondary); border-radius: 8px; padding: 6px 12px; font-size: .7rem; letter-spacing: 1px; }
  .presets button.active { border-color: rgba(79,195,247,0.6); background: rgba(79,195,247,0.14); color: var(--accent-cyan); }
  .controls { display: flex; gap: 10px; }
  .ctl { flex: 1; cursor: pointer; border-radius: 10px; padding: 11px; font-size: .74rem; letter-spacing: 2px; transition: all .2s; }
  .ctl.primary { border: 1px solid rgba(79,195,247,0.6); background: rgba(79,195,247,0.12); color: var(--accent-cyan); }
  .ctl.primary:hover { background: rgba(79,195,247,0.22); }
  .ctl.ghost { border: 1px solid var(--border); background: none; color: var(--text-secondary); }
  .ctl.ghost:disabled { opacity: .4; cursor: not-allowed; }
  .pomo-note { margin: 12px 0 0; font-size: .6rem; color: var(--text-dim); letter-spacing: .5px; }
  `],
})
export class PomodoroComponent implements OnDestroy {
  readonly presets = [25, 45, 90];
  readonly radius = RADIUS;
  readonly circ = CIRC;

  durationMin = signal(25);
  remaining = signal(25 * 60); // seconds
  running = signal(false);
  sessionsToday = signal(0);

  private handle: ReturnType<typeof setInterval> | null = null;

  constructor(
    private lifeOs: LifeOsService,
    private haptics: HapticsService,
    private snack: MatSnackBar,
  ) {}

  dashOffset = computed(() => {
    const total = this.durationMin() * 60;
    const frac = total > 0 ? this.remaining() / total : 0;
    return CIRC * (1 - frac);
  });

  clock = computed(() => {
    const s = this.remaining();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  });

  selectPreset(min: number): void {
    if (this.running()) return;
    this.durationMin.set(min);
    this.remaining.set(min * 60);
  }

  toggle(): void {
    this.running() ? this.pause() : this.start();
  }

  start(): void {
    if (this.running()) return;
    if (this.remaining() === 0) this.remaining.set(this.durationMin() * 60);
    this.running.set(true);
    this.handle = setInterval(() => {
      const next = this.remaining() - 1;
      if (next <= 0) {
        this.remaining.set(0);
        this.complete();
      } else {
        this.remaining.set(next);
      }
    }, 1000);
  }

  pause(): void {
    this.running.set(false);
    this.clearTimer();
  }

  reset(): void {
    this.pause();
    this.remaining.set(this.durationMin() * 60);
  }

  private complete(): void {
    this.pause();
    const minutes = this.durationMin();
    this.sessionsToday.update(n => n + 1);
    this.haptics.success();
    this.snack.open(`✅ FOCUS BLOCK COMPLETE — ${minutes} MIN LOGGED`, '✕', {
      duration: 4000, panelClass: 'system-snack',
    });
    // Log the Deep Work session so it counts toward focus XP + Career OS stats.
    this.lifeOs.logDeepWork({
      codingMinutes: minutes,
      interruptions: 0,
      mobilePickups: 0,
      focusSessions: 1,
    }).subscribe({ error: () => {} });
    this.remaining.set(minutes * 60);
  }

  private clearTimer(): void {
    if (this.handle) { clearInterval(this.handle); this.handle = null; }
  }

  ngOnDestroy(): void { this.clearTimer(); }
}

