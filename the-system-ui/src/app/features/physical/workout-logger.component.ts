import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LifeOsService } from '../../core/services/life-os.service';
import { WorkoutEntry } from '../../core/models/models';

interface DayGroup { date: string; entries: WorkoutEntry[]; volume: number; }

@Component({
  selector: 'app-workout-logger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <section class="pt-card system-card">
    <div class="pt-head"><h3 class="mono">🏋 WORKOUT LOG</h3></div>

    <div class="wo-form">
      <input class="fin name" [(ngModel)]="name" placeholder="Exercise (e.g. Bench Press)" maxlength="60" />
      <div class="wo-nums">
        <label><span class="tech">SETS</span><input class="fin" type="number" min="0" max="50" [(ngModel)]="sets" /></label>
        <label><span class="tech">REPS</span><input class="fin" type="number" min="0" max="500" [(ngModel)]="reps" /></label>
        <label><span class="tech">KG</span><input class="fin" type="number" min="0" step="0.5" [(ngModel)]="weight" placeholder="—" /></label>
      </div>
      <button class="pt-save mono" (click)="add()" [disabled]="saving()">{{ saving() ? '…' : '+ ADD SET' }}</button>
    </div>

    <div class="wo-stats tech" *ngIf="todayVolume() > 0">
      <span class="lbl">TODAY'S VOLUME</span> <b>{{ todayVolume() | number }} kg</b>
      <span class="sep">·</span> {{ todayCount() }} exercises
    </div>

    <div class="wo-history" *ngIf="groups().length; else empty">
      <div class="wo-day" *ngFor="let g of groups()">
        <div class="wo-day-head tech">
          <span>{{ g.date | date:'EEE, MMM d' }}</span>
          <span class="vol">{{ g.volume | number }} kg</span>
        </div>
        <div class="wo-entry" *ngFor="let e of g.entries">
          <div class="wo-e-main">
            <span class="ex mono">{{ e.exerciseName }}</span>
            <span class="sr tech">{{ e.sets }} × {{ e.reps }}<span *ngIf="e.weightKg"> &#64; {{ e.weightKg }}kg</span></span>
          </div>
          <button class="wo-del" (click)="remove(e)" aria-label="Delete entry">✕</button>
        </div>
      </div>
    </div>
    <ng-template #empty>
      <p class="pt-empty tech">Log your first set to start building your training history.</p>
    </ng-template>
  </section>
  `,
  styles: [`
  :host { display: block; }
  .pt-card { padding: 20px; }
  .pt-head { margin-bottom: 16px; }
  .pt-head h3 { margin: 0; font-size: .82rem; letter-spacing: 3px; color: var(--stat-str, #FF6B3D); }
  .wo-form { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
  .fin { background: rgba(6,6,16,0.9); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); padding: 9px 12px; font-family: inherit; font-size: .82rem; width: 100%; }
  .fin:focus { outline: none; border-color: var(--accent-purple); }
  .wo-nums { display: flex; gap: 8px; }
  .wo-nums label { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .wo-nums span { font-size: .56rem; letter-spacing: 1.5px; color: var(--text-secondary); }
  .pt-save { cursor: pointer; border: 1px solid rgba(255,107,61,0.55); border-radius: 8px; background: rgba(255,107,61,0.1); color: #ff8a5f; padding: 11px; font-size: .74rem; letter-spacing: 2px; }
  .pt-save:disabled { opacity: .5; cursor: not-allowed; }
  .wo-stats { padding: 10px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin-bottom: 12px; font-size: .74rem; color: var(--text-secondary); }
  .wo-stats .lbl { font-size: .56rem; letter-spacing: 1.5px; color: var(--text-dim); }
  .wo-stats b { color: var(--accent-gold); }
  .wo-stats .sep { margin: 0 6px; color: var(--text-dim); }
  .wo-history { display: flex; flex-direction: column; gap: 14px; max-height: 380px; overflow-y: auto; }
  .wo-day-head { display: flex; justify-content: space-between; font-size: .64rem; letter-spacing: 1.5px; color: var(--accent-cyan); margin-bottom: 6px; }
  .wo-day-head .vol { color: var(--text-dim); }
  .wo-entry { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 10px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 6px; }
  .wo-e-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .wo-e-main .ex { font-size: .78rem; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .wo-e-main .sr { font-size: .66rem; color: var(--text-secondary); }
  .wo-del { flex: 0 0 auto; background: none; border: 1px solid var(--border); border-radius: 6px; color: var(--text-secondary); cursor: pointer; padding: 3px 8px; font-size: .7rem; }
  .wo-del:hover { color: var(--accent-red); border-color: var(--accent-red); }
  .pt-empty { text-align: center; color: var(--text-secondary); padding: 30px 0; font-size: .8rem; }
  `],
})
export class WorkoutLoggerComponent implements OnInit {
  history = signal<WorkoutEntry[]>([]);
  saving = signal(false);

  name = '';
  sets: number | null = 3;
  reps: number | null = 10;
  weight: number | null = null;

  constructor(private lifeOs: LifeOsService, private snack: MatSnackBar) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.lifeOs.workoutHistory().subscribe({
      next: (list) => this.history.set(list),
      error: () => {},
    });
  }

  groups = computed<DayGroup[]>(() => {
    const map = new Map<string, WorkoutEntry[]>();
    for (const e of this.history()) {
      const d = e.workoutDate ?? '';
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(e);
    }
    return Array.from(map.entries()).map(([date, entries]) => ({
      date,
      entries,
      volume: entries.reduce((s, e) => s + (e.sets || 0) * (e.reps || 0) * (e.weightKg || 0), 0),
    }));
  });

  private today(): string { return new Date().toISOString().slice(0, 10); }
  todayCount = computed(() => this.history().filter(e => e.workoutDate === this.today()).length);
  todayVolume = computed(() =>
    this.history().filter(e => e.workoutDate === this.today())
      .reduce((s, e) => s + (e.sets || 0) * (e.reps || 0) * (e.weightKg || 0), 0));

  add(): void {
    if (!this.name.trim()) {
      this.snack.open('Enter an exercise name.', '✕', { duration: 2500, panelClass: 'system-snack' });
      return;
    }
    this.saving.set(true);
    this.lifeOs.logWorkout({
      exerciseName: this.name.trim(),
      sets: this.sets ?? 0,
      reps: this.reps ?? 0,
      weightKg: this.weight,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.name = '';
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.snack.open('⚠ Failed to save.', '✕', { duration: 2500, panelClass: 'system-snack-warn' });
      },
    });
  }

  remove(e: WorkoutEntry): void {
    if (!e.id) return;
    this.lifeOs.deleteWorkout(e.id).subscribe({
      next: () => this.history.update(list => list.filter(x => x.id !== e.id)),
      error: () => {},
    });
  }
}

