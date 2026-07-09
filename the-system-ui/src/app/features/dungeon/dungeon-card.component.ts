import { Component, OnInit, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlayerService } from '../../core/services/player.service';
import { SseService } from '../../core/services/sse.service';
import { Dungeon } from '../../core/models/models';
import { fadeInUp } from '../../shared/animations';

@Component({
  selector: 'app-dungeon-card',
  standalone: true,
  imports: [CommonModule],
  animations: [fadeInUp],
  template: `
    <div class="dungeon system-card" *ngIf="dungeon() as d" @fadeInUp
         [class.cleared]="d.cleared">
      <div class="dg-head">
        <span class="mono tag">◈ WEEKLY GATE</span>
        <span class="tech week">{{ d.cleared ? 'CLEARED' : d.progressPct + '%' }}</span>
      </div>

      <h3 class="gate-name mono">{{ d.name }}</h3>
      <p class="boss tech">BOSS · {{ d.bossName }}</p>

      <div class="hpbar">
        <div class="hpfill" [style.width.%]="100 - d.progressPct"
             [class.low]="d.progressPct >= 66"></div>
        <span class="hptext mono">{{ d.currentHp }} / {{ d.totalHp }} HP</span>
      </div>

      <p class="hint tech" *ngIf="!d.cleared">
        Clear <b>{{ d.questsToClear }}</b> quests this week to fell the boss ·
        {{ d.questsThisWeek }} done · reward <b>+{{ d.rewardXp }} XP</b>
      </p>
      <p class="hint done tech" *ngIf="d.cleared">
        ✓ Gate cleared · +{{ d.rewardXp }} XP claimed · next gate spawns Monday
      </p>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dungeon {
      background: var(--card-bg, #10101e); border: 1px solid rgba(226,75,74,0.35);
      border-radius: 14px; padding: 16px; position: relative; overflow: hidden;
    }
    .dungeon.cleared { border-color: rgba(29,158,117,0.5); }
    .dg-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .tag { font-size: .6rem; letter-spacing: 2px; color: #f09595; }
    .dungeon.cleared .tag { color: #5dcaa5; }
    .week { font-size: .6rem; letter-spacing: 1.5px; color: var(--text-secondary); }
    .gate-name { margin: 0; font-size: .82rem; letter-spacing: 1px; color: var(--text-primary); }
    .boss { margin: 2px 0 12px; font-size: .6rem; letter-spacing: 2px; color: var(--accent-gold); }
    .hpbar {
      position: relative; height: 20px; border-radius: 10px; overflow: hidden;
      background: rgba(29,158,117,0.15); border: 1px solid var(--border); margin-bottom: 10px;
    }
    .hpfill {
      height: 100%; border-radius: 10px; transition: width .5s cubic-bezier(.22,1,.36,1);
      background: linear-gradient(90deg, #E24B4A, #FAC775);
    }
    .hpfill.low { background: linear-gradient(90deg, #E24B4A, #b3352f); }
    .hptext {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      font-size: .58rem; letter-spacing: 1px; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.8);
    }
    .hint { margin: 0; font-size: .64rem; letter-spacing: .5px; color: var(--text-secondary); line-height: 1.5; }
    .hint b { color: var(--accent-gold); }
    .hint.done { color: #5dcaa5; }
  `],
})
export class DungeonCardComponent implements OnInit {
  dungeon = signal<Dungeon | null>(null);

  constructor(
    private playerService: PlayerService,
    private sse: SseService,
    private snack: MatSnackBar,
  ) {
    let last = 0;
    effect(() => {
      const tick = this.sse.playerTick();
      if (tick !== last && tick > 0) { last = tick; this.load(); }
      else { last = tick; }
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.playerService.getDungeon().subscribe({
      next: d => {
        this.dungeon.set(d);
        if (d.justCleared) {
          this.snack.open(`⚔ GATE CLEARED — ${d.bossName} felled · +${d.rewardXp} XP`, '✕', {
            duration: 5000, panelClass: 'system-snack',
            horizontalPosition: 'center', verticalPosition: 'top',
          });
        }
      },
      error: () => {},
    });
  }
}

