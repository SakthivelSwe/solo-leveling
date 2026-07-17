import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LifeOsService } from '../../core/services/life-os.service';
import { WorkoutEntry } from '../../core/models/models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-physical-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

    <!-- Dynamic Progress Grid -->
    <div class="training-grid">
      
      <div class="training-card" *ngFor="let ex of trackedExercises()" [class.completed]="getTodayProgress(ex) >= getGoal(ex)">
        <div class="t-head">
          <span class="t-icon">{{ getIcon(ex) }}</span>
          <span class="t-title mono">{{ ex | uppercase }}</span>
          <button class="t-remove" (click)="removeExercise(ex)" aria-label="Remove exercise">✕</button>
        </div>
        <div class="t-progress">
          <div class="ring-bg"></div>
          <div class="ring-fill" [class.run-fill]="isCardio(ex)" [style.width]="Math.min(100, (getTodayProgress(ex) / getGoal(ex) * 100)) + '%'"></div>
          <span class="t-count mono">{{ getTodayProgress(ex) | number: (isCardio(ex) ? '1.0-1' : '1.0-0') }} <span class="t-max">/ {{ getGoal(ex) }}{{ isCardio(ex) ? ' KM' : '' }}</span></span>
        </div>
        <div class="t-actions">
          <button class="t-btn" (click)="logCustom(ex, getInc1(ex))" [disabled]="saving()">+{{ getInc1(ex) }}{{ isCardio(ex) ? ' KM' : '' }}</button>
          <button class="t-btn" (click)="logCustom(ex, getInc2(ex))" [disabled]="saving()">+{{ getInc2(ex) }}{{ isCardio(ex) ? ' KM' : '' }}</button>
        </div>
      </div>

    </div>

    <!-- Add New Custom Exercise -->
    <div class="add-workout-box system-card">
      <h3 class="mono">◈ ADD CUSTOM WORKOUT</h3>
      <div class="add-row">
        <input type="text" class="fin" placeholder="E.g. Pull-ups, Planks, Swimming" [(ngModel)]="newWorkoutName" (keyup.enter)="addWorkout()" />
        <label class="chk tech">
          <input type="checkbox" [(ngModel)]="isNewCardio" /> Cardio (KM)
        </label>
        <button class="btn add-btn" (click)="addWorkout()">ADD</button>
      </div>
    </div>

    <!-- Lifetime Stats -->
    <div class="lifetime-stats system-card">
      <h3 class="mono">◈ LIFETIME RECORDS</h3>
      <div class="stat-row tech">
        <div *ngFor="let ex of trackedExercises()">
          <span class="slbl">TOTAL {{ ex | uppercase }}</span>
          <span class="sval">{{ getTotalProgress(ex) | number: (isCardio(ex) ? '1.0-1' : '1.0-0') }}{{ isCardio(ex) ? ' KM' : '' }}</span>
        </div>
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
  .t-title { font-size: .85rem; letter-spacing: 2px; color: var(--text-primary); font-weight: 700; flex: 1; }
  .t-remove { background: none; border: none; color: var(--text-secondary); font-size: 1rem; cursor: pointer; padding: 0 4px; margin-right: -4px; transition: color 0.2s; }
  .t-remove:hover { color: #E24B4A; }

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

  .add-workout-box { margin-bottom: 24px; padding: 20px; }
  .add-workout-box h3 { margin: 0 0 16px; color: var(--accent-purple); font-size: .8rem; letter-spacing: 3px; }
  .add-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .add-row .fin { flex: 1; min-width: 150px; background: rgba(0,0,0,0.3); }
  .add-row .chk { white-space: nowrap; margin-right: 8px; }
  .add-btn { white-space: nowrap; padding: 10px 24px; }

  .lifetime-stats { padding: 20px; }
  .lifetime-stats h3 { margin: 0 0 16px; color: var(--accent-gold); font-size: .8rem; letter-spacing: 3px; }
  .stat-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .stat-row > div { display: flex; flex-direction: column; gap: 4px; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; border: 1px solid rgba(255,255,255,0.03); }
  .slbl { font-size: .55rem; color: var(--text-secondary); letter-spacing: 1.5px; font-weight: 600; text-transform: uppercase; }
  .sval { font-size: 1.1rem; color: var(--text-primary); font-weight: 800; font-family: 'Orbitron', monospace; }

  @media (max-width: 600px) {
    .training-grid, .stat-row { grid-template-columns: 1fr; }
  }
  `]
})
export class PhysicalTrackingComponent implements OnInit {
  saving = signal(false);
  history = signal<WorkoutEntry[]>([]);
  Math = Math;

  // List of exercises the user has added to their dashboard
  trackedExercises = signal<string[]>([]);
  
  // A map to remember if a custom exercise is cardio-based
  cardioMap = signal<{ [key: string]: boolean }>({});

  newWorkoutName = '';
  isNewCardio = false;

  constructor(private lifeOs: LifeOsService, private snack: MatSnackBar) {}

  ngOnInit() {
    this.loadPreferences();
    this.loadHistory();
  }

  loadPreferences() {
    const saved = localStorage.getItem('lifeos.trackedWorkouts');
    const savedCardio = localStorage.getItem('lifeos.cardioMap');

    if (saved) {
      this.trackedExercises.set(JSON.parse(saved));
    } else {
      // Default Courage of the Weak setup
      this.trackedExercises.set(['Push-ups', 'Sit-ups', 'Squats', 'Running']);
    }

    if (savedCardio) {
      this.cardioMap.set(JSON.parse(savedCardio));
    } else {
      this.cardioMap.set({ 'Running': true, 'Swimming': true, 'Cycling': true });
    }
  }

  savePreferences() {
    localStorage.setItem('lifeos.trackedWorkouts', JSON.stringify(this.trackedExercises()));
    localStorage.setItem('lifeos.cardioMap', JSON.stringify(this.cardioMap()));
  }

  loadHistory() {
    this.lifeOs.workoutHistory().subscribe({
      next: data => this.history.set(data),
      error: err => console.error('Failed to load training history', err)
    });
  }

  addWorkout() {
    const name = this.newWorkoutName.trim();
    if (!name) return;
    
    // Capitalize first letter
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

    if (this.trackedExercises().includes(formattedName)) {
      this.snack.open('Exercise already exists.', 'OK', { duration: 2000 });
      return;
    }

    this.trackedExercises.update(list => [...list, formattedName]);
    this.cardioMap.update(map => ({ ...map, [formattedName]: this.isNewCardio }));
    this.savePreferences();

    this.newWorkoutName = '';
    this.isNewCardio = false;
    this.snack.open(`${formattedName} added to dashboard.`, 'OK', { duration: 2000 });
  }

  removeExercise(name: string) {
    if (confirm(`Remove ${name} from your dashboard? Your logged history will NOT be deleted.`)) {
      this.trackedExercises.update(list => list.filter(ex => ex !== name));
      this.savePreferences();
    }
  }

  logCustom(exercise: string, value: number) {
    this.saving.set(true);
    const cardio = this.isCardio(exercise);

    const entry: WorkoutEntry = { 
      exerciseName: exercise, 
      sets: 1, 
      reps: cardio ? 1 : value, 
      weightKg: cardio ? value : 0 
    };
    
    this.lifeOs.logWorkout(entry).subscribe({
      next: (saved) => {
        this.history.update(h => [saved, ...h]);
        this.saving.set(false);
        this.snack.open(`+${value} ${cardio ? 'KM' : 'reps'} of ${exercise} logged.`, 'OK', { duration: 2000 });
      },
      error: (err) => {
        console.error(err);
        this.saving.set(false);
        this.snack.open('Failed to log training.', 'OK', { duration: 3000 });
      }
    });
  }

  // --- Dynamic Configuration Helpers ---

  getIcon(ex: string): string {
    const l = ex.toLowerCase();
    if (l.includes('push')) return '💪';
    if (l.includes('sit')) return '🪨';
    if (l.includes('squat')) return '🦵';
    if (l.includes('run') || l.includes('jog')) return '🏃';
    if (l.includes('swim')) return '🏊';
    if (l.includes('cycle') || l.includes('bike')) return '🚴';
    if (l.includes('pull')) return '🧗';
    return '⚡';
  }

  isCardio(ex: string): boolean {
    return !!this.cardioMap()[ex];
  }

  getGoal(ex: string): number {
    return this.isCardio(ex) ? 10 : 100;
  }

  getInc1(ex: string): number {
    return this.isCardio(ex) ? 1 : 10;
  }

  getInc2(ex: string): number {
    return this.isCardio(ex) ? 2.5 : 25;
  }

  // --- Data Access Helpers ---

  getTodayProgress(exercise: string): number {
    const todayStr = new Date().toISOString().split('T')[0];
    const isCardio = this.isCardio(exercise);

    return this.history()
      .filter(e => e.exerciseName === exercise && e.workoutDate === todayStr)
      .reduce((sum, e) => sum + (isCardio ? (e.weightKg || 0) : (e.reps || 0)), 0);
  }

  getTotalProgress(exercise: string): number {
    const isCardio = this.isCardio(exercise);

    return this.history()
      .filter(e => e.exerciseName === exercise)
      .reduce((sum, e) => sum + (isCardio ? (e.weightKg || 0) : (e.reps || 0)), 0);
  }
}
