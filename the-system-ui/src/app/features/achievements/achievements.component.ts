import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';
import { Achievement } from '../../core/models/models';

interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.scss'],
})
export class AchievementsComponent implements OnInit {
  unlocked = signal<Achievement[]>([]);
  loading = signal(true);

  // Full catalogue of achievements available in THE SYSTEM
  readonly catalogue: AchievementDef[] = [
    { key: 'FIRST_QUEST', title: 'First Awakening', description: 'Complete your first quest ever', icon: '◈' },
    { key: 'LEETCODE_10', title: 'Algorithm Hunter', description: 'Solve 10 LeetCode problems total', icon: '⚔' },
    { key: 'NO_AI_WARRIOR', title: 'No-AI Warrior', description: 'Code without AI for 5 days in a row', icon: '🧠' },
    { key: 'RANK_UP_D', title: 'D-Rank Hunter', description: 'Reach D-Rank', icon: '🅳' },
    { key: 'RANK_UP_C', title: 'C-Rank — Interview Ready', description: 'Reach C-Rank', icon: '🅲' },
    { key: 'HORMONE_WARRIOR', title: 'Hormone Warrior', description: 'Complete all 6 testosterone quests in one day', icon: '⚡' },
    { key: 'DAWN_HUNTER', title: 'Dawn Hunter', description: 'Get morning sunlight 10 days in a row', icon: '☀' },
    { key: 'DOPAMINE_RESET', title: 'Dopamine Reset', description: 'Complete NO_PORN quest 14 days straight', icon: '🛡' },
    { key: 'COLD_STREAK', title: 'Cold Streak', description: 'Cold shower 7 days in a row', icon: '❄' },
    { key: 'CLEAN_FUEL', title: 'Clean Fuel', description: 'No junk or soda for 7 days straight', icon: '🥗' },
  ];

  constructor(private playerService: PlayerService) {}

  ngOnInit(): void {
    this.playerService.getAchievements().subscribe({
      next: (a) => { this.unlocked.set(a); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  isUnlocked(key: string): Achievement | undefined {
    return this.unlocked().find(a => a.achievementKey === key);
  }

  get unlockedCount(): number { return this.unlocked().length; }
}

