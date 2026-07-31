import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Player, Stats, NoFapStatus, HeatmapDay } from '../../../core/models/models';
import { RankBadgeComponent } from '../../../shared/components/rank-badge.component';
import { RotatingQuoteComponent } from './rotating-quote.component';
import { STATS_META } from '../../../shared/system.constants';
import { fadeInUp } from '../../../shared/animations';

@Component({
  selector: 'app-status-window',
  standalone: true,
  imports: [CommonModule, RouterLink, RankBadgeComponent, RotatingQuoteComponent],
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
  @Input() noFap?: NoFapStatus | null;
  @Input() heatmap: HeatmapDay[] = [];
  @Input() currentStreak = 0;

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

  statPct(key: string): number {
    const v = this.statValue(key);
    return Math.min(100, Math.round((v / 100) * 100));
  }

  // ── Radar / Spider Chart ─────────────────────────────────────────────────

  private readonly RADAR_KEYS = ['str', 'intelligence', 'vit', 'agi', 'per', 'dis'];
  private readonly RADAR_LABELS_MAP = ['STR', 'INT', 'VIT', 'AGI', 'PER', 'DIS'];
  private readonly RADAR_COLORS = ['#ff6b6b', '#4fc3f7', '#1D9E75', '#FAC775', '#b366ff', '#E24B4A'];

  hexPoints(cx: number, cy: number, r: number): string {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
  }

  axisPoints(cx: number, cy: number, r: number): { x: number; y: number }[] {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
  }

  get radarPoints(): string {
    return this.RADAR_KEYS.map((key, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const pct = Math.min(100, (this.stats as any)[key] ?? 0) / 100;
      const r = pct * 80;
      return `${110 + r * Math.cos(angle)},${110 + r * Math.sin(angle)}`;
    }).join(' ');
  }

  get radarDots(): { x: number; y: number; color: string }[] {
    return this.RADAR_KEYS.map((key, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const pct = Math.min(100, (this.stats as any)[key] ?? 0) / 100;
      const r = pct * 80;
      return { x: 110 + r * Math.cos(angle), y: 110 + r * Math.sin(angle), color: this.RADAR_COLORS[i] };
    });
  }

  get radarLabels(): { x: number; y: number; text: string; color: string }[] {
    return this.RADAR_KEYS.map((key, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const r = 97;
      return {
        x: 110 + r * Math.cos(angle),
        y: 110 + r * Math.sin(angle),
        text: this.RADAR_LABELS_MAP[i],
        color: this.RADAR_COLORS[i]
      };
    });
  }
}
