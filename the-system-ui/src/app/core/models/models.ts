export interface Player {
  id: number;
  username: string;
  displayName: string;
  email: string;
  rankLevel: string;
  level: number;
  currentXp: number;
  totalXp: number;
  systemGold: number;
  xpToNextLevel: number;
  hp: number;
  maxHp: number;
  equippedTitle?: string | null;
  archetype?: string | null;
  currentEnergy?: number;
  inPenaltyZone?: boolean;
  penaltyZoneEndTime?: string;
  createdAt?: string;
  onboardingComplete?: boolean;
}


export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  player: Player;
}

export interface AiCommanderBriefingDTO {
  greeting: string;
  yesterdayRecap: string;
  todayPriorities: string[];
  feedback: string;
  estimatedCompletionPct: number;
  expectedLevelUp: string;
}

export interface Stats {
  str: number;
  intelligence: number;
  vit: number;
  agi: number;
  per: number;
  dis: number;
}

export interface PlayerSkill {
  id: number;
  name: string;
  pct: number;
  level: number;
  skillXp?: number;
  skillRank?: string;
}

export interface JobChangeQuest {
  playerId: number;
  isActive: boolean;
  isCompleted: boolean;
  requiredQuests: number;
  completedQuests: number;
  startedAt: string;
  deadline: string;
}

export interface Quest {
  id: number;
  questKey: string;
  label: string;
  category: 'DAILY' | 'SKILL' | 'TESTOSTERONE' | 'SIDE' | 'MILESTONE' | 'WEEKLY' | 'MONTHLY';
  xpReward: number;
  statBoosts: string | null;
  skillBoosts: string | null;
  isCompleted: boolean;
  priority?: number;
  critical?: boolean;
  bossDamage?: number;
  /** DAILY | WEEKLY | MONTHLY | ONE_TIME */
  timeType?: string;
  /** true if created by this player — can be deleted */
  isCustom?: boolean;
  /** For WEEKLY quests: how many times completed this week */
  weeklyDoneCount?: number;
  /** For MONTHLY quests: how many times completed this month */
  monthlyDoneCount?: number;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  isSkipped?: boolean;
  skipReason?: string;
}

export interface CustomQuestRequest {
  label: string;
  /** DAILY | SKILL | TESTOSTERONE | WEEKLY | MONTHLY */
  category: string;
  xpReward?: number;
  statBoosts?: Record<string, number>;
}


export interface DayProgress {
  date: string;
  dayLabel: string;
  questsCompleted: number;
  xpEarned: number;
  goldEarned: number;
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
  dailyMission?: DailyMissionDTO;
  dopamine?: DopamineSummary;
}

/* ============ New Life OS Models ============ */

export interface DailyMissionDTO {
  mainQuests: Quest[];
  sideQuests: Quest[];
  focusStat: string;
  focusArea: string;
  missionDate: string;
  directive: string;
}

export interface DopamineSummary {
  dopamineScore: number;
  focusPct: number;
  focusMultiplier: number;
  aiNote: string;
}

export interface DopamineLog {
  id?: number;
  logDate: string;
  socialMediaMin: number;
  reelsMin: number;
  gamingMin: number;
  junkFoodItems: number;
  pornViewed: boolean;
  exerciseDone: boolean;
  coldShower: boolean;
  dopamineScore: number;
  focusPct: number;
}

export interface DeepWorkSession {
  id?: number;
  sessionDate?: string;
  codingMinutes: number;
  interruptions: number;
  mobilePickups: number;
  focusSessions: number;
  focusXpEarned?: number;
  focusScore?: number;
  notes?: string;
}

export interface InterviewReadinessDTO {
  perSkill: { [key: string]: number };
  overallPct: number;
  verdict: string;
  weakAreas: string[];
  strongAreas: string[];
  codingHours: number;
}

export interface SkillTreeNode {
  id?: number;
  playerId: number;
  parentSkillName: string;
  nodeName: string;
  nodeKey: string;
  unlocked: boolean;
  progressPct: number;
  prerequisiteNodeKey?: string;
  xpInvested: number;
}

export interface Shadow {
  id?: number;
  playerId: number;
  habitId: number;
  shadowName: string;
  shadowType: string;
  shadowLevel: number;
  powerLevel: number;
  streakAtActivation: number;
  activeSince: string;
  isDeployed?: boolean;
  expeditionEndTime?: string;
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
  systemGold: number;
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

export interface ExpenseLog {
  id?: number;
  expenseDate?: string;  // YYYY-MM-DD — supports backdating
  amount: number;
  category: string;
  description: string;
  isEssential: boolean;
  paymentMethod: string;
  isRecurring: boolean;
}

export interface EmiEntry {
  id?: number;
  loanName: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  startDate?: string;
  totalPaid: number;
  remainingAmount: number;
  nextDueDate?: string;
  status: string;
  notes?: string;
}

export interface SubscriptionEntry {
  id?: number;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  isActive: boolean;
  nextBillingDate?: string;
}

export interface WeeklySummary {
  totalSpent: number;
  categoryBreakdown: { [key: string]: number };
  lastWeekTotal: number;
  changePercent: number;
  dailyAverage: number;
  topCategory: string;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  totalSaved: number;
  savingsRate: number;
  categoryBreakdown: { [key: string]: number };
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
  emiTotal: number;
  subscriptionTotal: number;
}

export interface AccountEntry {
  id?: number;
  name: string;
  type: 'CASH' | 'BANK' | 'CARD' | 'SAVINGS' | 'WALLET';
  balance: number;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface IncomeLog {
  id?: number;
  incomeDate?: string;  // YYYY-MM-DD — supports backdating (e.g. salary received on 5th logged on 7th)
  amount: number;
  category: string; // SALARY, FREELANCE, INVESTMENT, GIFT, OTHER
  description: string;
  accountId?: number;
  accountName?: string;
}

/** One row from an uploaded bank statement (Axis Bank / other banks) */
export interface BankStatementRow {
  srl?: number;
  tranDate: string;       // DD-MM-YYYY from bank
  chqNo?: string;
  particulars: string;    // raw bank description e.g. "UPI/P2M/123/BLINKIT"
  debit?: number;
  credit?: number;
  balance: number;
  myLabel?: string;       // user-editable annotation: "coffee", "clothes", "EMI" etc.
  aiCategory?: string;   // AI-classified: FOOD / TRANSPORT / SHOPPING / etc.
  selected?: boolean;     // for import selection checkbox
  isEditing?: boolean;    // inline label edit mode
}

/** Bank statement header info parsed from the file */
export interface StatementHeader {
  accountHolder: string;
  accountNumber?: string;
  ifscCode?: string;
  period?: string;         // e.g. "From: 06-05-2026 To: 06-08-2026"
  openingBalance?: number;
  bankName: string;        // e.g. "AXIS BANK"
  customerNo?: string;
}

/** Chit Fund investment tracking (Tamil traditional savings — Chit/Cheetu) */
export interface ChitFund {
  id?: number;
  playerId?: number;
  chitName: string;              // e.g. "1 Lakh Chit - Shriram"
  totalAmount: number;           // total chit value e.g. 100000
  monthlyContribution: number;   // monthly installment e.g. 5000
  totalMonths: number;           // 100000/5000 = 20 months
  groupMembers?: number;         // number of members in chit group
  startDate?: string;
  currentMonth: number;          // months paid so far
  totalPaid: number;             // currentMonth × monthlyContribution
  prizeReceived: boolean;        // have you won/received the prize?
  prizeReceivedMonth?: number;   // which month prize was received
  prizeAmount?: number;          // actual cash/gold received
  discountAmount?: number;       // auction discount/bid amount
  chitType: 'REGULAR' | 'JEWEL'; // JEWEL = gold grams instead of cash
  jewelGrams?: number;           // for jewel chit
  status: 'ACTIVE' | 'COMPLETED' | 'WITHDRAWN';
  chitCompany?: string;          // e.g. "Shriram Finance"
  notes?: string;
  lastPaymentDate?: string;
}

export interface CategoryBudget {
  category: string;
  budgetAmount: number;
  spentAmount: number;
  pct: number;
  isOverBudget: boolean;
}

export interface TransactionEntry {
  id?: number;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  category: string;
  description: string;
  accountName: string;
  toAccountName?: string;
  icon: string;
  color: string;
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

/* ============ Phase 2 — Physical Tracking ============ */

/** One daily weigh-in. Weight is stored in kilograms; UI converts to lb. */
export interface BodyMetric {
  id?: number;
  logDate?: string;
  weightKg?: number | null;
  bodyFatPct?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  armCm?: number | null;
  note?: string;
}

/** One night of sleep, with server-computed duration (handles crossing midnight). */
export interface SleepEntry {
  date: string;
  bedtime: string;   // "HH:mm"
  wakeTime: string;  // "HH:mm"
  durationMinutes: number;
  quality?: number | null;
}

/** One point on the 30-day mood trend line. */
export interface MoodPoint {
  date: string;
  mood: number;             // avg of morning/evening (1–10)
  moodMorning?: number | null;
  moodEvening?: number | null;
}

/** One detailed workout entry: an exercise with sets/reps/optional weight. */
export interface WorkoutEntry {
  id?: number;
  workoutDate?: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weightKg?: number | null;
  notes?: string;
}


export interface DevMasteryProgress {
  id?: number;
  playerId?: number;
  topicId: string;
  topicTitle: string;
  pathSlug: string;
  xpEarned: number;
  goldEarned: number;
  completedAt: string;
}

export interface DietEntry {
  id?: number;
  playerId?: number;
  foodName: string;
  category: string;
  quantityGrams: number;
  calories: number;
  proteinGrams: number;
  vitamins?: string;
  consumedDate?: string;
}

export interface FoodItem {
  name: string;
  category: string;
  baseGrams: number;
  calories: number;
  protein: number;
  vitamins: string;
  icon: string;
}

export interface AiCommanderBriefing {
  greeting: string;
  yesterdayRecap: string;
  todayPriorities: string[];
  feedback: string;
  estimatedCompletionPct: number;
  expectedLevelUp: string;
}

/* ============ No Fap Challenge ============ */

export interface ScienceDayCard {
  day: number;
  /** REWIRING | CLARITY | TRANSFORMATION | MASTERY */
  phase: string;
  icon: string;
  title: string;
  description: string;
  /** DOPAMINE | TESTOSTERONE | MEMORY | FOCUS | CONFIDENCE | SLEEP | NEUROPLASTICITY */
  category: string;
}

export interface AddictionInsight {
  /** BRAIN | TESTOSTERONE | RELATIONSHIPS | WORLD_STATS */
  category: string;
  icon: string;
  title: string;
  description: string;
  /** Tanglish (Tamil + English) version of description */
  descriptionTanglish: string;
  /** LOW | MEDIUM | HIGH | CRITICAL */
  severity: string;
}

export interface NoFapStatus {
  currentStreak: number;
  longestStreak: number;
  todayClean: boolean;
  todayConfirmed: boolean;
  milestone: number;
  nextMilestone: number;
  daysToNextMilestone: number;
  phaseName: string;
  phaseIcon: string;
  phaseColor: string;
  scienceTitle: string;
  scienceFact: string;
  scienceCategory: string;
  dayByDayScience: ScienceDayCard[];
  addictionInsights: AddictionInsight[];
  worldStats: string[];
  xpBonusPct: number;
  systemVerdict: string;
  /** Index 0 = 89 days ago, last = today. null = no record, true = clean, false = relapse */
  last90Days: (boolean | null)[];
  /** Today's motivational quote matched to current streak day */
  dailyQuote: string;
  /** Quote author / source */
  dailyQuoteAuthor: string;
  /** Recovery speed vs global avg (100 = on pace, >100 = faster than average) */
  recoveryVelocity: number;
  /** Phase-based unlockable title, e.g. "Week Warrior", "Shadow Monarch" */
  phaseTitle: string;
  /** ISO date string (YYYY-MM-DD) of the first clean day in the current streak */
  startDate?: string;
}

export interface NetWorthLog {
  id?: number;
  playerId?: number;
  logDate?: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  cashRunwayMonths: number;
}

export interface SocialConnection {
  id?: number;
  playerId?: number;
  name: string;
  relationType: string;
  targetContactFrequencyDays: number;
  lastContactDate: string;
  healthScore: number;
}

export interface PlayerConfig {
  id?: number;
  playerId?: number;
  targetProteinGrams: number;
  targetCalories: number;
  targetWaterGlasses: number;
  targetSleepHours: number;
  monthlyBaselineExpenses: number;
}

export interface DataTransferRequest {
  targetEmail: string;
  modules: string[];
  transferMode: string;
}

export interface DataTransferResponse {
  success: boolean;
  message: string;
  transferStats: { [key: string]: number };
}
