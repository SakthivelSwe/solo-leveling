import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import { LifeOsService } from '../../core/services/life-os.service';
import {
  JobApplication, LeetcodeLog, LeetcodeStats, SkillsGap, SavingsGoal,
  HealthLog, MindLog, SelfDoubtEvidence, EnglishLog, BodyLog, RelationshipLog,
  InterviewReadinessDTO, DeepWorkSession, DevMasteryProgress, BudgetEntry,
  DietEntry, FoodItem, NetWorthLog, SocialConnection, PlayerConfig,
  ExpenseLog, EmiEntry, SubscriptionEntry, WeeklySummary, MonthlySummary,
  AccountEntry, IncomeLog, TransactionEntry
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
    { key: 'HEALTH', label: 'Health', icon: '🩺', color: '#1D9E75' },
    { key: 'MIND', label: 'Mind', icon: '🧠', color: '#378ADD' },
    { key: 'WEALTH', label: 'Wealth', icon: '💰', color: '#FAC775' },
    { key: 'ENGLISH', label: 'English', icon: '🗣️', color: '#BA7517' },
    { key: 'BODY', label: 'Body', icon: '🔥', color: '#E24B4A' },
    { key: 'RELATIONSHIP', label: 'Bonds', icon: '🤝', color: '#F0997B' },
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

  // ── Wealth OS ─────────────────────────────────────
  wealthView = signal<'LEDGER' | 'ANALYTICS' | 'ACCOUNTS' | 'GOALS' | 'AI'>('LEDGER');
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
    { cat: 'GIFT', icon: '🎁', label: 'Gift' },
    { cat: 'OTHER', icon: '💡', label: 'Other' }
  ];

  // Accounts (local state — calculated from transactions)
  accounts: AccountEntry[] = [
    { name: 'Cash', type: 'CASH', balance: 0, icon: '💵', color: '#1D9E75' },
    { name: 'UPI / Bank', type: 'BANK', balance: 0, icon: '🏦', color: '#378ADD' },
    { name: 'Credit Card', type: 'CARD', balance: 0, icon: '💳', color: '#E24B4A' },
    { name: 'Savings', type: 'SAVINGS', balance: 0, icon: '🏆', color: '#FAC775' },
  ];

  newExpense: ExpenseLog = { amount: 0, category: 'FOOD', description: '', isEssential: true, paymentMethod: 'UPI', isRecurring: false };
  newEmi: EmiEntry = { loanName: '', principalAmount: 0, interestRate: 0, tenureMonths: 0, emiAmount: 0, totalPaid: 0, remainingAmount: 0, status: 'ACTIVE' };
  newSub: SubscriptionEntry = { name: '', amount: 0, frequency: 'MONTHLY', category: 'ENTERTAINMENT', isActive: true };

  showEmiForm = false;
  showSubForm = false;

  quickExpenseCategories = [
    { cat: 'FOOD', icon: '🍕', label: 'Food' },
    { cat: 'TRANSPORT', icon: '🚗', label: 'Transport' },
    { cat: 'SHOPPING', icon: '🛒', label: 'Shopping' },
    { cat: 'ONLINE_ORDER', icon: '📦', label: 'Online' },
    { cat: 'ENTERTAINMENT', icon: '🎬', label: 'Ent.' },
    { cat: 'BILLS', icon: '📋', label: 'Bills' },
    { cat: 'HEALTH', icon: '💊', label: 'Health' },
    { cat: 'EDUCATION', icon: '📚', label: 'Edu.' },
    { cat: 'MISC', icon: '❓', label: 'Misc' }
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
    { name: 'Idli (3 pcs)', category: 'Carb', baseGrams: 150, calories: 117, protein: 3, vitamins: 'Iron, B-Vitamins', icon: '🍚' },
    { name: 'Curd Rice', category: 'Probiotic', baseGrams: 200, calories: 230, protein: 6, vitamins: 'Calcium, B12', icon: '🍛' },
    { name: 'Boiled Eggs (2)', category: 'Protein', baseGrams: 100, calories: 155, protein: 13, vitamins: 'B12, Vitamin D', icon: '🥚' },
    { name: 'Peanuts (Roasted)', category: 'Nut', baseGrams: 30, calories: 161, protein: 7, vitamins: 'Vitamin E, Magnesium', icon: '🥜' },
    { name: 'Banana', category: 'Fruit', baseGrams: 118, calories: 105, protein: 1, vitamins: 'Potassium, Vitamin B6', icon: '🍌' },
    { name: 'Chana / Sundal', category: 'Protein', baseGrams: 100, calories: 164, protein: 9, vitamins: 'Iron, Folate', icon: '🧆' },
    { name: 'Chapati (2 pcs)', category: 'Carb', baseGrams: 80, calories: 200, protein: 6, vitamins: 'Iron, Magnesium', icon: '🫓' },
    { name: 'Milk (1 Glass)', category: 'Dairy', baseGrams: 200, calories: 122, protein: 6, vitamins: 'Calcium, Vitamin D', icon: '🥛' }
  ];

  // Mind
  mind: MindLog = {};
  evidence = signal<SelfDoubtEvidence[]>([]);
  stoicQuoteIndex = signal<number>(0);
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
        this.life.getDeepWorkWeekly().subscribe(v => this.deepWork.set(v));
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
        this.startWisdomEngine();
        this.loadIncomeHistory();
        break;
      case 'HEALTH':
        this.life.getHealthToday().subscribe(v => this.health.set(v ?? { waterGlasses: 0, breakfastEaten: false, lunchEaten: false, dinnerEaten: false }));
        this.life.getDietHistory().subscribe(v => this.dietHistory.set(v));
        break;
      case 'MIND':
        this.life.getMindToday().subscribe(v => this.mind = v ?? {});
        this.life.getEvidence().subscribe(v => this.evidence.set(v));
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
    this.life.logDeepWork(this.newDeepWork).subscribe(() => {
      this.toast('◈ Deep work logged');
      this.newDeepWork = { codingMinutes: 0, interruptions: 0, mobilePickups: 0, focusSessions: 0 };
      this.life.getDeepWorkWeekly().subscribe(v => this.deepWork.set(v));
    });
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
  switchWealthView(view: 'LEDGER' | 'ANALYTICS' | 'ACCOUNTS' | 'GOALS' | 'AI'): void {
    this.wealthView.set(view);
  }

  openTxModal(type: 'INCOME' | 'EXPENSE' | 'TRANSFER'): void {
    this.txModalType.set(type);
    if (type === 'EXPENSE') this.newExpense = { amount: 0, category: 'FOOD', description: '', isEssential: true, paymentMethod: 'UPI', isRecurring: false };
    if (type === 'INCOME') this.newIncome = { amount: 0, category: 'SALARY', description: 'Monthly Salary' };
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
    return this.incomeCategories.find(c => c.cat === cat)?.icon || '💡';
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
    return this.quickExpenseCategories.find(c => c.cat === cat)?.icon || '❓';
  }

  logExpense(): void {
    if (this.newExpense.amount <= 0) { this.toast('⚠ Enter a valid amount'); return; }
    if (!this.newExpense.description) this.newExpense.description = this.newExpense.category;
    
    this.life.logExpense(this.newExpense).subscribe(e => {
      this.toast(`◈ Expense logged: ₹${e.amount}`);
      this.expenses.update(list => [e, ...list]);
      this.life.getWeeklySummary().subscribe(v => this.weeklySummary.set(v));
      this.life.getMonthlySummary().subscribe(v => this.monthlySummary.set(v));
      
      this.newExpense = { amount: 0, category: 'FOOD', description: '', isEssential: true, paymentMethod: 'UPI', isRecurring: false };
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
    setInterval(() => {
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
  }
}

