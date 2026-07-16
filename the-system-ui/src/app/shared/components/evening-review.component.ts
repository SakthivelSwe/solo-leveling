import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LifeOsService } from '../../core/services/life-os.service';
import { MindLog } from '../../core/models/models';

/**
 * Evening Review — the 9 PM check-in. A short, guided reflection that captures
 * today's win, gratitude, evening mood, and tomorrow's #1 intention, then saves
 * it straight into the Mind OS log (`/api/mind/log`). Shown as a global overlay.
 */
@Component({
  selector: 'app-evening-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="er-overlay" (click)="dismiss()">
    <div class="er-card system-card" (click)="$event.stopPropagation()">
      <div class="er-head">
        <div>
          <h2 class="mono">🌙 EVENING REVIEW</h2>
          <p class="tech sub">Close the day, Hunter. Reflect, then rest.</p>
        </div>
        <button class="er-x" (click)="dismiss()" aria-label="Close">✕</button>
      </div>

      <label class="er-fld">
        <span class="tech">TODAY'S WIN — what went right?</span>
        <input class="fin" [(ngModel)]="win" maxlength="200" placeholder="e.g. Solved a hard LeetCode without AI" />
      </label>

      <label class="er-fld">
        <span class="tech">GRATITUDE — one thing you're grateful for</span>
        <input class="fin" [(ngModel)]="gratitude" maxlength="200" placeholder="e.g. My health and this grind" />
      </label>

      <div class="er-fld">
        <span class="tech">EVENING MOOD</span>
        <div class="mood-row">
          <button *ngFor="let n of moods" class="mood" [class.active]="mood() === n" (click)="mood.set(n)">{{ n }}</button>
        </div>
      </div>

      <label class="er-fld">
        <span class="tech">TOMORROW'S #1 INTENTION</span>
        <input class="fin" [(ngModel)]="intention" maxlength="200" placeholder="e.g. Wake at 6, cold shower, 1 hr coding" />
      </label>

      <div class="er-actions">
        <button class="er-save mono" (click)="save()" [disabled]="saving()">{{ saving() ? 'SAVING…' : '◈ SEAL THE DAY' }}</button>
        <button class="er-skip tech" (click)="dismiss()">SKIP TONIGHT</button>
      </div>
    </div>
  </div>
  `,
  styles: [`
  :host { display: block; }
  .er-overlay {
    position: fixed; inset: 0; z-index: 9998;
    background: radial-gradient(ellipse at 50% 20%, rgba(83,74,183,0.25), rgba(3,3,10,0.88) 70%);
    display: flex; align-items: center; justify-content: center; padding: 18px;
  }
  .er-card { width: min(92vw, 460px); padding: 24px; border: 1px solid rgba(108,99,255,0.4); }
  .er-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
  .er-head h2 { margin: 0; font-size: .9rem; letter-spacing: 3px; color: var(--accent-purple); }
  .er-head .sub { margin: 4px 0 0; font-size: .68rem; color: var(--text-secondary); letter-spacing: .5px; }
  .er-x { background: none; border: 1px solid var(--border); border-radius: 6px; color: var(--text-secondary); cursor: pointer; padding: 4px 9px; }
  .er-x:hover { color: var(--accent-red); border-color: var(--accent-red); }
  .er-fld { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .er-fld > span { font-size: .62rem; letter-spacing: 1.2px; color: var(--text-secondary); }
  .fin { background: rgba(6,6,16,0.9); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); padding: 10px 12px; font-family: inherit; font-size: .82rem; }
  .fin:focus { outline: none; border-color: var(--accent-purple); }
  .mood-row { display: flex; gap: 5px; flex-wrap: wrap; }
  .mood { flex: 1; min-width: 30px; cursor: pointer; border: 1px solid var(--border); background: none; color: var(--text-secondary); border-radius: 7px; padding: 8px 0; font-size: .72rem; }
  .mood.active { border-color: rgba(31,190,142,0.6); background: rgba(31,190,142,0.14); color: var(--accent-teal); }
  .er-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
  .er-save { cursor: pointer; border: 1px solid var(--accent-purple); border-radius: 10px; background: rgba(108,99,255,0.16); color: #b3aef0; padding: 13px; font-size: .8rem; letter-spacing: 3px; }
  .er-save:disabled { opacity: .5; cursor: not-allowed; }
  .er-skip { cursor: pointer; background: none; border: none; color: var(--text-secondary); font-size: .68rem; letter-spacing: 1.5px; }
  .er-skip:hover { color: var(--text-primary); }
  `],
})
export class EveningReviewComponent {
  @Output() closed = new EventEmitter<void>();

  readonly moods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  win = '';
  gratitude = '';
  intention = '';
  mood = signal<number | null>(null);
  saving = signal(false);

  constructor(private lifeOs: LifeOsService, private snack: MatSnackBar) {}

  save(): void {
    this.saving.set(true);
    // Only send the mind fields the review captures.
    const payload: MindLog = {
      todayWin: this.win.trim() || undefined,
      gratitude: this.gratitude.trim() || undefined,
      morningIntention: this.intention.trim() || undefined,   // tomorrow's intention
      eveningReflection: this.win.trim() || undefined,
      moodEvening: this.mood() ?? undefined,
    };
    this.lifeOs.upsertMind(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('◈ DAY SEALED — rest well, Hunter', '✕', { duration: 3500, panelClass: 'system-snack' });
        this.closed.emit();
      },
      error: () => {
        this.saving.set(false);
        this.snack.open('⚠ Could not save. Try again.', '✕', { duration: 2800, panelClass: 'system-snack-warn' });
      },
    });
  }

  dismiss(): void {
    this.closed.emit();
  }
}


