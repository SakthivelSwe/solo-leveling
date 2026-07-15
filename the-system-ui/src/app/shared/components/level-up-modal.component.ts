import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RankBadgeComponent } from './rank-badge.component';

export interface LevelUpData {
  newLevel: number;
  newRank: string;
  rankChanged: boolean;
}

@Component({
  selector: 'app-level-up-modal',
  standalone: true,
  imports: [CommonModule, RankBadgeComponent],
  template: `
    <div class="lvl-backdrop">
      <div class="lvl-overlay">
        <button type="button" class="close" aria-label="Close level up modal" (click)="close()">×</button>
        <div class="rays"></div>
        <div class="content">
          <div class="diamond-burst">◈</div>
          <h1 class="mono title glow">LEVEL UP!</h1>
          <div class="level-num mono">LV. {{ data.newLevel }}</div>

          <div *ngIf="data.rankChanged" class="rank-up">
            <div class="rank-up-label tech">RANK ASCENSION</div>
            <app-rank-badge [rank]="data.newRank"></app-rank-badge>
          </div>

          <p class="sub tech">THE SYSTEM ACKNOWLEDGES YOUR GROWTH, HUNTER.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lvl-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(3,3,10,0.92);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      animation: fadeIn .3s ease-out;
    }
    .lvl-overlay {
      position: relative;
      width: min(92vw, 480px);
      max-height: 90dvh;
      padding: 48px 32px;
      text-align: center;
      overflow: hidden;
      border-radius: 16px;
      background: radial-gradient(circle at 50% 30%, rgba(83,74,183,0.35), rgba(9,9,18,0.98) 70%);
      border: 1px solid rgba(83,74,183,0.6);
      box-shadow: 0 0 60px rgba(83,74,183,0.5);
      animation: popIn .5s cubic-bezier(.16,1,.3,1);
    }
    .close {
      position: absolute; top: 12px; right: 12px; z-index: 3;
      width: 34px; height: 34px; border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(9,9,18,0.72); color: var(--text-secondary);
      font-size: 1.2rem; line-height: 1; cursor: pointer;
      transition: color .2s, border-color .2s, transform .2s;
    }
    .close:hover {
      color: var(--text-primary); border-color: rgba(79,195,247,0.45);
      transform: translateY(-1px);
    }
    .rays {
      position: absolute; inset: -50%;
      background: conic-gradient(from 0deg,
        transparent 0deg, rgba(79,195,247,0.14) 12deg, transparent 24deg,
        transparent 60deg, rgba(83,74,183,0.16) 72deg, transparent 84deg);
      animation: spin 12s linear infinite;
      pointer-events: none;
    }
    .content { position: relative; z-index: 2; }
    .diamond-burst {
      font-size: 3.4rem; color: var(--accent-gold);
      text-shadow: 0 0 30px var(--accent-gold);
      animation: burst 1.2s ease-out;
    }
    .title {
      font-size: 2.6rem; font-weight: 900; margin: 6px 0 0;
      background: linear-gradient(90deg, #fff, #AFA9EC, #4fc3f7);
      -webkit-background-clip: text; background-clip: text; color: transparent;
      letter-spacing: 4px;
    }
    .glow { filter: drop-shadow(0 0 18px rgba(79,195,247,0.7)); }
    .level-num {
      font-size: 1.4rem; color: var(--accent-gold); margin-top: 6px;
      letter-spacing: 3px; text-shadow: 0 0 16px rgba(250,199,117,0.6);
    }
    .rank-up { margin: 22px 0 6px; animation: fadeUp .6s .3s both; }
    .rank-up-label { font-size: .7rem; letter-spacing: 4px; color: var(--text-secondary); margin-bottom: 10px; }
    .sub { margin-top: 22px; font-size: .8rem; letter-spacing: 2px; color: var(--text-secondary); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { transform: scale(.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes burst { 0% { transform: scale(0) rotate(-30deg); opacity: 0; } 60% { transform: scale(1.4); opacity: 1; } 100% { transform: scale(1); } }
    @keyframes fadeUp { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `],
})
export class LevelUpModalComponent implements OnInit, OnDestroy {
  @Input() data!: LevelUpData;
  @Output() closeModal = new EventEmitter<void>();

  private timeoutId: any;

  ngOnInit(): void {
    this.timeoutId = setTimeout(() => this.close(), 4000);
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  close(): void {
    this.closeModal.emit();
  }
}
