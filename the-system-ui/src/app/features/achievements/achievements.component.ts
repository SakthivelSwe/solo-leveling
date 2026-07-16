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
    // ── Origins & discipline (original 10) ──
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

    // ── Level milestones ──
    { key: 'LEVEL_5',  title: 'Rookie Hunter',   description: 'Reach Level 5',  icon: '🌱' },
    { key: 'LEVEL_10', title: 'Seasoned Hunter', description: 'Reach Level 10', icon: '🗡' },
    { key: 'LEVEL_15', title: 'Veteran Hunter',  description: 'Reach Level 15', icon: '🛡' },
    { key: 'LEVEL_20', title: 'Elite Hunter',    description: 'Reach Level 20', icon: '⭐' },
    { key: 'LEVEL_25', title: 'Master Hunter',   description: 'Reach Level 25', icon: '🌟' },
    { key: 'LEVEL_30', title: 'Grandmaster',     description: 'Reach Level 30', icon: '👑' },
    { key: 'LEVEL_35', title: 'Warlord',         description: 'Reach Level 35', icon: '🔱' },
    { key: 'LEVEL_40', title: 'Ascendant',       description: 'Reach Level 40', icon: '💫' },
    { key: 'LEVEL_45', title: 'Sovereign',       description: 'Reach Level 45', icon: '♛' },
    { key: 'LEVEL_50', title: "Monarch's Equal", description: 'Reach Level 50', icon: '👁' },

    // ── Total XP milestones ──
    { key: 'XP_1K',   title: 'Grinder',      description: 'Earn 1,000 total XP',   icon: '🔋' },
    { key: 'XP_5K',   title: 'Relentless',   description: 'Earn 5,000 total XP',   icon: '🔥' },
    { key: 'XP_10K',  title: 'Unstoppable',  description: 'Earn 10,000 total XP',  icon: '⚙' },
    { key: 'XP_25K',  title: 'Machine',      description: 'Earn 25,000 total XP',  icon: '🤖' },
    { key: 'XP_50K',  title: 'Legend',       description: 'Earn 50,000 total XP',  icon: '🏆' },
    { key: 'XP_100K', title: 'Mythic',       description: 'Earn 100,000 total XP', icon: '🌌' },
    { key: 'XP_250K', title: 'Transcendent', description: 'Earn 250,000 total XP', icon: '🕳' },

    // ── Rank milestones ──
    { key: 'RANK_UP_B', title: 'B-Rank Hunter',          description: 'Reach B-Rank', icon: '🅱' },
    { key: 'RANK_UP_A', title: 'A-Rank Hunter',          description: 'Reach A-Rank', icon: '🅰' },
    { key: 'RANK_UP_S', title: 'S-Rank — Shadow Monarch', description: 'Reach S-Rank', icon: '🆂' },

    // ── Total quests ──
    { key: 'QUESTS_10',   title: 'Getting Started', description: 'Complete 10 quests',    icon: '✅' },
    { key: 'QUESTS_50',   title: 'Committed',       description: 'Complete 50 quests',    icon: '📋' },
    { key: 'QUESTS_100',  title: 'Centurion',       description: 'Complete 100 quests',   icon: '💯' },
    { key: 'QUESTS_250',  title: 'Disciplined',     description: 'Complete 250 quests',   icon: '🎯' },
    { key: 'QUESTS_500',  title: 'Iron Will',       description: 'Complete 500 quests',   icon: '🪓' },
    { key: 'QUESTS_1000', title: 'The 1000 Club',   description: 'Complete 1,000 quests', icon: '🏅' },
    { key: 'QUESTS_2000', title: 'Machine God',     description: 'Complete 2,000 quests', icon: '⚡' },

    // ── Active-day consistency ──
    { key: 'ACTIVE_7',   title: 'One Week Strong',       description: 'Active on 7 different days',   icon: '📅' },
    { key: 'ACTIVE_30',  title: 'One Month In',          description: 'Active on 30 different days',  icon: '🗓' },
    { key: 'ACTIVE_100', title: 'Century of Grind',      description: 'Active on 100 different days', icon: '📆' },
    { key: 'ACTIVE_200', title: 'Consistency Incarnate', description: 'Active on 200 different days', icon: '🔗' },
    { key: 'ACTIVE_365', title: 'The Year of Leveling',  description: 'Active on 365 different days', icon: '🎆' },

    // ── Vitality ──
    { key: 'FULL_HP', title: 'Peak Vitality', description: 'Reach full HP', icon: '❤' },

    // ── LeetCode mastery ──
    { key: 'LC_LOG_10',  title: 'Problem Solver',   description: 'Log 10 LeetCode problems',  icon: '🧩' },
    { key: 'LC_LOG_50',  title: 'Algorithm Adept',  description: 'Log 50 LeetCode problems',  icon: '🧮' },
    { key: 'LC_LOG_100', title: 'DSA Machine',      description: 'Log 100 LeetCode problems', icon: '💻' },
    { key: 'LC_LOG_200', title: 'LeetCode Legend',  description: 'Log 200 LeetCode problems', icon: '👨‍💻' },
    { key: 'LC_HARD_10', title: 'Hard Mode',        description: 'Solve 10 HARD problems',    icon: '🔺' },
    { key: 'LC_HARD_25', title: 'Fearless',         description: 'Solve 25 HARD problems',    icon: '🔴' },
    { key: 'LC_HARD_50', title: 'Nightmare Slayer', description: 'Solve 50 HARD problems',    icon: '💀' },

    // ── Long discipline streaks ──
    { key: 'COLD_30',   title: 'Ice Monarch',      description: 'Cold shower 30 days straight',    icon: '🧊' },
    { key: 'NOPORN_30', title: 'Monk Mode',        description: 'NO_PORN 30 days straight',        icon: '🧘' },
    { key: 'NOPORN_60', title: 'Steel Discipline', description: 'NO_PORN 60 days straight',        icon: '⛓' },
    { key: 'NOPORN_90', title: 'Reborn',           description: 'NO_PORN 90 days straight',        icon: '🔆' },
    { key: 'SUN_30',    title: 'Sun Disciple',     description: 'Morning sunlight 30 days',        icon: '🌅' },
    { key: 'NOSODA_30', title: 'Clean Machine',    description: 'No soda 30 days straight',        icon: '🚱' },
    { key: 'NOAI_10',   title: 'Sharpening Steel', description: 'Code without AI 10 days',         icon: '🔧' },
    { key: 'NOAI_30',   title: 'Raw Skill',        description: 'Code without AI 30 days',         icon: '🛠' },

    // ── Atomic Habits engine ──
    { key: 'FIRST_HABIT', title: 'Habit Seed',       description: 'Create your first habit', icon: '🌿' },
    { key: 'HABIT_3',     title: 'Routine Builder',  description: 'Run 3 active habits',     icon: '🧱' },
    { key: 'HABIT_5',     title: 'System Architect', description: 'Run 5 active habits',     icon: '🏗' },
    { key: 'HABIT_10',    title: 'Habit Master',     description: 'Run 10 active habits',    icon: '🧬' },
    { key: 'KEYSTONE',    title: 'Keystone Bearer',  description: 'Maintain a keystone habit', icon: '🗝' },
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

