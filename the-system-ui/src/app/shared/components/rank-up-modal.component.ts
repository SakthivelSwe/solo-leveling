import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HapticsService } from '../../core/services/haptics.service';

@Component({
  selector: 'app-rank-up-modal',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('coronation', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0, filter: 'brightness(0)' }),
        animate('1200ms cubic-bezier(0.175, 0.885, 0.32, 1.275)', keyframes([
          style({ transform: 'scale(0.8)', opacity: 0, filter: 'brightness(0)', offset: 0 }),
          style({ transform: 'scale(1.1)', opacity: 1, filter: 'brightness(2)', offset: 0.5 }),
          style({ transform: 'scale(1)', opacity: 1, filter: 'brightness(1)', offset: 1 })
        ]))
      ])
    ])
  ],
  template: `
    <div class="rank-up-overlay" (click)="close()">
      <div class="particles">
        <div class="particle" *ngFor="let p of particles" [style]="p"></div>
      </div>
      <div class="rank-up-content" @coronation (click)="$event.stopPropagation()">
        <div class="system-msg">THE SYSTEM HAS RECOGNIZED YOUR GROWTH</div>
        <h1 class="rank-title">AWAKENING</h1>
        <div class="rank-badge">
          <span class="old-rank">{{ data.oldRank }}</span>
          <span class="arrow">➜</span>
          <span class="new-rank">{{ data.newRank }}</span>
        </div>
        <p class="rank-desc">Your physical and mental limitations have been broken.</p>
        <button class="btn primary accept-btn" (click)="close()">ACCEPT</button>
      </div>
    </div>
  `,
  styles: [`
    .rank-up-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.9);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000; overflow: hidden;
    }
    .particles { position: absolute; inset: 0; pointer-events: none; }
    .particle {
      position: absolute; width: 4px; height: 4px; background: var(--accent-gold);
      border-radius: 50%; box-shadow: 0 0 10px var(--accent-gold);
      animation: floatUp 3s infinite linear;
    }
    @keyframes floatUp {
      0% { transform: translateY(100vh) scale(0); opacity: 0; }
      50% { opacity: 1; transform: translateY(50vh) scale(1.5); }
      100% { transform: translateY(-10vh) scale(0); opacity: 0; }
    }
    
    .rank-up-content {
      background: linear-gradient(180deg, rgba(20,20,20,0.95) 0%, rgba(10,10,10,0.95) 100%);
      border: 2px solid var(--accent-gold);
      border-radius: 20px; padding: 40px; text-align: center;
      box-shadow: 0 0 50px rgba(250, 199, 117, 0.3), inset 0 0 30px rgba(250, 199, 117, 0.1);
      position: relative; z-index: 2; max-width: 90%; width: 500px;
    }
    .system-msg {
      font-size: 0.8rem; color: var(--accent-teal); letter-spacing: 4px; margin-bottom: 20px;
    }
    .rank-title {
      font-family: 'Orbitron', monospace; font-size: 2.5rem; color: var(--accent-gold);
      text-shadow: 0 0 20px var(--accent-gold); margin: 0 0 30px; letter-spacing: 5px;
    }
    .rank-badge {
      display: flex; align-items: center; justify-content: center; gap: 20px;
      margin-bottom: 30px; font-family: 'Orbitron', monospace;
    }
    .old-rank { font-size: 1.5rem; color: var(--text-secondary); text-decoration: line-through; }
    .arrow { font-size: 2rem; color: var(--accent-teal); animation: pulse 1s infinite alternate; }
    .new-rank { font-size: 3.5rem; color: var(--accent-gold); text-shadow: 0 0 15px var(--accent-gold); }
    .rank-desc { color: var(--text-primary); font-size: 1rem; margin-bottom: 40px; font-style: italic; }
    .accept-btn {
      width: 100%; padding: 15px; font-size: 1.2rem; letter-spacing: 3px;
      background: linear-gradient(90deg, #b8860b 0%, #ffd700 50%, #b8860b 100%);
      color: #000; border: none; border-radius: 8px; font-weight: 900;
      box-shadow: 0 0 20px rgba(250, 199, 117, 0.5);
      transition: all 0.3s;
    }
    .accept-btn:hover {
      box-shadow: 0 0 40px rgba(250, 199, 117, 0.8); transform: scale(1.05);
    }
    @keyframes pulse {
      0% { filter: brightness(1); transform: scale(1); }
      100% { filter: brightness(1.5); transform: scale(1.2); }
    }
  `]
})
export class RankUpModalComponent implements OnInit {
  particles: string[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { oldRank: string, newRank: string },
    private dialogRef: MatDialogRef<RankUpModalComponent>,
    private haptics: HapticsService
  ) {}

  ngOnInit() {
    this.haptics.success();
    setTimeout(() => this.haptics.success(), 400);
    setTimeout(() => this.haptics.success(), 800);

    // Generate particles
    for (let i = 0; i < 50; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const dur = 2 + Math.random() * 2;
      this.particles.push('left: ' + left + '%; animation-delay: ' + delay + 's; animation-duration: ' + dur + 's;');
    }
  }

  close() {
    this.dialogRef.close();
  }
}
