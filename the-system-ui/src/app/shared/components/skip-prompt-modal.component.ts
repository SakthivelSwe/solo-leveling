import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-skip-prompt-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('dialogOpen', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', opacity: 0 }),
        animate('150ms cubic-bezier(0, 0, 0.2, 1)', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="skip-prompt-container" @dialogOpen>
      <div class="system-header mono">
        <span class="warning-icon">⚠</span>
        SYSTEM OVERRIDE
      </div>
      
      <div class="content">
        <h2 class="title">State Your Reason</h2>
        <p class="desc">
          You are about to skip <strong class="quest-name">'{{ data.questName }}'</strong>.
          <br><br>
          <span class="hint tech">Provide a valid reason to prevent the system from punishing your streak.</span>
        </p>
        
        <textarea 
          class="reason-input tech" 
          [(ngModel)]="reason" 
          placeholder="e.g. Injured ankle, Overworked, etc."
          rows="3"
          autofocus>
        </textarea>
      </div>

      <div class="actions">
        <button class="btn secondary tech" (click)="close()">CANCEL</button>
        <button class="btn primary tech" [disabled]="!reason.trim()" (click)="submit()">CONFIRM SKIP</button>
      </div>
    </div>
  `,
  styles: [`
    .skip-prompt-container {
      display: flex;
      flex-direction: column;
      color: var(--text-primary);
    }

    .system-header {
      background: rgba(226, 75, 74, 0.15);
      border-bottom: 1px solid rgba(226, 75, 74, 0.3);
      padding: 12px 16px;
      font-size: 0.75rem;
      color: #f09595;
      letter-spacing: 2px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .warning-icon { font-size: 1rem; }

    .content {
      padding: 20px;
    }

    .title {
      margin: 0 0 12px 0;
      font-size: 1.2rem;
      font-weight: 600;
      letter-spacing: 1px;
    }

    .desc {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .quest-name {
      color: var(--accent-purple);
    }
    .hint {
      color: rgba(226, 75, 74, 0.8);
      font-size: 0.7rem;
    }

    .reason-input {
      width: 100%;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      color: var(--text-primary);
      font-size: 0.85rem;
      resize: none;
      outline: none;
      transition: all 0.2s;
    }
    .reason-input:focus {
      border-color: #f09595;
      background: rgba(226, 75, 74, 0.05);
    }

    .actions {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid var(--border);
    }

    .btn {
      flex: 1;
      padding: 10px;
      border-radius: 8px;
      font-size: 0.8rem;
      letter-spacing: 1.5px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn.secondary {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-secondary);
    }
    .btn.secondary:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }
    .btn.primary {
      background: rgba(226, 75, 74, 0.2);
      border: 1px solid rgba(226, 75, 74, 0.5);
      color: #f09595;
    }
    .btn.primary:hover:not(:disabled) {
      background: rgba(226, 75, 74, 0.3);
    }
    .btn.primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      border-color: var(--border);
      background: rgba(0, 0, 0, 0.2);
      color: var(--text-dim);
    }
  `]
})
export class SkipPromptModalComponent {
  reason = '';

  constructor(
    public dialogRef: MatDialogRef<SkipPromptModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { questName: string }
  ) {}

  close(): void {
    this.dialogRef.close(null);
  }

  submit(): void {
    if (this.reason.trim()) {
      this.dialogRef.close(this.reason.trim());
    }
  }
}
