import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';
import { Achievement } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';

type AchCategory = 'ALL' | 'DISCIPLINE' | 'RANK' | 'LEVEL' | 'NOFAP' | 'STREAK' | 'LEARNING';

interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: AchCategory;
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

  readonly catalogue: AchievementDef[] = [
    // Origins & discipline
    { key: 'FIRST_QUEST',    title: 'First Awakening',          description: 'Complete your first quest ever',               icon: '◈',  category: 'DISCIPLINE' },
    { key: 'LEETCODE_10',    title: 'Algorithm Hunter',          description: 'Solve 10 LeetCode problems total',             icon: '⚔',  category: 'LEARNING' },
    { key: 'NO_AI_WARRIOR',  title: 'No-AI Warrior',            description: 'Code without AI for 5 days in a row',         icon: '🧠', category: 'DISCIPLINE' },
    { key: 'RANK_UP_D',      title: 'D-Rank Hunter',            description: 'Reach D-Rank',                                 icon: '🅳', category: 'RANK' },
    { key: 'RANK_UP_C',      title: 'C-Rank — Interview Ready', description: 'Reach C-Rank',                                 icon: '🅲', category: 'RANK' },
    { key: 'HORMONE_WARRIOR',title: 'Hormone Warrior',           description: 'Complete all 6 testosterone quests in one day',icon: '⚡', category: 'DISCIPLINE' },
    { key: 'DAWN_HUNTER',    title: 'Dawn Hunter',              description: 'Get morning sunlight 10 days in a row',       icon: '☀',  category: 'STREAK' },
    { key: 'DOPAMINE_RESET', title: 'Dopamine Reset',           description: 'Complete NO_PORN quest 14 days straight',      icon: '🛡', category: 'NOFAP' },
    { key: 'COLD_STREAK',    title: 'Cold Streak',              description: 'Cold shower 7 days in a row',                  icon: '❄',  category: 'STREAK' },
    { key: 'CLEAN_FUEL',     title: 'Clean Fuel',               description: 'No junk or soda for 7 days straight',         icon: '🥗', category: 'DISCIPLINE' },
    // Level milestones
    { key: 'LEVEL_5',  title: 'Rookie Hunter',   description: 'Reach Level 5',  icon: '🌱', category: 'LEVEL' },
    { key: 'LEVEL_10', title: 'Seasoned Hunter', description: 'Reach Level 10', icon: '🗡', category: 'LEVEL' },
    { key: 'LEVEL_15', title: 'Veteran Hunter',  description: 'Reach Level 15', icon: '🛡', category: 'LEVEL' },
    { key: 'LEVEL_20', title: 'Elite Hunter',    description: 'Reach Level 20', icon: '⭐', category: 'LEVEL' },
    { key: 'LEVEL_25', title: 'Master Hunter',   description: 'Reach Level 25', icon: '🌟', category: 'LEVEL' },
    { key: 'LEVEL_30', title: 'Grandmaster',     description: 'Reach Level 30', icon: '👑', category: 'LEVEL' },
    { key: 'LEVEL_35', title: 'Warlord',         description: 'Reach Level 35', icon: '🔱', category: 'LEVEL' },
    { key: 'LEVEL_40', title: 'Ascendant',       description: 'Reach Level 40', icon: '💫', category: 'LEVEL' },
    { key: 'LEVEL_45', title: 'Sovereign',       description: 'Reach Level 45', icon: '♛',  category: 'LEVEL' },
    { key: 'LEVEL_50', title: "Monarch's Equal", description: 'Reach Level 50', icon: '👁',  category: 'LEVEL' },
    // Total XP milestones
    { key: 'XP_1K',   title: 'Grinder',      description: 'Earn 1,000 total XP',   icon: '🔋', category: 'DISCIPLINE' },
    { key: 'XP_5K',   title: 'Relentless',   description: 'Earn 5,000 total XP',   icon: '🔥', category: 'DISCIPLINE' },
    { key: 'XP_10K',  title: 'Unstoppable',  description: 'Earn 10,000 total XP',  icon: '⚙',  category: 'DISCIPLINE' },
    { key: 'XP_25K',  title: 'Machine',      description: 'Earn 25,000 total XP',  icon: '🤖', category: 'DISCIPLINE' },
    { key: 'XP_50K',  title: 'Legend',       description: 'Earn 50,000 total XP',  icon: '🏆', category: 'DISCIPLINE' },
    { key: 'XP_100K', title: 'Mythic',       description: 'Earn 100,000 total XP', icon: '🌌', category: 'DISCIPLINE' },
    { key: 'XP_250K', title: 'Transcendent', description: 'Earn 250,000 total XP', icon: '🕳', category: 'DISCIPLINE' },
    // Rank milestones
    { key: 'RANK_UP_B', title: 'B-Rank Hunter',           description: 'Reach B-Rank', icon: '🅱', category: 'RANK' },
    { key: 'RANK_UP_A', title: 'A-Rank Hunter',           description: 'Reach A-Rank', icon: '🅰', category: 'RANK' },
    { key: 'RANK_UP_S', title: 'S-Rank — Shadow Monarch', description: 'Reach S-Rank', icon: '🆂', category: 'RANK' },
    // Total quests
    { key: 'QUESTS_10',   title: 'Getting Started', description: 'Complete 10 quests',    icon: '✅', category: 'DISCIPLINE' },
    { key: 'QUESTS_50',   title: 'Committed',       description: 'Complete 50 quests',    icon: '📋', category: 'DISCIPLINE' },
    { key: 'QUESTS_100',  title: 'Centurion',       description: 'Complete 100 quests',   icon: '💯', category: 'DISCIPLINE' },
    { key: 'QUESTS_250',  title: 'Disciplined',     description: 'Complete 250 quests',   icon: '🎯', category: 'DISCIPLINE' },
    { key: 'QUESTS_500',  title: 'Iron Will',       description: 'Complete 500 quests',   icon: '🪓', category: 'DISCIPLINE' },
    { key: 'QUESTS_1000', title: 'The 1000 Club',   description: 'Complete 1,000 quests', icon: '🏅', category: 'DISCIPLINE' },
    { key: 'QUESTS_2000', title: 'Machine God',     description: 'Complete 2,000 quests', icon: '⚡', category: 'DISCIPLINE' },
    // Active-day consistency
    { key: 'ACTIVE_7',   title: 'One Week Strong',       description: 'Active on 7 different days',   icon: '📅', category: 'STREAK' },
    { key: 'ACTIVE_30',  title: 'One Month In',          description: 'Active on 30 different days',  icon: '🗓', category: 'STREAK' },
    { key: 'ACTIVE_100', title: 'Century of Grind',      description: 'Active on 100 different days', icon: '📆', category: 'STREAK' },
    { key: 'ACTIVE_200', title: 'Consistency Incarnate', description: 'Active on 200 different days', icon: '🔗', category: 'STREAK' },
    { key: 'ACTIVE_365', title: 'The Year of Leveling',  description: 'Active on 365 different days', icon: '🎆', category: 'STREAK' },
    // Vitality
    { key: 'FULL_HP', title: 'Peak Vitality', description: 'Reach full HP', icon: '❤', category: 'DISCIPLINE' },
    // LeetCode mastery
    { key: 'LC_LOG_10',  title: 'Problem Solver',   description: 'Log 10 LeetCode problems',  icon: '🧩', category: 'LEARNING' },
    { key: 'LC_LOG_50',  title: 'Algorithm Adept',  description: 'Log 50 LeetCode problems',  icon: '🧮', category: 'LEARNING' },
    { key: 'LC_LOG_100', title: 'DSA Machine',      description: 'Log 100 LeetCode problems', icon: '💻', category: 'LEARNING' },
    { key: 'LC_LOG_200', title: 'LeetCode Legend',  description: 'Log 200 LeetCode problems', icon: '👨‍💻', category: 'LEARNING' },
    { key: 'LC_HARD_10', title: 'Hard Mode',        description: 'Solve 10 HARD problems',    icon: '🔺', category: 'LEARNING' },
    { key: 'LC_HARD_25', title: 'Fearless',         description: 'Solve 25 HARD problems',    icon: '🔴', category: 'LEARNING' },
    { key: 'LC_HARD_50', title: 'Nightmare Slayer', description: 'Solve 50 HARD problems',    icon: '💀', category: 'LEARNING' },
    // Long discipline streaks
    { key: 'COLD_30',   title: 'Ice Monarch',      description: 'Cold shower 30 days straight',    icon: '🧊', category: 'STREAK' },
    { key: 'NOPORN_30', title: 'Monk Mode',        description: 'NO_PORN 30 days straight',        icon: '🧘', category: 'NOFAP' },
    { key: 'NOPORN_60', title: 'Steel Discipline', description: 'NO_PORN 60 days straight',        icon: '⛓', category: 'NOFAP' },
    { key: 'NOPORN_90', title: 'Reborn',           description: 'NO_PORN 90 days straight',        icon: '🔆', category: 'NOFAP' },
    { key: 'SUN_30',    title: 'Sun Disciple',     description: 'Morning sunlight 30 days',        icon: '🌅', category: 'STREAK' },
    { key: 'NOSODA_30', title: 'Clean Machine',    description: 'No soda 30 days straight',        icon: '🚱', category: 'DISCIPLINE' },
    { key: 'NOAI_10',   title: 'Sharpening Steel', description: 'Code without AI 10 days',         icon: '🔧', category: 'DISCIPLINE' },
    { key: 'NOAI_30',   title: 'Raw Skill',        description: 'Code without AI 30 days',         icon: '🛠', category: 'DISCIPLINE' },
    // Atomic Habits engine
    { key: 'FIRST_HABIT', title: 'Habit Seed',       description: 'Create your first habit',   icon: '🌿', category: 'DISCIPLINE' },
    { key: 'HABIT_3',     title: 'Routine Builder',  description: 'Run 3 active habits',       icon: '🧱', category: 'DISCIPLINE' },
    { key: 'HABIT_5',     title: 'System Architect', description: 'Run 5 active habits',       icon: '🏗', category: 'DISCIPLINE' },
    { key: 'HABIT_10',    title: 'Habit Master',     description: 'Run 10 active habits',      icon: '🧬', category: 'DISCIPLINE' },
    { key: 'KEYSTONE',    title: 'Keystone Bearer',  description: 'Maintain a keystone habit', icon: '🗝', category: 'DISCIPLINE' },
  ];

  constructor(
    private playerService: PlayerService,
    private auth: AuthService
  ) {}

  isSakthi = computed(() => this.auth.player()?.email === 'sakthiveltony@gmail.com');

  // Category filter
  activeCategory = signal<AchCategory>('ALL');
  
  categories = computed((): AchCategory[] => {
    const cats: AchCategory[] = ['ALL', 'DISCIPLINE', 'RANK', 'LEVEL', 'STREAK', 'LEARNING'];
    if (this.isSakthi()) cats.splice(4, 0, 'NOFAP');
    return cats;
  });

  filteredCatalogue = computed(() => {
    const cat = this.activeCategory();
    let catList = this.catalogue;
    if (!this.isSakthi()) {
      catList = catList.filter(a => a.category !== 'NOFAP');
    }
    if (cat === 'ALL') return catList;
    return catList.filter(a => a.category === cat);
  });

  nextUnlocks = computed((): AchievementDef[] => {
    const unlockedKeys = new Set(this.unlocked().map(a => a.achievementKey));
    return this.catalogue
      .filter(a => !unlockedKeys.has(a.key))
      .slice(0, 3);
  });

  setCategory(cat: AchCategory) { this.activeCategory.set(cat); }

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