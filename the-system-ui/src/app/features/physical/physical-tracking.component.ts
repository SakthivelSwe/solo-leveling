import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LifeOsService } from '../../core/services/life-os.service';
import { WorkoutEntry } from '../../core/models/models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-physical-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="pt-shell">
    <header class="pt-topbar">
      <a class="back tech" routerLink="/system" aria-label="Back to dashboard">‹ BACK</a>
      <h1 class="mono">🔥 HUNTER TRAINING</h1>
      <span class="spacer"></span>
    </header>

    <div class="intro system-card">
      <h3 class="mono">◈ COURAGE OF THE WEAK</h3>
      <p class="tech">The System demands daily physical conditioning. Failure to complete this quest will result in penalties. No gym required—only your resolve.</p>
    </div>

    <!-- Daily Progress Grid -->
    <div class="training-grid">
      
      <!-- PUSH-UPS -->
      <div class="training-card" [class.completed]="pushupsToday() >= 100">
        <div class="t-head">
          <span class="t-icon">💪</span>
          <span class="t-title mono">PUSH-UPS</span>
        </div>
        <div class="t-progress">
          <div class="ring-bg"></div>
          <div class="ring-fill" [style.width]="(pushupsToday() / 100 * 100 | number:'1.0-0') + '%'"></div>
          <span class="t-count mono">{{ pushupsToday() }} <span class="t-max">/ 100</span></span>
        </div>
        <div class="t-actions">
          <button class="t-btn" (click)="logReps('Push-ups', 10)" [disabled]="saving()">+10</button>
          <button class="t-btn" (click)="logReps('Push-ups', 25)" [disabled]="saving()">+25</button>
        </div>
      </div>

      <!-- SIT-UPS -->
      <div class="training-card" [class.completed]="situpsToday() >= 100">
        <div class="t-head">
          <span class="t-icon">🪨</span>
          <span class="t-title mono">SIT-UPS</span>
        </div>
        <div class="t-progress">
          <div class="ring-bg"></div>
          <div class="ring-fill" [style.width]="(situpsToday() / 100 * 100 | number:'1.0-0') + '%'"></div>
          <span class="t-count mono">{{ situpsToday() }} <span class="t-max">/ 100</span></span>
        </div>
        <div class="t-actions">
          <button class="t-btn" (click)="logReps('Sit-ups', 10)" [disabled]="saving()">+10</button>
          <button class="t-btn" (click)="logReps('Sit-ups', 25)" [disabled]="saving()">+25</button>
        </div>
      </div>

      <!-- SQUATS -->
      <div class="training-card" [class.completed]="squatsToday() >= 100">
        <div class="t-head">
          <span class="t-icon">🦵</span>
          <span class="t-title mono">SQUATS</span>
        </div>
        <div class="t-progress">
          <div class="ring-bg"></div>
          <div class="ring-fill" [style.width]="(squatsToday() / 100 * 100 | number:'1.0-0') + '%'"></div>
          <span class="t-count mono">{{ squatsToday() }} <span class="t-max">/ 100</span></span>
        </div>
        <div class="t-actions">
          <button class="t-btn" (click)="logReps('Squats', 10)" [disabled]="saving()">+10</button>
          <button class="t-btn" (click)="logReps('Squats', 25)" [disabled]="saving()">+25</button>
        </div>
      </div>

      <!-- RUNNING -->
      <div class="training-card" [class.completed]="runKmToday() >= 10">
        <div class="t-head">
          <span class="t-icon">🏃</span>
          <span class="t-title mono">RUNNING</span>
        </div>
        <div class="t-progress">
          <div class="ring-bg"></div>
          <div class="ring-fill run-fill" [style.width]="(runKmToday() / 10 * 100 | number:'1.0-0') + '%'"></div>
          <span class="t-count mono">{{ runKmToday() | number:'1.0-1' }} <span class="t-max">/ 10 KM</span></span>
        </div>
        <div class="t-actions">
          <button class="t-btn" (click)="logRun(1)" [disabled]="saving()">+1 KM</button>
          <button class="t-btn" (click)="logRun(2.5)" [disabled]="saving()">+2.5 KM</button>
        </div>
      </div>

    </div>

    <!-- Lifetime Stats -->
    <div class="lifetime-stats system-card">
      <h3 class="mono">◈ LIFETIME RECORDS</h3>
      <div class="stat-row tech">
        <div><span class="slbl">TOTAL PUSH-UPS</span><span class="sval">{{ totalPushups() | number }}</span></div>
        <div><span class="slbl">TOTAL SIT-UPS</span><span class="sval">{{ totalSitups() | number }}</span></div>
        <div><span class="slbl">TOTAL SQUATS</span><span class="sval">{{ totalSquats() | number }}</span></div>
        <div><span class="slbl">TOTAL DISTANCE</span><span class="sval">{{ totalRun() | number:'1.0-1' }} KM</span></div>
      </div>
    </div>
  </div>
  `,
  styles: [`
  :host { display: block; }
  .pt-shell { max-width: 760px; margin: 0 auto; padding: max(env(safe-area-inset-top, 20px), 20px) 16px 60px; }
  .pt-topbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .pt-topbar h1 { margin: 0; font-size: .95rem; letter-spacing: 3px; color: var(--accent-red); flex: 1; text-align: center; text-shadow: 0 0 10px rgba(226,75,74,0.4); }
  .pt-topbar .back { text-decoration: none; color: var(--text-secondary); font-size: .72rem; letter-spacing: 1.5px; border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; }
  .pt-topbar .back:hover { color: var(--text-primary); border-color: var(--accent-purple); }
  .pt-topbar .spacer { width: 62px; }

  .intro { padding: 18px 20px; margin-bottom: 24px; border-color: rgba(226,75,74,0.3); background: linear-gradient(160deg, rgba(226,75,74,0.05), transparent); }
  .intro h3 { margin: 0 0 8px; color: #f09595; font-size: .85rem; letter-spacing: 3px; }
  .intro p { margin: 0; font-size: .76rem; color: var(--text-secondary); line-height: 1.5; }

  .training-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
  .training-card { 
    background: rgba(13,13,28,0.7); border: 1px solid var(--border); border-radius: 14px; 
    padding: 18px; display: flex; flex-direction: column; gap: 16px;
    transition: all 0.3s ease; position: relative; overflow: hidden;
  }
  .training-card.completed {
    border-color: rgba(29,158,117,0.5);
    background: linear-gradient(160deg, rgba(29,158,117,0.08), rgba(13,13,28,0.8));
    box-shadow: 0 0 20px rgba(29,158,117,0.1);
  }
  .training-card.completed::before {
    content: 'CLEARED'; position: absolute; top: -10px; right: -25px;
    background: #1D9E75; color: #fff; font-family: 'Rajdhani'; font-size: 0.55rem; font-weight: 800;
    padding: 20px 25px 4px; transform: rotate(45deg); letter-spacing: 2px;
  }

  .t-head { display: flex; align-items: center; gap: 8px; }
  .t-icon { font-size: 1.4rem; }
  .t-title { font-size: .85rem; letter-spacing: 2px; color: var(--text-primary); font-weight: 700; }

  .t-progress { position: relative; height: 36px; border-radius: 8px; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
  .ring-fill { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(90deg, rgba(226,75,74,0.6), #E24B4A); transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
  .run-fill { background: linear-gradient(90deg, rgba(83,74,183,0.6), #534AB7); }
  .training-card.completed .ring-fill, .training-card.completed .run-fill { background: linear-gradient(90deg, rgba(29,158,117,0.6), #1D9E75); }
  
  .t-count { position: relative; z-index: 2; font-size: 1.1rem; font-weight: 900; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }
  .t-max { font-size: 0.7rem; color: rgba(255,255,255,0.7); }

  .t-actions { display: flex; gap: 8px; }
  .t-btn { 
    flex: 1; padding: 10px 0; border-radius: 8px; border: 1px solid var(--border); 
    background: rgba(255,255,255,0.03); color: var(--text-primary); font-family: 'Rajdhani', sans-serif;
    font-size: .75rem; letter-spacing: 1px; font-weight: 700; cursor: pointer; transition: all 0.2s;
  }
  .t-btn:hover:not([disabled]) { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); transform: translateY(-1px); }
  .t-btn:active:not([disabled]) { transform: translateY(1px); }
  .t-btn[disabled] { opacity: 0.5; cursor: not-allowed; }

  .lifetime-stats { padding: 20px; }
  .lifetime-stats h3 { margin: 0 0 16px; color: var(--accent-gold); font-size: .8rem; letter-spacing: 3px; }
  .stat-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .stat-row > div { display: flex; flex-direction: column; gap: 4px; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; border: 1px solid rgba(255,255,255,0.03); }
  .slbl { font-size: .55rem; color: var(--text-secondary); letter-spacing: 1.5px; font-weight: 600; }
  .sval { font-size: 1.1rem; color: var(--text-primary); font-weight: 800; font-family: 'Orbitron', monospace; }

  @media (max-width: 600px) {
    .training-grid { grid-template-columns: 1fr; }
  }
  `]
})
export class PhysicalTrackingComponent implements OnInit {
  saving = signal(false);
  history = signal<WorkoutEntry[]>([]);

  // Derived signals for today's progress
  pushupsToday = computed(() => this.getTodayReps('Push-ups'));
  situpsToday = computed(() => this.getTodayReps('Sit-ups'));
  squatsToday = computed(() => this.getTodayReps('Squats'));
  runKmToday = computed(() => this.getTodayRun());

  // Derived signals for lifetime stats
  totalPushups = computed(() => this.getTotalReps('Push-ups'));
  totalSitups = computed(() => this.getTotalReps('Sit-ups'));
  totalSquats = computed(() => this.getTotalReps('Squats'));
  totalRun = computed(() => this.getTotalRun());

  constructor(private lifeOs: LifeOsService, private snack: MatSnackBar) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.lifeOs.workoutHistory().subscribe({
      next: data => this.history.set(data),
      error: err => console.error('Failed to load training history', err)
    });
  }

  logReps(exercise: string, reps: number) {
    this.saving.set(true);
    // We repurpose the gym WorkoutEntry to save Calisthenics reps!
    const entry: WorkoutEntry = { exerciseName: exercise, sets: 1, reps: reps, weightKg: 0 };
    
    this.lifeOs.logWorkout(entry).subscribe({
      next: (saved) => {
        this.history.update(h => [saved, ...h]);
        this.saving.set(false);
        this.snack.open(`+${reps} ${exercise} logged. Keep pushing.`, 'OK', { duration: 2000 });
      },
      error: (err) => {
        console.error(err);
        this.saving.set(false);
        this.snack.open('Failed to log training.', 'OK', { duration: 3000 });
      }
    });
  }

  logRun(km: number) {
    this.saving.set(true);
    // For running, we save distance (km) in the weightKg field for simplicity
    const entry: WorkoutEntry = { exerciseName: 'Running', sets: 1, reps: 1, weightKg: km };
    
    this.lifeOs.logWorkout(entry).subscribe({
      next: (saved) => {
        this.history.update(h => [saved, ...h]);
        this.saving.set(false);
        this.snack.open(`+${km} KM run logged.`, 'OK', { duration: 2000 });
      },
      error: (err) => {
        console.error(err);
        this.saving.set(false);
        this.snack.open('Failed to log run.', 'OK', { duration: 3000 });
      }
    });
  }

  // --- Helper Methods ---
  private getTodayReps(exercise: string): number {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.history()
      .filter(e => e.exerciseName === exercise && e.workoutDate === todayStr)
      .reduce((sum, e) => sum + (e.reps || 0), 0);
  }

  private getTodayRun(): number {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.history()
      .filter(e => e.exerciseName === 'Running' && e.workoutDate === todayStr)
      .reduce((sum, e) => sum + (e.weightKg || 0), 0);
  }

  private getTotalReps(exercise: string): number {
    return this.history()
      .filter(e => e.exerciseName === exercise)
      .reduce((sum, e) => sum + (e.reps || 0), 0);
  }

  private getTotalRun(): number {
    return this.history()
      .filter(e => e.exerciseName === 'Running')
      .reduce((sum, e) => sum + (e.weightKg || 0), 0);
  }
}
