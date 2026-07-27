import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-past-autopsies',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="autopsy-modal system-card">
      <div class="modal-header" mat-dialog-title>
        <h2 class="mono text-white">☠ PAST AUTOPSIES</h2>
        <button class="close-btn tech" (click)="dialogRef.close()">✕</button>
      </div>

      <div class="modal-body" mat-dialog-content>
        @if (autopsies.length === 0) {
          <div class="empty-state tech">
            No past relapses recorded yet. Stay strong.
          </div>
        } @else {
          <div class="autopsy-list">
            @for (a of autopsies; track a.id) {
              <div class="autopsy-card">
                <div class="a-header">
                  <span class="tech trigger-label">{{ a.trigger }}</span>
                  <span class="tech date-label">{{ a.date | date:'short' }}</span>
                </div>
                <p class="a-text">"{{ a.reflection }}"</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .autopsy-modal {
      background: #0f1115;
      border: 1px solid #334155;
      color: #e2e8f0;
      padding: 0;
      display: flex;
      flex-direction: column;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0;
      padding: 24px 24px 12px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .text-white { color: #fff; font-size: 1.2rem; letter-spacing: 2px; margin: 0; }
    .close-btn { background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; padding: 0; }
    .close-btn:hover { color: #fff; }
    
    .modal-body {
      padding: 24px !important;
      overflow-y: auto;
      flex: 1;
    }
    .empty-state {
      text-align: center;
      padding: 32px;
      color: #94a3b8;
      font-style: italic;
    }
    .autopsy-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .autopsy-card {
      background: rgba(255, 82, 82, 0.05);
      border-left: 3px solid #ff5252;
      padding: 12px 16px;
      border-radius: 0 4px 4px 0;
    }
    .a-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .trigger-label { color: #ff5252; font-size: 0.75rem; font-weight: bold; }
    .date-label { color: #64748b; font-size: 0.65rem; }
    .a-text {
      color: #cbd5e1;
      font-size: 0.85rem;
      line-height: 1.5;
      margin: 0;
      white-space: pre-wrap;
    }
  `]
})
export class PastAutopsiesComponent implements OnInit {
  autopsies: any[] = [];

  constructor(public dialogRef: MatDialogRef<PastAutopsiesComponent>) {}

  ngOnInit() {
    const year = new Date().getFullYear();
    const key = `nf_relapses_${year}`;
    this.autopsies = JSON.parse(localStorage.getItem(key) || '[]').reverse();
  }
}
