import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player, Stats } from '../../../core/models/models';
import { RankBadgeComponent } from '../../../shared/components/rank-badge.component';
import { RotatingQuoteComponent } from './rotating-quote.component';
import { STATS_META } from '../../../shared/system.constants';
import { fadeInUp } from '../../../shared/animations';

@Component({
  selector: 'app-status-window',
  standalone: true,
  imports: [CommonModule, RankBadgeComponent, RotatingQuoteComponent],
  templateUrl: './status-window.component.html',
  styleUrls: ['./status-window.component.scss'],
  animations: [fadeInUp],
})
export class StatusWindowComponent {
  @Input({ required: true }) player!: Player;
  @Input({ required: true }) stats!: Stats;
  @Input() streak = 0;
  @Input() motivation = '';
  @Input() systemQuote = '';
  @Input() completedToday = 0;
  @Input() totalQuests = 0;
  @Input() dopamine?: import('../../../core/models/models').DopamineSummary | null;

  readonly statsMeta = STATS_META;

  // SVG ring geometry
  readonly radius = 78;
  get circumference() { return 2 * Math.PI * this.radius; }

  get xpPct(): number {
    const total = this.player.xpToNextLevel || 100;
    return Math.min(100, Math.round((this.player.currentXp / total) * 100));
  }

  get dashOffset(): number {
    return this.circumference * (1 - this.xpPct / 100);
  }

  get hpPct(): number {
    const max = this.player.maxHp || 100;
    return Math.max(0, Math.min(100, Math.round((this.player.hp / max) * 100)));
  }

  get hpColor(): string {
    if (this.hpPct >= 60) return '#1D9E75';
    if (this.hpPct >= 30) return '#FAC775';
    return '#E24B4A';
  }

  statValue(key: string): number {
    return (this.stats as any)[key] ?? 0;
  }

  // stat bar width: normalize against a soft max so bars feel alive
  statPct(key: string): number {
    const v = this.statValue(key);
    return Math.min(100, Math.round((v / 100) * 100));
  }
}

