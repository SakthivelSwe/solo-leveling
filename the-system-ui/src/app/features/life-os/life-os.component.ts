import { Component, OnInit, signal, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import * as XLSX from 'xlsx';

import { LifeOsService } from '../../core/services/life-os.service';
import {
  JobApplication, LeetcodeLog, LeetcodeStats, SkillsGap, SavingsGoal,
  HealthLog, MindLog, SelfDoubtEvidence, EnglishLog, BodyLog, RelationshipLog,
  InterviewReadinessDTO, DeepWorkSession, DevMasteryProgress, BudgetEntry,
  DietEntry, FoodItem, NetWorthLog, SocialConnection, PlayerConfig,
  ExpenseLog, EmiEntry, SubscriptionEntry, WeeklySummary, MonthlySummary,
  AccountEntry, IncomeLog, TransactionEntry, BankStatementRow, StatementHeader, ChitFund
} from '../../core/models/models';
import { fadeInUp, listStagger } from '../../shared/animations';

type Tab = 'CAREER' | 'HEALTH' | 'MIND' | 'WEALTH' | 'ENGLISH' | 'BODY' | 'RELATIONSHIP';

@Component({
  selector: 'app-life-os',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgChartsModule],
  templateUrl: './life-os.component.html',
  styleUrls: ['./life-os.component.scss'],
  animations: [fadeInUp, listStagger],
})
export class LifeOsComponent implements OnInit, OnDestroy {
  readonly tabs: { key: Tab; label: string; icon: string; color: string }[] = [
    { key: 'CAREER', label: 'Career', icon: '💼', color: '#534AB7' },
    { key: 'HEALTH', label: 'Health', icon: 'ÃƒÂ¢Ã‚ÂÃ‚Â¤', color: '#1D9E75' },
    { key: 'MIND', label: 'Mind', icon: '🧠', color: '#378ADD' },
    { key: 'WEALTH', label: 'Wealth', icon: '💰', color: '#FAC775' },
    { key: 'ENGLISH', label: 'English', icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬â€Ã‚Âº', color: '#BA7517' },
    { key: 'BODY', label: 'Body', icon: '💪', color: '#E24B4A' },
    { key: 'RELATIONSHIP', label: 'Bonds', icon: 'ÃƒÂ°Ã…Â¸Ã‚Â¤Ã‚Â', color: '#F0997B' },
  ];
  active = signal<Tab>('CAREER');

  // Career
  jobs = signal<JobApplication[]>([]);
  leetStats = signal<LeetcodeStats | null>(null);
  leetHistory = signal<LeetcodeLog[]>([]);
  gap = signal<SkillsGap | null>(null);
  newJob: JobApplication = this.blankJob();
  newLeet: LeetcodeLog = this.blankLeet();
  newDeepWork: DeepWorkSession = { codingMinutes: 0, interruptions: 0, mobilePickups: 0, focusSessions: 0 };
  readiness = signal<InterviewReadinessDTO | null>(null);
  deepWork = signal<DeepWorkSession[]>([]);
  devMastery = signal<DevMasteryProgress[]>([]);
  deepWorkChartData: ChartData<'line'> | undefined;
  deepWorkChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    scales: { y: { min: 0, max: 100, ticks: { color: '#8a8a9a' }, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { ticks: { color: '#8a8a9a' }, grid: { display: false } } },
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    elements: { line: { tension: 0.4 }, point: { radius: 4, hoverRadius: 6 } }
  };

  // ─ Wealth OS ─
  wealthView = signal<'LEDGER' | 'ANALYTICS' | 'STATEMENT' | 'GOALS' | 'AI'>('LEDGER');
  selectedPeriod = signal<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'TOTAL'>('MONTHLY');
  showTxModal = signal<boolean>(false);
  txModalType = signal<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');

  goals = signal<SavingsGoal[]>([]);
  budgets = signal<BudgetEntry[]>([]);
  netWorthHistory = signal<NetWorthLog[]>([]);
  newBudget: BudgetEntry = { entryMonth: new Date().toISOString().slice(0, 7), salary: 0, pgRent: 0, foodSpend: 0, transport: 0, onlineOrders: 0, misc: 0, saved: 0, sipAmount: 0 };
  newNetWorth: NetWorthLog = { totalAssets: 0, totalLiabilities: 0, netWorth: 0, cashRunwayMonths: 0 };
  showBudgetForm = false;
  showNetWorthForm = false;
  newGoal: SavingsGoal = { goalName: '', target: 0, current: 0 };
  showGoalForm = false;

  expenses = signal<ExpenseLog[]>([]);
  weeklySummary = signal<WeeklySummary | null>(null);
  monthlySummary = signal<MonthlySummary | null>(null);
  emis = signal<EmiEntry[]>([]);
  subscriptions = signal<SubscriptionEntry[]>([]);
  aiAnalysis = signal<string | null>(null);
  isAnalyzingWealth = signal<boolean>(false);

  // Income tracking
  incomeHistory = signal<IncomeLog[]>([]);
  newIncome: IncomeLog = { amount: 0, category: 'SALARY', description: 'Monthly Salary' };
  incomeCategories = [
    { cat: 'SALARY', icon: '💼', label: 'Salary' },
    { cat: 'FREELANCE', icon: '💻', label: 'Freelance' },
    { cat: 'INVESTMENT', icon: '📈', label: 'Returns' },
    { cat: 'GIFT', icon: 'ÃƒÂ°Ã…Â¸Ã…Â½Ã‚Â', label: 'Gift' },
    { cat: 'OTHER', icon: '💰', label: 'Other' }
  ];

  // Accounts (local state — calculated from transactions)
  accounts: AccountEntry[] = [
    { name: 'Cash', type: 'CASH', balance: 0, icon: '💵', color: '#1D9E75' },
    { name: 'UPI / Bank', type: 'BANK', balance: 0, icon: 'ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â¦', color: '#378ADD' },
    { name: 'Credit Card', type: 'CARD', balance: 0, icon: '💳', color: '#E24B4A' },
    { name: 'Savings', type: 'SAVINGS', balance: 0, icon: 'ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â½', color: '#FAC775' },
  ];

  newExpense: ExpenseLog = { amount: 0, category: 'FOOD', description: '', isEssential: true, paymentMethod: 'UPI', isRecurring: false, expenseDate: new Date().toISOString().split('T')[0] };
  newEmi: EmiEntry = { loanName: '', principalAmount: 0, interestRate: 0, tenureMonths: 0, emiAmount: 0, totalPaid: 0, remainingAmount: 0, status: 'ACTIVE' };
  newSub: SubscriptionEntry = { name: '', amount: 0, frequency: 'MONTHLY', category: 'ENTERTAINMENT', isActive: true };

  showEmiForm = false;
  showSubForm = false;

  // ─ Bank Statement ─
  statementRows = signal<BankStatementRow[]>([]);
  statementHeader = signal<StatementHeader | null>(null);
  statementHistory = signal<any[]>([]);
  selectedStatementId = signal<number | null>(null);
  statementFilter = signal<'ALL' | 'MONTH' | 'WEEK' | 'YEAR' | 'CUSTOM'>('ALL');
  statementGroupBy = signal<'MONTH' | 'WEEK' | 'YEAR'>('MONTH');
  isParsingStatement = signal<boolean>(false);
  isClassifyingStatement = signal<boolean>(false);
  statementCustomStart = '';
  statementCustomEnd = '';
  statementFileName = signal<string>('');
  statementCurrentPage = signal<number>(1);
  statementPageSize = signal<number>(50);
  isExportingStatement = signal(false);

  // ─ Chit Funds ─
  chitFunds = signal<ChitFund[]>([]);
  showChitForm = signal<boolean>(false);
  newChit: ChitFund = this.blankChit();
  showClaimForm: { [id: number]: boolean } = {};
  claimAmounts: { [id: number]: { prize: number; discount: number } } = {};
  goalsSubTab = signal<'SAVINGS' | 'CHIT' | 'NETWORTH'>('SAVINGS');

  quickExpenseCategories = [
    { cat: 'FOOD', icon: '🍕', label: 'Food' },
    { cat: 'TRANSPORT', icon: '🚗', label: 'Transport' },
    { cat: 'SHOPPING', icon: '🛍', label: 'Shopping' },
    { cat: 'ONLINE_ORDER', icon: '📦', label: 'Online' },
    { cat: 'ENTERTAINMENT', icon: '🎥', label: 'Ent.' },
    { cat: 'BILLS', icon: '📋', label: 'Bills' },
    { cat: 'HEALTH', icon: '💊', label: 'Health' },
    { cat: 'EDUCATION', icon: '📚', label: 'Edu.' },
    { cat: 'MISC', icon: '⭐', label: 'Misc' }
  ];

  // Wisdom Engine Carousel
  wisdomIndex = signal<number>(0);
  wisdomTips = [
    { text: "Wealth is what you don't see. The cars not purchased, the diamonds not bought, the watches not worn.", author: "Psychology of Money" },
    { text: "Rich people acquire assets. The poor and middle class acquire liabilities that they think are assets.", author: "Rich Dad Poor Dad" },
    { text: "Getting money requires taking risks, being optimistic, and putting yourself out there. Keeping money requires the opposite of taking risk.", author: "Psychology of Money" },
    { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" }
  ];

  // Doughnut Chart Data
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'bottom', labels: { color: '#8a8a9a' } },
    }
  };
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: [ 'Expenses', 'Savings', 'Investments (SIP)' ],
    datasets: [ { data: [50, 25, 25], backgroundColor: ['#E24B4A', '#1D9E75', '#378ADD'], borderWidth: 0 } ]
  };
  public doughnutChartType: ChartType = 'doughnut';

  // Health
  health = signal<HealthLog | null>(null);
  dietHistory = signal<DietEntry[]>([]);
  aiReport = signal<string | null>(null);
  isGeneratingReport = signal<boolean>(false);

  foodCatalog: FoodItem[] = [
    { name: 'Idli (3 pcs)', category: 'Carb', baseGrams: 150, calories: 117, protein: 3, vitamins: 'Iron, B-Vitamins', icon: '🥟' },
    { name: 'Curd Rice', category: 'Probiotic', baseGrams: 200, calories: 230, protein: 6, vitamins: 'Calcium, B12', icon: '🥣' },
    { name: 'Boiled Eggs (2)', category: 'Protein', baseGrams: 100, calories: 155, protein: 13, vitamins: 'B12, Vitamin D', icon: '🥚' },
    { name: 'Peanuts (Roasted)', category: 'Nut', baseGrams: 30, calories: 161, protein: 7, vitamins: 'Vitamin E, Magnesium', icon: '🥜' },
    { name: 'Banana', category: 'Fruit', baseGrams: 118, calories: 105, protein: 1, vitamins: 'Potassium, Vitamin B6', icon: '🍌' },
    { name: 'Chana / Sundal', category: 'Protein', baseGrams: 100, calories: 164, protein: 9, vitamins: 'Iron, Folate', icon: '🥙' },
    { name: 'Chapati (2 pcs)', category: 'Carb', baseGrams: 80, calories: 200, protein: 6, vitamins: 'Iron, Magnesium', icon: '🫓' },
    { name: 'Milk (1 Glass)', category: 'Dairy', baseGrams: 200, calories: 122, protein: 6, vitamins: 'Calcium, Vitamin D', icon: '🥛' }
  ];

  // Mind
  // Mind extras
  mind: MindLog = {};
  moodHistory = signal<MindLog[]>([]);
  evidence = signal<SelfDoubtEvidence[]>([]);
  stoicQuoteIndex = signal<number>(0);
  stoicInterval: any;
  stoicQuotes = [
    { quote: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
    { quote: "We suffer more often in imagination than in reality.", author: "Seneca" },
    { quote: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
    { quote: "The obstacle in the path becomes the path. Never forget, within every obstacle is an opportunity to improve our condition.", author: "Ryan Holiday" }
  ];


  // Meditation
  isMeditating = signal(false);
  meditationMinutes = signal(10);
  meditationInterval: any;
  clarityBuffEnd = signal<string | null>(null);
  clarityRemaining = signal<string>('');
  clarityInterval: any;

  // English
  english: EnglishLog = { speakingMin: 0, newWords: 0, mockInterview: false };
  newWordInput: string = '';

  // Body
  body = signal<BodyLog | null>(null);

  // Health extras
  sleepHours = signal<number>(7);
  stepCount = signal<number>(0);

  // Body — computed testosterone score from pillars
  testosteroneScore = computed(() => {
    const b = this.body();
    if (!b) return 0;
    let score = 0;
    if (b.coldShower) score += 14;
    if (b.exerciseDone) score += 14;
    if (b.zincMeal) score += 14;
    if (b.noSoda) score += 14;
    if (b.noPorn) score += 14;
    if (b.sleptBefore1130) score += 14;
    if (b.morningSunMin >= 15) score += 16;
    return Math.min(100, score);
  });

  // Relationship
  relationship = signal<RelationshipLog | null>(null);
  connections = signal<SocialConnection[]>([]);
  newConnection: SocialConnection = { name: '', relationType: 'FRIEND', targetContactFrequencyDays: 7, lastContactDate: new Date().toISOString().split('T')[0], healthScore: 100 };
  showConnectionForm = false;

  readonly statuses = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED'];

  constructor(private life: LifeOsService, private snack: MatSnackBar) {}

  ngOnInit(): void { this.loadTab('CAREER'); }

  select(tab: Tab): void { this.active.set(tab); this.loadTab(tab); }

  private loadTab(tab: Tab): void {
    switch (tab) {
      case 'CAREER':
        this.life.getJobs().subscribe(v => this.jobs.set(v));
        this.life.leetcodeStats().subscribe(v => this.leetStats.set(v));
        this.life.leetcodeHistory().subscribe(v => this.leetHistory.set(v.slice(0, 8)));
        this.life.skillsGap().subscribe(v => this.gap.set(v));
        this.life.interviewReadiness().subscribe(v => this.readiness.set(v));
        this.life.getDeepWorkWeekly().subscribe(v => {
          this.deepWork.set(v);
          this.updateDeepWorkChart(v);
        });
        break;
      case 'WEALTH':
        this.life.getGoals().subscribe(v => this.goals.set(v));
        this.life.getBudgets().subscribe(v => {
          this.budgets.set(v);
          this.updateWealthChart(v);
        });
        this.life.getNetWorthHistory().subscribe(v => this.netWorthHistory.set(v));
        this.life.getExpenses().subscribe(v => this.expenses.set(v));
        this.life.getWeeklySummary().subscribe(v => this.weeklySummary.set(v));
        this.life.getMonthlySummary().subscribe(v => {
          this.monthlySummary.set(v);
          this.updateAdvancedWealthChart(v);
        });
        this.life.getEmis().subscribe(v => this.emis.set(v));
        this.life.getSubscriptions().subscribe(v => this.subscriptions.set(v));
        this.loadStatementHistory();
        this.startWisdomEngine();
        this.loadIncomeHistory();
        this.life.getChitFunds().subscribe(v => this.chitFunds.set(v));
        break;
      case 'HEALTH':
        this.life.getHealthToday().subscribe(v => this.health.set(v ?? { waterGlasses: 0, breakfastEaten: false, lunchEaten: false, dinnerEaten: false }));
        this.life.getDietHistory().subscribe(v => this.dietHistory.set(v));
        break;
      case 'MIND':
        this.life.getMindToday().subscribe(v => this.mind = v ?? {});
        this.life.getMindHistory().subscribe(v => this.moodHistory.set(v.slice(0, 7)));
        this.life.getEvidence().subscribe(e => this.evidence.set(e));
        this.startStoicEngine();
        break;
      case 'BODY':
        this.life.getBodyToday().subscribe(v => this.body.set(v ?? this.blankBody()));
        break;
      case 'RELATIONSHIP':
        this.life.getRelationshipToday().subscribe(v => this.relationship.set(v ?? this.blankRel()));
        this.life.getSocialConnections().subscribe(v => this.connections.set(v));
        break;
    }
  }

  private toast(msg: string): void {
    this.snack.open(msg, '✕', { duration: 2600, panelClass: 'system-snack', horizontalPosition: 'right', verticalPosition: 'top' });
  }

  /** Compute total protein consumed today from diet history */
  getTodayProtein(): number {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.dietHistory()
      .filter(d => d.consumedDate?.startsWith(todayStr))
      .reduce((acc, d) => acc + (d.proteinGrams || 0), 0);
  }

  adjustSleep(delta: number): void {
    this.sleepHours.update(v => Math.max(0, Math.min(12, parseFloat((v + delta).toFixed(1)))));
  }

  adjustSteps(delta: number): void {
    this.stepCount.update(v => Math.max(0, v + delta));
  }

  /** Count jobs by status for kanban header */
  countJobsByStatus(status: string): number {
    return this.jobs().filter(j => j.status === status).length;
  }

  /** Filter jobs by status for kanban cards */
  filterJobsByStatus(status: string): JobApplication[] {
    return this.jobs().filter(j => j.status === status);
  }

  /* ===== Career actions ===== */
  addJob(): void {
    if (!this.newJob.company || !this.newJob.role) { this.toast('⚠ Company and role required'); return; }
    this.life.createJob(this.newJob).subscribe(v => {
      this.jobs.update(j => [v, ...j]);
      this.newJob = this.blankJob();
      this.toast('◈ Job application logged');
    });
  }

  syncDevMastery(): void {
    this.toast('◈ Syncing with Dev-Mastery...');
    this.life.syncDevMastery().subscribe({
      next: v => {
        this.devMastery.set(v);
        this.toast('◈ Dev-Mastery Progress Synced!');
      },
      error: err => {
        const msg = err.error?.message || 'Sync failed. Ensure Dev-Mastery is running.';
        this.toast('⚠ ' + msg);
      }
    });
  }

  changeStatus(job: JobApplication, status: string): void {
    if (!job.id) return;
    this.life.updateJobStatus(job.id, status).subscribe(() => {
      this.jobs.update(list => list.map(j => j.id === job.id ? { ...j, status: status as any } : j));
    });
  }
  addLeet(): void {
    if (!this.newLeet.problemName) { this.toast('⚠ Problem name required'); return; }
    this.life.logLeetcode(this.newLeet).subscribe(() => {
      this.toast('◈ LeetCode solve logged');
      this.newLeet = this.blankLeet();
      this.life.leetcodeStats().subscribe(v => this.leetStats.set(v));
      this.life.leetcodeHistory().subscribe(v => this.leetHistory.set(v.slice(0, 8)));
    });
  }

  addDeepWork(): void {
    if (this.newDeepWork.codingMinutes <= 0) { this.toast('⚠ Minutes must be greater than 0'); return; }
    this.life.logDeepWork(this.newDeepWork).subscribe(res => {
      this.toast('Deep work logged! +' + res.focusXpEarned + ' XP');
      this.life.getDeepWorkWeekly().subscribe(v => {
        this.deepWork.set(v);
        this.updateDeepWorkChart(v);
      });
      this.newDeepWork = { codingMinutes: 0, interruptions: 0, mobilePickups: 0, focusSessions: 0 };
    });
  }

  updateDeepWorkChart(sessions: DeepWorkSession[]): void {
    if (!sessions || sessions.length === 0) { this.deepWorkChartData = undefined; return; }
    // Sort by date ascending for chart
    const sorted = [...sessions].reverse(); // assuming api returns newest first or we just reverse to get chronological
    this.deepWorkChartData = {
      labels: sorted.map(s => s.sessionDate?.substring(5, 10) || ''),
      datasets: [
        { data: sorted.map(s => s.focusScore || 0), label: 'Focus Score', borderColor: '#b3aef0', backgroundColor: 'rgba(179, 174, 240, 0.1)', fill: true }
      ]
    };
  }

  addGoal(): void {
    if (!this.newGoal.goalName || this.newGoal.target <= 0) { this.toast('⚠ Valid name and target required'); return; }
    this.life.createGoal(this.newGoal).subscribe(g => {
      this.toast('◈ Savings Goal Added');
      this.goals.update(list => [...list, g]);
      this.newGoal = { goalName: '', target: 0, current: 0 };
      this.showGoalForm = false;
    });
  }

  saveBudget(): void {
    if (this.newBudget.salary <= 0) { this.toast('⚠ Salary must be > 0'); return; }
    this.life.upsertBudget(this.newBudget).subscribe(b => {
      this.toast('◈ Budget Logged for ' + b.entryMonth);
      this.life.getBudgets().subscribe(v => {
        this.budgets.set(v);
        this.updateWealthChart(v);
      });
      this.showBudgetForm = false;
    });
  }

  saveNetWorth(): void {
    if (this.newNetWorth.totalAssets < 0) return;
    this.life.logNetWorth(this.newNetWorth).subscribe(nw => {
      this.toast('◈ Net Worth Logged');
      this.netWorthHistory.update(list => [nw, ...list]);
      this.showNetWorthForm = false;
      this.newNetWorth = { totalAssets: 0, totalLiabilities: 0, netWorth: 0, cashRunwayMonths: 0 };
    });
  }

  /* ===== Wealth actions ===== */
  switchWealthView(view: 'LEDGER' | 'ANALYTICS' | 'STATEMENT' | 'GOALS' | 'AI'): void {
    this.wealthView.set(view);
  }

  openTxModal(type: 'INCOME' | 'EXPENSE' | 'TRANSFER'): void {
    this.txModalType.set(type);
    const today = new Date().toISOString().split('T')[0];
    if (type === 'EXPENSE') this.newExpense = { amount: 0, category: 'FOOD', description: '', isEssential: true, paymentMethod: 'UPI', isRecurring: false, expenseDate: today };
    if (type === 'INCOME') this.newIncome = { amount: 0, category: 'SALARY', description: 'Monthly Salary', incomeDate: today };
    this.showTxModal.set(true);
  }

  closeTxModal(): void { this.showTxModal.set(false); }

  submitTransaction(): void {
    const type = this.txModalType();
    if (type === 'EXPENSE') { this.logExpense(); this.closeTxModal(); }
    else if (type === 'INCOME') { this.logIncome(); this.closeTxModal(); }
  }

  loadIncomeHistory(): void {
    this.life.getIncomeHistory().subscribe({ next: v => this.incomeHistory.set(v), error: () => {} });
  }

  logIncome(): void {
    if (this.newIncome.amount <= 0) { this.toast('⚠ Enter a valid income amount'); return; }
    this.life.logIncome(this.newIncome).subscribe({
      next: v => {
        this.toast(`◈ Income logged: ₹${v.amount}`);
        this.incomeHistory.update(list => [v, ...list]);
        this.life.getMonthlySummary().subscribe(s => {
          this.monthlySummary.set(s);
          this.updateAdvancedWealthChart(s);
        });
        this.newIncome = { amount: 0, category: 'SALARY', description: 'Monthly Salary' };
      },
      error: () => this.toast('⚠ Income logging failed')
    });
  }

  getTransactionList(): { date: string; type: 'INCOME' | 'EXPENSE'; amount: number; category: string; description: string; icon: string; isEssential?: boolean }[] {
    const expenses = this.expenses().map(e => ({
      date: e.expenseDate || '', type: 'EXPENSE' as const,
      amount: e.amount, category: e.category,
      description: e.description, icon: this.getCategoryIcon(e.category),
      isEssential: e.isEssential
    }));
    const income = this.incomeHistory().map(i => ({
      date: i.incomeDate || '', type: 'INCOME' as const,
      amount: i.amount, category: i.category,
      description: i.description, icon: this.getIncomeIcon(i.category)
    }));
    return [...income, ...expenses].sort((a, b) => b.date.localeCompare(a.date));
  }

  getIncomeIcon(cat: string): string {
    return this.incomeCategories.find(c => c.cat === cat)?.icon || '💰';
  }

  getTotalBalance(): number {
    const m = this.monthlySummary();
    if (!m) return 0;
    return m.totalIncome - m.totalExpenses - m.emiTotal - m.subscriptionTotal;
  }

  getFilteredTransactions(): any[] {
    const all = this.getTransactionList();
    const period = this.selectedPeriod();
    const now = new Date();
    if (period === 'DAILY') {
      const today = now.toISOString().split('T')[0];
      return all.filter(t => t.date === today || t.date.startsWith(today));
    } else if (period === 'WEEKLY') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return all.filter(t => new Date(t.date) >= weekAgo);
    } else if (period === 'MONTHLY') {
      const monthPrefix = now.toISOString().slice(0, 7);
      return all.filter(t => t.date.startsWith(monthPrefix));
    }
    return all;
  }

  getMonthlyIncomeTotal(): number {
    return this.incomeHistory().filter(i => (i.incomeDate || '').startsWith(new Date().toISOString().slice(0, 7))).reduce((s, i) => s + i.amount, 0);
  }

  updateWealthChart(budgets: BudgetEntry[]): void {
    if (budgets.length > 0) {
      const b = budgets[0]; // latest budget
      const totalExpenses = b.pgRent + b.foodSpend + b.transport + b.onlineOrders + b.misc;
      this.doughnutChartData = {
        labels: [ 'Expenses', 'Savings', 'Investments (SIP)' ],
        datasets: [ {
          data: [totalExpenses, b.saved, b.sipAmount],
          backgroundColor: ['#E24B4A', '#1D9E75', '#378ADD'],
          borderColor: '#0a0a0f',
          hoverOffset: 4
        } ]
      };
    }
  }

  startWisdomEngine(): void {
    setInterval(() => {
      this.wisdomIndex.update(i => (i + 1) % this.wisdomTips.length);
    }, 10000); // rotate every 10 seconds
  }

  bumpGoal(goal: SavingsGoal, amount: number): void {
    if (!goal.id) return;
    const next = Math.max(0, goal.current + amount);
    this.life.updateGoal(goal.id, next).subscribe(g => {
      this.goals.update(list => list.map(x => x.id === g.id ? g : x));
      if (g.achieved) this.toast(`🏆 Goal cleared — ${g.goalName}`);
    });
  }
  goalPct(g: SavingsGoal): number { return Math.min(100, Math.round((g.current / g.target) * 100)); }

  updateAdvancedWealthChart(summary: MonthlySummary): void {
    const expenses = summary.totalExpenses;
    const savings = summary.totalSaved;
    const emis = summary.emiTotal;
    
    this.doughnutChartData = {
      labels: [ 'Expenses', 'Savings', 'EMIs' ],
      datasets: [ {
        data: [expenses, savings, emis],
        backgroundColor: ['#E24B4A', '#1D9E75', '#BA7517'],
        borderColor: '#0a0a0f',
        hoverOffset: 4
      } ]
    };
  }

  setQuickCategory(cat: string): void {
    this.newExpense.category = cat;
  }

  getCategoryIcon(cat: string): string {
    return this.quickExpenseCategories.find(c => c.cat === cat)?.icon || '⭐';
  }

  logExpense(): void {
    if (this.newExpense.amount <= 0) { this.toast('⚠ Enter a valid amount'); return; }
    if (!this.newExpense.description) this.newExpense.description = this.newExpense.category;
    if (!this.newExpense.expenseDate) this.newExpense.expenseDate = new Date().toISOString().split('T')[0];

    this.life.logExpense(this.newExpense).subscribe(e => {
      this.toast(`◈ Expense logged: ₹${e.amount}`);
      this.expenses.update(list => [e, ...list]);
      this.life.getWeeklySummary().subscribe(v => this.weeklySummary.set(v));
      this.life.getMonthlySummary().subscribe(v => this.monthlySummary.set(v));

      const today = new Date().toISOString().split('T')[0];
      this.newExpense = { amount: 0, category: 'FOOD', description: '', isEssential: true, paymentMethod: 'UPI', isRecurring: false, expenseDate: today };
    });
  }

  calculateEmiAmount(): void {
    if (this.newEmi.principalAmount > 0 && this.newEmi.interestRate > 0 && this.newEmi.tenureMonths > 0) {
      const p = this.newEmi.principalAmount;
      const r = this.newEmi.interestRate / (12 * 100); // monthly interest rate
      const n = this.newEmi.tenureMonths;
      const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      this.newEmi.emiAmount = Math.round(emi);
    }
  }

  addEmi(): void {
    if (this.newEmi.principalAmount <= 0) return;
    this.calculateEmiAmount(); // ensure it's calculated
    this.life.addEmi(this.newEmi).subscribe(e => {
      this.toast('◈ EMI Added');
      this.emis.update(list => [...list, e]);
      this.showEmiForm = false;
      this.newEmi = { loanName: '', principalAmount: 0, interestRate: 0, tenureMonths: 0, emiAmount: 0, totalPaid: 0, remainingAmount: 0, status: 'ACTIVE' };
    });
  }

  payEmi(emiId: number | undefined): void {
    if (!emiId) return;
    this.life.payEmi(emiId).subscribe(e => {
      this.toast('◈ EMI Payment Recorded');
      this.emis.update(list => list.map(x => x.id === e.id ? e : x));
      this.life.getMonthlySummary().subscribe(v => this.monthlySummary.set(v));
    });
  }

  addSubscription(): void {
    if (this.newSub.amount <= 0 || !this.newSub.name) return;
    this.life.addSubscription(this.newSub).subscribe(s => {
      this.toast('◈ Subscription Added');
      this.subscriptions.update(list => [...list, s]);
      this.showSubForm = false;
      this.newSub = { name: '', amount: 0, frequency: 'MONTHLY', category: 'ENTERTAINMENT', isActive: true };
    });
  }

  toggleSub(subId: number | undefined): void {
    if (!subId) return;
    this.life.toggleSubscription(subId).subscribe(s => {
      this.subscriptions.update(list => list.map(x => x.id === s.id ? s : x));
      this.life.getMonthlySummary().subscribe(v => this.monthlySummary.set(v));
    });
  }

  analyzeWealth(): void {
    this.isAnalyzingWealth.set(true);
    this.life.getAiSpendingAnalysis().subscribe({
      next: (analysis) => {
        this.aiAnalysis.set(analysis);
        this.isAnalyzingWealth.set(false);
      },
      error: () => {
        this.toast('⚠ Analysis failed');
        this.isAnalyzingWealth.set(false);
      }
    });
  }

  /* ===== Day name helper ===== */
  getDayName(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : days[d.getDay()];
  }

  /* ===== Bank Statement ===== */
      loadStatementHistory(): void {
    this.life.getStatementHistory().subscribe(history => {
      this.statementHistory.set(history);
    });
  }

  loadSelectedStatement(event: any): void {
    const id = event.target.value;
    if (!id || id === 'new') {
      this.selectedStatementId.set(null);
      this.statementRows.set([]);
      this.statementHeader.set(null);
      this.statementFileName.set('');
      return;
    }
    
    const statementId = Number(id);
    this.selectedStatementId.set(statementId);
    this.life.getStatement(statementId).subscribe(record => {
      this.statementFileName.set(record.fileName);
      this.statementHeader.set({
        accountHolder: record.accountHolder,
        bankName: record.bankName,
        period: record.period,
        openingBalance: record.openingBalance
      });
      this.statementRows.set(record.transactions || []);
      this.statementCurrentPage.set(1);
    });
  }

  deleteStatement(id: number): void {
    if (!confirm('Are you sure you want to delete this statement history?')) return;
    this.life.deleteStatement(id).subscribe(() => {
      this.toast('✓ Statement deleted successfully');
      if (this.selectedStatementId() === id) {
        this.selectedStatementId.set(null);
        this.statementRows.set([]);
        this.statementHeader.set(null);
      }
      this.loadStatementHistory();
    });
  }
  onStatementFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.statementFileName.set(file.name);
    this.isParsingStatement.set(true);
    this.statementRows.set([]);
    this.statementHeader.set(null);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') {
      this.life.uploadPdfStatement(file).subscribe({
        next: (res: any) => {
          this.life.saveBankStatement(file.name, res).subscribe({
            next: (saved: any) => {
               this.loadStatementHistory();
               this.loadSelectedStatement({ target: { value: saved.id } });
               this.isParsingStatement.set(false);
               this.toast('✓ Parsed and saved PDF statement');
            },
            error: () => {
               this.toast('Failed to save statement history');
               this.isParsingStatement.set(false);
            }
          });
        },
        error: () => {
          this.toast('âŒ Failed to parse PDF statement');
          this.isParsingStatement.set(false);
        }
      });
    } else if (ext === 'csv' || ext === 'xls' || ext === 'xlsx') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          this.parseAxisBankXlsRows(rows);
          
          // Construct payload for saving
          const parsed = {
             header: this.statementHeader(),
             rows: this.statementRows()
          };
          this.life.saveBankStatement(file.name, parsed).subscribe({
            next: (saved: any) => {
               this.loadStatementHistory();
               this.loadSelectedStatement({ target: { value: saved.id } });
               this.isParsingStatement.set(false);
               this.toast('✓ Parsed and saved XLS statement');
            }
          });
        } catch (err) {
          this.toast('âŒ Failed to parse statement file');
          this.isParsingStatement.set(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      this.toast('âŒ Please upload XLS, XLSX, CSV, or PDF file');
      this.isParsingStatement.set(false);
    }
  }

  private parseAxisBankXlsRows(rows: any[][]): void {
    const header: StatementHeader = { accountHolder: '', bankName: 'AXIS BANK' };
    const txRows: BankStatementRow[] = [];
    let dataStarted = false;
    let srl = 1;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i].map(c => String(c || '').trim());
      const joined = row.join(' ').toLowerCase();

      // Parse header info
      if (!dataStarted) {
        if (joined.includes('name')) {
          const nameIdx = row.findIndex(c => c.toLowerCase() === 'name' || c.toLowerCase().includes('name'));
          if (nameIdx >= 0 && row[nameIdx + 1]) header.accountHolder = row[nameIdx + 1];
        }
        if (joined.includes('customer id') || joined.includes('customer no')) {
          const idx = row.findIndex(c => c.toLowerCase().includes('customer'));
          if (idx >= 0 && row[idx + 1]) header.customerNo = row[idx + 1];
        }
        if (joined.includes('ifsc')) {
          const idx = row.findIndex(c => c.toLowerCase().includes('ifsc'));
          if (idx >= 0 && row[idx + 1]) header.ifscCode = row[idx + 1];
        }
        if (joined.includes('period') || joined.includes('statement of')) {
          header.period = row.join(' ').replace(/\s+/g, ' ');
        }

        // Detect data header row — look for "Tran Date" or "SRL" or "Date"
        const hasTranDate = row.some(c => c.toLowerCase().includes('tran') && c.toLowerCase().includes('date'));
        const hasSRL = row.some(c => c.toLowerCase() === 'srl' || c.toLowerCase() === 'srl no');
        const hasDate = row.some(c => c.toLowerCase() === 'date');
        if (hasTranDate || hasSRL || hasDate) {
          dataStarted = true;
          continue; // skip the header row itself
        }
        continue;
      }

      // Skip empty rows
      if (!row[0] && !row[1] && !row[2]) continue;
      // Skip OPENING BALANCE row
      if (joined.includes('opening balance')) {
        const balIdx = row.findIndex(c => /^\d/.test(c) && c.includes('.'));
        if (balIdx >= 0) header.openingBalance = parseFloat(row[balIdx].replace(/,/g, ''));
        continue;
      }

      // Try to parse a transaction row
      // Axis Bank XLS format: SRL | Tran Date | CHQNO | PARTICULARS | CR | BAL | SOL
      // Axis Bank PDF format: Tran Date | Chq No | Particulars | Debit | Credit | Balance
      let tranDate = '';
      let particulars = '';
      let debit: number | undefined;
      let credit: number | undefined;
      let balance = 0;

      // Try to detect format from row content
      // Check if row[0] is a number (SRL format)
      const isXlsFormat = /^\d+$/.test(row[0]);

      if (isXlsFormat && row.length >= 5) {
        // Axis Bank XLS: SRL NO | Tran Date | CHQNO | PARTICULARS | DR | CR | BAL | SOL
        tranDate = row[1] || '';
        particulars = row[3] || '';
        
        let debitVal = 0;
        let creditVal = 0;
        let balVal = 0;

        if (row.length >= 7) {
          debitVal = parseFloat((row[4] || '0').replace(/,/g, ''));
          creditVal = parseFloat((row[5] || '0').replace(/,/g, ''));
          balVal = parseFloat((row[6] || '0').replace(/,/g, ''));
        } else {
          // Fallback if columns are missing
          debitVal = parseFloat((row[4] || '0').replace(/,/g, ''));
          balVal = parseFloat((row[5] || '0').replace(/,/g, ''));
        }

        if (debitVal > 0) debit = debitVal;
        if (creditVal > 0) credit = creditVal;
        balance = isNaN(balVal) ? 0 : balVal;
      } else if (row[0].match(/\d{2}[-\/]\d{2}[-\/]\d{2,4}/)) {
        // Date-first format: Tran Date | Chq | Particulars | Debit | Credit | Balance
        tranDate = row[0];
        particulars = row[2] || row[1] || '';
        const debitVal = parseFloat((row[3] || '0').replace(/,/g, ''));
        const creditVal = parseFloat((row[4] || '0').replace(/,/g, ''));
        const balVal = parseFloat((row[5] || '0').replace(/,/g, ''));
        if (debitVal > 0) debit = debitVal;
        if (creditVal > 0) credit = creditVal;
        balance = isNaN(balVal) ? 0 : balVal;
      } else {
        continue; // skip unrecognized rows
      }

      if (!tranDate || !particulars) continue;

      txRows.push({
        srl: srl++,
        tranDate,
        particulars,
        debit: isNaN(debit as number) ? undefined : debit,
        credit: isNaN(credit as number) ? undefined : credit,
        balance,
        selected: true,
        isEditing: false
      });
    }

    this.statementHeader.set(header);
    this.statementRows.set(txRows);
    if (txRows.length === 0) this.toast('⚠ No transactions found. Check file format.');
    else this.toast(`◈ Parsed ${txRows.length} transactions from statement`);
  }

  getFilteredStatementRows(paginated: boolean = true): BankStatementRow[] {
    const rows = this.statementRows();
    const filter = this.statementFilter();
    if (filter === 'ALL') return rows;

    const now = new Date();
    return rows.filter(r => {
      const d = this.parseBankDate(r.tranDate);
      if (!d) return true;
      if (filter === 'MONTH') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else if (filter === 'WEEK') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      } else if (filter === 'YEAR') {
        return d.getFullYear() === now.getFullYear();
      } else if (filter === 'CUSTOM') {
        const start = this.statementCustomStart ? new Date(this.statementCustomStart) : null;
        const end = this.statementCustomEnd ? new Date(this.statementCustomEnd) : null;
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      }
      return true;
    });
  }

  getStatementMonthGroups(): { month: string; rows: BankStatementRow[]; totalDebit: number; totalCredit: number }[] {
    const rows = this.getFilteredStatementRows(false);
    const groups: { [key: string]: BankStatementRow[] } = {};
    for (const r of rows) {
      const d = this.parseBankDate(r.tranDate);
      const key = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, rows]) => ({
        month,
        rows,
        totalDebit: rows.reduce((s, r) => s + (r.debit || 0), 0),
        totalCredit: rows.reduce((s, r) => s + (r.credit || 0), 0)
      }));
  }

  getStatementTotals(): { totalDebit: number; totalCredit: number; net: number } {
    const rows = this.getFilteredStatementRows(false);
    const totalDebit = rows.reduce((s, r) => s + (r.debit || 0), 0);
    const totalCredit = rows.reduce((s, r) => s + (r.credit || 0), 0);
    return { totalDebit, totalCredit, net: totalCredit - totalDebit };
  }

  private parseBankDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    // Handle DD-MM-YYYY or DD/MM/YYYY
    const parts = dateStr.split(/[-\/]/);
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
      return new Date(year, parseInt(m) - 1, parseInt(d));
    }
    return null;
  }

  startEditLabel(row: BankStatementRow): void {
    row.isEditing = true;
  }

  saveLabel(row: BankStatementRow): void {
    row.isEditing = false;
  }

  classifyStatementWithAi(): void {
    const rows = this.statementRows();
    if (rows.length === 0) { this.toast('⚠ No statement loaded'); return; }
    this.isClassifyingStatement.set(true);
    const particulars = rows.map(r => r.particulars);

    this.life.classifyTransactions(particulars).subscribe({
      next: (cats) => {
        const updated = rows.map((r, i) => ({ ...r, aiCategory: cats[i] || 'MISC' }));
        this.statementRows.set(updated);
        this.isClassifyingStatement.set(false);
        this.toast(`◈ AI classified ${updated.length} transactions`);
      },
      error: () => {
        this.toast('⚠ AI classify failed');
        this.isClassifyingStatement.set(false);
      }
    });
  }

  importSelectedToLedger(): void {
    const selected = this.statementRows().filter(r => r.selected);
    if (selected.length === 0) { this.toast('⚠ Select rows to import'); return; }
    let done = 0;
    for (const row of selected) {
      const d = this.parseBankDate(row.tranDate);
      const dateStr = d ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      if (row.debit && row.debit > 0) {
        const expense: ExpenseLog = {
          amount: row.debit,
          category: row.aiCategory || 'MISC',
          description: row.myLabel || row.particulars,
          isEssential: false,
          paymentMethod: 'UPI',
          isRecurring: false,
          expenseDate: dateStr
        };
        this.life.logExpense(expense).subscribe(() => {
          done++;
          if (done === selected.length) this.toast(`◈ ${done} transactions imported to ledger`);
        });
      } else if (row.credit && row.credit > 0) {
        const income: IncomeLog = {
          amount: row.credit,
          category: row.aiCategory === 'SALARY' ? 'SALARY' : 'OTHER',
          description: row.myLabel || row.particulars,
          incomeDate: dateStr
        };
        this.life.logIncome(income).subscribe(() => {
          done++;
          if (done === selected.length) this.toast(`◈ ${done} transactions imported to ledger`);
        });
      } else {
        done++;
      }
    }
  }

  exportStatementAs(format: 'CSV' | 'EXCEL'): void {
    const rows = this.getFilteredStatementRows(false);
    if (rows.length === 0) { this.toast('⚠ No data to export'); return; }

    if (format === 'CSV') {
      const header = 'Date,Particulars,Debit,Credit,Balance,My Label,Category';
      const lines = rows.map(r =>
        `${r.tranDate},"${r.particulars}",${r.debit || ''},${r.credit || ''},${r.balance},"${r.myLabel || ''}",${r.aiCategory || ''}`
      );
      const blob = new Blob([header + '\n' + lines.join('\n')], { type: 'text/csv' });
      this.downloadBlob(blob, 'statement.csv');
    } else {
      const data = rows.map(r => ({
        Date: r.tranDate, Particulars: r.particulars, Debit: r.debit || '',
        Credit: r.credit || '', Balance: r.balance,
        'My Label': r.myLabel || '', Category: r.aiCategory || ''
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Statement');
      XLSX.writeFile(wb, 'statement.xlsx');
      this.toast('◈ Excel exported');
    }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    this.toast(`◈ ${filename} downloaded`);
  }

  toggleStatementRow(row: BankStatementRow): void {
    row.selected = !row.selected;
  }

  toggleAllStatementRows(checked: boolean): void {
    this.statementRows.update(rows => rows.map(r => ({ ...r, selected: checked })));
  }

  getStatementTopMerchant(): string {
    const rows = this.getFilteredStatementRows(false).filter(r => r.debit && r.debit > 0);
    const totals: { [k: string]: number } = {};
    for (const r of rows) {
      const key = r.myLabel || r.particulars.substring(0, 20);
      totals[key] = (totals[key] || 0) + (r.debit || 0);
    }
    let top = ''; let max = 0;
    for (const [k, v] of Object.entries(totals)) { if (v > max) { max = v; top = k; } }
    return top || 'N/A';
  }

  /* ===== Chit Fund ===== */
  addChitFund(): void {
    if (!this.newChit.chitName || this.newChit.totalAmount <= 0 || this.newChit.monthlyContribution <= 0) {
      this.toast('⚠ Fill all required fields'); return;
    }
    this.newChit.totalMonths = Math.round(this.newChit.totalAmount / this.newChit.monthlyContribution);
    this.life.createChitFund(this.newChit).subscribe(c => {
      this.toast(`◈ Chit Fund "${c.chitName}" started`);
      this.chitFunds.update(list => [c, ...list]);
      this.newChit = this.blankChit();
      this.showChitForm.set(false);
    });
  }

  payChitInstallment(chitId: number | undefined): void {
    if (!chitId) return;
    this.life.payChitInstallment(chitId).subscribe(c => {
      this.chitFunds.update(list => list.map(x => x.id === c.id ? c : x));
      this.toast(`◈ Month ${c.currentMonth} paid — ₹${c.monthlyContribution}`);
    });
  }

  claimChitPrize(chit: ChitFund): void {
    if (!chit.id) return;
    const amounts = this.claimAmounts[chit.id] || { prize: 0, discount: 0 };
    if (amounts.prize <= 0) { this.toast('⚠ Enter the prize amount received'); return; }
    this.life.claimChitPrize(chit.id, amounts.prize, amounts.discount).subscribe(c => {
      this.chitFunds.update(list => list.map(x => x.id === c.id ? c : x));
      delete this.showClaimForm[chit.id!];
      this.toast(`🏆 Chit prize claimed! ₹${c.prizeAmount?.toLocaleString()}`);
    });
  }

  chitProgress(c: ChitFund): number {
    return Math.min(100, Math.round((c.currentMonth / c.totalMonths) * 100));
  }

  chitRemainingMonths(c: ChitFund): number {
    return Math.max(0, c.totalMonths - c.currentMonth);
  }

  chitNetBenefit(c: ChitFund): number {
    if (!c.prizeReceived || !c.prizeAmount) return 0;
    return c.prizeAmount - c.totalPaid;
  }

  getActiveChitMonthlyTotal(): number {
    return this.chitFunds().filter(c => c.status === 'ACTIVE').reduce((s, c) => s + c.monthlyContribution, 0);
  }

  private blankChit(): ChitFund {
    return {
      chitName: '', totalAmount: 0, monthlyContribution: 0, totalMonths: 0,
      currentMonth: 0, totalPaid: 0, prizeReceived: false,
      chitType: 'REGULAR', status: 'ACTIVE',
      startDate: new Date().toISOString().split('T')[0]
    };
  }

  toggleClaimForm(chitId: number): void {
    this.showClaimForm[chitId] = !this.showClaimForm[chitId];
    if (this.showClaimForm[chitId] && !this.claimAmounts[chitId]) {
      this.claimAmounts[chitId] = { prize: 0, discount: 0 };
    }
  }

  /* ===== Health actions ===== */
  logFood(food: FoodItem): void {
    const entry: DietEntry = {
      foodName: food.name,
      category: food.category,
      quantityGrams: food.baseGrams,
      calories: food.calories,
      proteinGrams: food.protein,
      vitamins: food.vitamins
    };
    this.life.logDiet(entry).subscribe(v => {
      this.dietHistory.update(h => [v, ...h]);
      this.toast(`◈ Logged ${food.name}`);
    });
  }

  generateAiHealthReport(): void {
    this.isGeneratingReport.set(true);
    this.aiReport.set(null);
    this.life.generateHealthReport().subscribe({
      next: (report) => {
        this.aiReport.set(report);
        this.isGeneratingReport.set(false);
      },
      error: () => {
        this.toast('⚠ Failed to generate AI Report');
        this.isGeneratingReport.set(false);
      }
    });
  }

  addWater(): void {
    const h = this.health(); if (!h) return;
    const glasses = Math.min(8, (h.waterGlasses ?? 0) + 1);
    this.life.logWater(glasses).subscribe(v => this.health.set(v));
  }

  saveHealth(): void {
    const h = this.health(); if (!h) return;
    this.life.upsertHealth(h).subscribe(v => {
      this.health.set(v);
      this.toast('◈ Health logged');
    });
  }

  /* ===== Mind actions ===== */
  startStoicEngine(): void {
    if (this.stoicInterval) clearInterval(this.stoicInterval);
    this.stoicInterval = setInterval(() => {
      this.stoicQuoteIndex.update(i => (i + 1) % this.stoicQuotes.length);
    }, 12000); // rotate every 12 seconds
  }

  saveMind(): void {
    this.life.upsertMind(this.mind).subscribe(v => {
      this.mind = v; this.toast('◈ Reflection saved');
      this.life.getEvidence().subscribe(e => this.evidence.set(e));
    });
  }

  /* ===== English actions ===== */
  saveEnglish(): void {
    this.life.upsertEnglish(this.english).subscribe(() => this.toast('◈ English session logged'));
  }

  addSpeakingTime(mins: number): void {
    this.english.speakingMin = (this.english.speakingMin || 0) + mins;
  }

  addNewWord(): void {
    if (this.newWordInput.trim()) {
      this.english.newWords = (this.english.newWords || 0) + 1;
      this.newWordInput = '';
      this.toast('◈ Vocabulary word added');
    }
  }

  /* ===== Body actions ===== */
  saveBody(): void {
    const b = this.body(); if (!b) return;
    
    // Calculate Pillars
    let pillars = 0;
    if (b.coldShower) pillars++;
    if (b.exerciseDone) pillars++;
    if (b.zincMeal) pillars++;
    if (b.noSoda) pillars++;
    if (b.noPorn) pillars++;
    if (b.sleptBefore1130) pillars++;
    if ((b.morningSunMin ?? 0) >= 15) pillars++;
    b.testosteronePillars = pillars;

    this.life.upsertBody(b).subscribe(v => { this.body.set(v); this.toast(`◈ ${v.testosteronePillars}/7 pillars locked in`); });
  }

  /* ===== Relationship actions ===== */
  saveRelationship(): void {
    const r = this.relationship(); if (!r) return;
    this.life.upsertRelationship(r).subscribe(v => { this.relationship.set(v); this.toast('◈ Bonds updated'); });
  }
  
  addCallTime(mins: number): void {
    const r = this.relationship(); if (!r) return;
    r.callDurationMin = (r.callDurationMin || 0) + mins;
    if (r.callDurationMin > 0) r.gfCalled = true;
  }

  addConnection(): void {
    if (!this.newConnection.name) return;
    this.life.addSocialConnection(this.newConnection).subscribe(c => {
      this.toast('◈ Connection Added');
      this.connections.update(list => [...list, c]);
      this.showConnectionForm = false;
      this.newConnection = { name: '', relationType: 'FRIEND', targetContactFrequencyDays: 7, lastContactDate: new Date().toISOString().split('T')[0], healthScore: 100 };
    });
  }

  contactConnection(c: SocialConnection): void {
    if (!c.id) return;
    this.life.updateSocialContact(c.id, new Date().toISOString().split('T')[0]).subscribe(updated => {
      this.toast(`◈ Contacted ${updated.name}`);
      this.connections.update(list => list.map(x => x.id === updated.id ? updated : x));
    });
  }

  urgencyColor(u: string): string {
    return u === 'CRITICAL' ? '#E24B4A' : u === 'HIGH' ? '#FAC775' : '#1D9E75';
  }

  private blankJob(): JobApplication { return { company: '', role: '', status: 'APPLIED', ctcOffered: null }; }
  private blankLeet(): LeetcodeLog { return { problemName: '', difficulty: 'EASY', solvedWithoutAi: false, language: 'Java', topic: '' }; }
  private blankBody(): BodyLog {
    return { coldShower: false, morningSunMin: 0, zincMeal: false, noSoda: false, noPorn: false, exerciseDone: false, sleptBefore1130: false };
  }
  private blankRel(): RelationshipLog {
    return { gfCalled: false, callDurationMin: 0, familyContact: false, friendMessage: false };
  }

  // --- Meditation Logic ---
  meditationSeconds = 0;
  
  startMeditation() {
    this.life.startMeditation().subscribe({
      next: () => console.log('Meditation started on backend'),
      error: () => console.log('Error starting meditation on backend')
    });
    this.isMeditating.set(true);
    this.meditationSeconds = this.meditationMinutes() * 60;
    
    if (this.meditationInterval) {
      clearInterval(this.meditationInterval);
    }
    
    this.meditationInterval = setInterval(() => {
      this.meditationSeconds--;
      if (this.meditationSeconds <= 0) {
        this.completeMeditation();
      }
    }, 1000);
  }

  cancelMeditation() {
    this.isMeditating.set(false);
    if (this.meditationInterval) {
      clearInterval(this.meditationInterval);
      this.meditationInterval = null;
    }
  }

  completeMeditation() {
    this.cancelMeditation();
    this.toast('◈ Meditation Complete! Clarity Buff Applied (2h)');
    
    // Set buff for 2 hours
    const end = new Date();
    end.setHours(end.getHours() + 2);
    this.clarityBuffEnd.set(end.toISOString());
    
    if (this.clarityInterval) {
      clearInterval(this.clarityInterval);
    }
    
    this.clarityInterval = setInterval(() => {
      this.updateClarityTimer();
    }, 1000);
    this.updateClarityTimer();
    
    // Call backend
    this.life.completeMeditation(this.meditationMinutes()).subscribe({
      next: () => console.log('Meditation synced to backend'),
      error: () => console.log('Could not sync meditation to backend')
    });
  }

  updateClarityTimer() {
    const end = this.clarityBuffEnd();
    if (!end) return;
    
    const diff = new Date(end).getTime() - new Date().getTime();
    if (diff <= 0) {
      this.clarityRemaining.set('');
      this.clarityBuffEnd.set(null);
      if (this.clarityInterval) {
        clearInterval(this.clarityInterval);
        this.clarityInterval = null;
      }
      return;
    }
    
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    this.clarityRemaining.set(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  ngOnDestroy() {
    if (this.meditationInterval) {
      clearInterval(this.meditationInterval);
    }
    if (this.clarityInterval) {
      clearInterval(this.clarityInterval);
    }
    if (this.stoicInterval) {
      clearInterval(this.stoicInterval);
    }
  }
}





