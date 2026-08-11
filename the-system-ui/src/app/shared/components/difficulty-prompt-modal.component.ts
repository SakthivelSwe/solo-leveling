import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-difficulty-prompt-modal',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('dialogOpen', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', opacity: 0 }),
        animate('150ms cubic-bezier(0, 0, 0.2, 1)', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="diff-prompt-overlay" (click)="close()">
      <div class="diff-prompt-container" @dialogOpen (click)="$event.stopPropagation()">
        <div class="system-header mono">
          <span class="icon">⭐</span>
          QUEST EVALUATION
        </div>
        
        <div class="content">
          <h2 class="title">How was the difficulty?</h2>
          <p class="desc">
            You are completing <strong class="quest-name">'{{ data.questName }}'</strong>.
            <br>
            <span class="hint tech">The System uses this feedback to adapt future quest scaling.</span>
          </p>
          
          <div class="btn-group">
            <button class="btn diff-btn easy tech" (click)="submit('TOO_EASY')">TOO EASY</button>
            <button class="btn diff-btn right tech" (click)="submit('JUST_RIGHT')">JUST RIGHT</button>
            <button class="btn diff-btn hard tech" (click)="submit('HARD')">HARD</button>
          </div>
        </div>

        <div class="actions">
          <button class="btn secondary tech" (click)="close()">CANCEL COMPLETION</button>
          <button class="btn secondary tech" (click)="submit(null)">SKIP FEEDBACK</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .diff-prompt-overlay {
      position: fixed; 
      inset: 0; 
      background: var(--bg-primary);
      display: flex; 
      align-items: center; 
      justify-content: center;
      z-index: 10000; 
    }

    .diff-prompt-container {
      background: var(--card-bg);
      border: 1px solid var(--accent-purple);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--elev-2);
      width: 90vw;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      color: var(--text-primary);
    }

    .system-header {
      background: rgba(168, 85, 247, 0.15);
      border-bottom: 1px solid rgba(168, 85, 247, 0.3);
      padding: 12px 16px;
      font-size: 0.75rem;
      color: var(--accent-purple);
      letter-spacing: 2px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

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
      margin-bottom: 24px;
    }
    .quest-name {
      color: var(--accent-purple);
    }
    .hint {
      color: var(--accent-blue);
      font-size: 0.7rem;
    }

    .btn-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .btn {
      padding: 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      letter-spacing: 1.5px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .diff-btn {
      border: 1px solid var(--border);
      background: rgba(0,0,0,0.2);
      color: var(--text-primary);
      font-weight: bold;
    }
    .diff-btn.easy:hover { border-color: #1FBE8E; color: #1FBE8E; background: rgba(31, 190, 142, 0.1); }
    .diff-btn.right:hover { border-color: #4fc3f7; color: #4fc3f7; background: rgba(79, 195, 247, 0.1); }
    .diff-btn.hard:hover { border-color: #fca5a5; color: #fca5a5; background: rgba(252, 165, 165, 0.1); }

    .actions {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid var(--border);
    }
    .actions .secondary {
      flex: 1;
      padding: 10px;
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-secondary);
      font-size: 0.7rem;
    }
    .actions .secondary:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }
  `]
})
export class DifficultyPromptModalComponent {
  constructor(
    public dialogRef: MatDialogRef<DifficultyPromptModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { questName: string }
  ) {}

  close(): void {
    // Undefined means they cancelled the modal
    this.dialogRef.close(undefined);
  }

  submit(feedback: string | null): void {
    this.dialogRef.close(feedback);
  }
}
