import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rankStyle } from '../system.constants';

@Component({
  selector: 'app-rank-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rank-badge mono" [style.color]="s.color"
         [style.background]="s.bg" [style.borderColor]="s.border"
         [class.pulse]="animate">
      <span class="diamond">◈</span>
      <span class="rank">{{ rank }}</span>
      <span class="label">RANK</span>
    </div>
  `,
  styles: [`
    .rank-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border: 1.5px solid;
      border-radius: 10px;
      font-weight: 900;
      letter-spacing: 2px;
      position: relative;
      box-shadow: 0 0 22px -6px currentColor;
    }
    .diamond { font-size: 1.1rem; opacity: 0.85; }
    .rank { font-size: 1.6rem; line-height: 1; }
    .label { font-size: 0.6rem; letter-spacing: 3px; opacity: 0.7; align-self: flex-end; margin-bottom: 3px; }
    .pulse { animation: rankPulse 2.4s ease-in-out infinite; }
    @keyframes rankPulse {
      0%, 100% { box-shadow: 0 0 18px -8px currentColor; }
      50% { box-shadow: 0 0 34px -2px currentColor; }
    }
  `],
})
export class RankBadgeComponent {
  @Input() rank = 'E';
  @Input() animate = true;
  get s() { return rankStyle(this.rank); }
}

