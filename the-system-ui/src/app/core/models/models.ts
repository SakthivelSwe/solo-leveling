export interface Player {
  id: number;
  username: string;
  displayName: string;
  email: string;
  rankLevel: string;
  level: number;
  currentXp: number;
  totalXp: number;
  xpToNextLevel: number;
  hp: number;
  maxHp: number;
  equippedTitle?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  player: Player;
}

export interface Stats {
  str: number;
  intelligence: number;
  vit: number;
  agi: number;
  per: number;
  hor: number;
}

export interface PlayerSkill {
  id: number;
  name: string;
  pct: number;
  level: number;
}

export interface Quest {
  id: number;
  questKey: string;
  label: string;
  category: 'DAILY' | 'SKILL' | 'TESTOSTERONE';
  xpReward: number;
  statBoosts: string | null;
  skillBoosts: string | null;
  isCompleted: boolean;
}

export interface DayProgress {
  date: string;
  dayLabel: string;
  questsCompleted: number;
  xpEarned: number;
  isToday: boolean;
}

export interface Achievement {
  id: number;
  achievementKey: string;
  title: string;
  description: string;
  unlockedAt: string;
}

export interface StatusWindow {
  player: Player;
  stats: Stats;
  skills: PlayerSkill[];
  todayQuests: Quest[];
  weeklyProgress: DayProgress[];
  achievements: Achievement[];
  completedToday: number;
  totalQuests: number;
  streak: number;
  motivation: string;
  systemQuote: string;
}

export interface QuestCompletionResult {
  questKey: string;
  questLabel: string;
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  newRank: string;
  rankChanged: boolean;
  stats: Stats;
  statsGained: string[];
  newAchievements: Achievement[];
}

/* ============ Progress analytics ============ */
export interface HeatmapDay {  date: string;
  count: number;
  xp: number;
  intensity: number; // 0..4
}

export interface MonthlyReport {
  monthLabel: string;
  daysActive: number;
  daysElapsed: number;
  totalQuestsMonth: number;
  totalXpMonth: number;
  perfectDays: number;
  currentStreak: number;
  longestStreak: number;
  avgQuestsPerActiveDay: number;
  bestStat: string;
  weakestStat: string;
  rankLevel: string;
  level: number;
  totalXp: number;
  rankTarget: string;
  systemVerdict: string;
}

export interface Title {
  key: string;
  name: string;
  description: string;
  unlocked: boolean;
  equipped: boolean;
}

export interface Dungeon {
  name: string;
  bossName: string;
  totalHp: number;
  currentHp: number;
  damageDealt: number;
  questsThisWeek: number;
  questsToClear: number;
  cleared: boolean;
  justCleared: boolean;
  rewardXp: number;
  progressPct: number;
  weekStart: string;
}

/* ============ Notification OS ============ */
export interface SystemNotification {  id: number;
  playerId: number;
  title: string;
  message: string;
  type: string; // SYSTEM, ACHIEVEMENT, RANK_DROP, REMINDER
  read: boolean;
  createdAt: string;
}

/* ============ Module 1 — Career OS ============ */
export interface JobApplication {
  id?: number;
  company: string;
  role: string;
  ctcOffered?: number | null;
  status: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'GHOSTED';
  appliedDate?: string;
  notes?: string;
  jobUrl?: string;
}

export interface InterviewRound {
  id?: number;
  applicationId?: number;
  roundNumber: number;
  roundType: 'HR' | 'TECHNICAL' | 'SYSTEM_DESIGN' | 'ASSIGNMENT' | 'FINAL';
  dateScheduled?: string;
  result?: 'PENDING' | 'PASSED' | 'FAILED' | 'NO_SHOW';
  notes?: string;
  feedback?: string;
}

export interface LeetcodeLog {
  id?: number;
  problemName: string;
  problemUrl?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  solvedDate?: string;
  timeTakenMin?: number | null;
  solvedWithoutAi?: boolean;
  language?: string;
  notes?: string;
  topic?: string;
}

export interface LeetcodeStats {
  total: number;
  easy: number;
  medium: number;
  hard: number;
  streak: number;
}

export interface CourseProgress {
  id?: number;
  courseName: string;
  totalTopics: number;
  completedTopics: number;
  lastUpdated?: string;
}

export interface SkillGapItem {
  skillName: string;
  current: number;
  target: number;
  gap: number;
  urgency: 'CRITICAL' | 'HIGH' | 'ON_TRACK';
}
export interface SkillsGap { items: SkillGapItem[]; }

/* ============ Module 4 — Wealth OS ============ */
export interface SavingsGoal {
  id?: number;
  goalName: string;
  target: number;
  current: number;
  deadline?: string;
  achieved?: boolean;
}

export interface BudgetEntry {
  id?: number;
  entryMonth: string; // '2025-01'
  salary: number;
  pgRent: number;
  foodSpend: number;
  transport: number;
  onlineOrders: number;
  misc: number;
  saved: number;
  sipAmount: number;
  notes?: string;
}

/* ============ Module 2 — Health OS ============ */
export interface HealthLog {
  id?: number;
  logDate?: string;
  sleepQuality?: number | null;
  waterGlasses: number;
  breakfastEaten: boolean;
  lunchEaten: boolean;
  dinnerEaten: boolean;
  foodQuality?: number | null;
  energyMorning?: number | null;
  energyAfternoon?: number | null;
  energyEvening?: number | null;
}

/* ============ Module 3 — Mind OS ============ */
export interface MindLog {
  id?: number;
  logDate?: string;
  moodMorning?: number | null;
  moodEvening?: number | null;
  anxietyLevel?: number | null;
  morningIntention?: string;
  eveningReflection?: string;
  todayWin?: string;
  gratitude?: string;
  darkThought?: string;
  counterEvidence?: string;
}

export interface SelfDoubtEvidence {
  id?: number;
  entryDate?: string;
  evidence: string;
  category?: 'SKILL' | 'HEALTH' | 'CHARACTER' | 'SOCIAL' | 'CAREER';
}

/* ============ Module 5 — English OS ============ */
export interface EnglishLog {
  id?: number;
  logDate?: string;
  speakingMin: number;
  resourceUsed?: string;
  newWords: number;
  mockInterview: boolean;
  topicPracticed?: string;
  selfRating?: number | null;
  notes?: string;
}

export interface VocabularyLog {
  id?: number;
  word: string;
  meaning: string;
  example?: string;
  learnedDate?: string;
}

/* ============ Module 6 — Body OS ============ */
export interface BodyLog {
  id?: number;
  logDate?: string;
  testosteronePillars?: number;
  coldShower: boolean;
  morningSunMin: number;
  zincMeal: boolean;
  noSoda: boolean;
  noPorn: boolean;
  exerciseDone: boolean;
  sleptBefore1130: boolean;
}

/* ============ Module 9 — Relationship OS ============ */
export interface RelationshipLog {
  id?: number;
  logDate?: string;
  gfCalled: boolean;
  callDurationMin: number;
  callQuality?: number | null;
  familyContact: boolean;
  friendMessage: boolean;
  friendName?: string;
  notes?: string;
}

/* ============ Module 10 — Habits (Atomic Habits engine) ============ */
export interface Habit {
  id: number;
  name: string;
  identityTag?: string | null;
  cue?: string | null;
  craving?: string | null;
  routine?: string | null;
  reward?: string | null;
  twoMinuteVersion?: string | null;
  stackAfterHabitId?: number | null;
  cueTime?: string | null;
  cueLocation?: string | null;
  difficulty: number;
  keystone: boolean;
  activeDays: number;
  archived: boolean;
  completedToday: boolean;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  consistencyPct: number;
  masteryPct: number;
  last30: number[];      // 0 miss, 1 done, 2 two-minute
}

export interface HabitsOverview {
  habits: Habit[];
  dueToday: number;
  completedToday: number;
  longestGlobalStreak: number;
  totalCompletions: number;
  compoundingFactor: number;
  decayFactor: number;
  identityScores: { [tag: string]: number };
  systemVerdict: string;
}

export interface HabitCompletionResult {
  habitId: number;
  habitName: string;
  xpGained: number;
  newCurrentStreak: number;
  newLongestStreak: number;
  twoMinute: boolean;
  keystone: boolean;
  leveledUp: boolean;
  newLevel: number;
  newRank: string;
  rankChanged: boolean;
  systemMessage: string;
}

export interface HabitTemplate {
  key: string;
  name: string;
  identityTag: string;
  cue: string;
  craving: string;
  routine: string;
  reward: string;
  twoMinuteVersion: string;
  cueTime: string;
  difficulty: number;
  keystone: boolean;
  rankHint: string;
}
