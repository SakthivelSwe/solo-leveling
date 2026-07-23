import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-relapse-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  template: `
    <div class="relapse-modal system-card">
      <div class="modal-header">
        <h2 class="mono danger-glow">☠ POST-RELAPSE AUTOPSY</h2>
      </div>

      <div class="modal-body">
        <p class="desc tech">
          The System requires absolute honesty. You are about to reset your progress to Day 0.
          Identify the weakness that caused this failure.
        </p>

        <label class="tech label">PRIMARY TRIGGER:</label>
        <div class="trigger-grid">
          @for (t of triggers; track t) {
            <button class="trigger-btn tech" 
                    [class.selected]="selectedTrigger() === t"
                    (click)="selectedTrigger.set(t)">
              {{ t }}
            </button>
          }
        </div>

        <label class="tech label mt-4">CONFIRMATION:</label>
        <p class="desc tech" style="font-size: 0.65rem; color: #ff5252;">
          Type "I AM RELAPSING" below to confirm.
        </p>
        <input class="tech-input" type="text" [(ngModel)]="confirmText" placeholder="I AM RELAPSING" />
      </div>

      <div class="modal-footer">
        <button class="btn-cancel tech" (click)="dialogRef.close(false)">ABORT</button>
        <button class="btn-confirm tech" 
                [disabled]="!isValid()" 
                (click)="dialogRef.close({ trigger: selectedTrigger() })">
          CONFIRM FAILURE
        </button>
      </div>
    </div>
  `,
  styles: [`
    .relapse-modal {
      background: #0f1115;
      border: 1px solid #ff5252;
      color: #e2e8f0;
      padding: 24px;
      max-width: 500px;
      box-shadow: 0 0 40px rgba(255, 82, 82, 0.15);
    }
    .modal-header { margin-bottom: 20px; border-bottom: 1px solid rgba(255,82,82,0.3); padding-bottom: 12px; }
    .danger-glow { color: #ff5252; font-size: 1.2rem; letter-spacing: 2px; text-shadow: 0 0 10px rgba(255,82,82,0.4); margin: 0; }
    .desc { font-size: 0.75rem; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
    .label { font-size: 0.6rem; letter-spacing: 2px; color: #cbd5e1; display: block; margin-bottom: 12px; }
    .mt-4 { margin-top: 24px; }
    
    .trigger-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .trigger-btn {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.1);
      color: #94a3b8;
      padding: 10px;
      border-radius: 6px;
      font-size: 0.7rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .trigger-btn:hover { background: rgba(255,255,255,0.08); }
    .trigger-btn.selected {
      background: rgba(255, 82, 82, 0.15);
      border-color: #ff5252;
      color: #ff5252;
      box-shadow: 0 0 10px rgba(255,82,82,0.2);
    }

    .tech-input {
      width: 100%;
      background: rgba(0,0,0,0.5);
      border: 1px solid #334155;
      padding: 12px;
      color: #fff;
      font-family: 'Rajdhani', monospace;
      font-size: 0.9rem;
      letter-spacing: 1px;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .tech-input:focus { outline: none; border-color: #ff5252; }

    .modal-footer { display: flex; justify-content: flex-end; gap: 16px; margin-top: 32px; }
    .btn-cancel { background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 0.75rem; letter-spacing: 1px; }
    .btn-cancel:hover { color: #fff; }
    .btn-confirm {
      background: rgba(255, 82, 82, 0.1);
      border: 1px solid #ff5252;
      color: #ff5252;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.75rem;
      letter-spacing: 1px;
      transition: all 0.2s;
    }
    .btn-confirm:hover:not(:disabled) { background: #ff5252; color: #000; box-shadow: 0 0 15px rgba(255,82,82,0.5); }
    .btn-confirm:disabled { opacity: 0.3; cursor: not-allowed; border-color: #475569; color: #475569; }
  `]
})
export class RelapseDialogComponent {
  triggers = [
    'Stress / Anxiety',
    'Boredom / Free Time',
    'Social Media Trigger',
    'Late Night Habit',
    'Loneliness',
    'Hangover / Low Energy'
  ];
  
  selectedTrigger = signal<string | null>(null);
  confirmText = '';

  constructor(public dialogRef: MatDialogRef<RelapseDialogComponent>) {}

  isValid(): boolean {
    return this.selectedTrigger() !== null && this.confirmText === 'I AM RELAPSING';
  }
}
