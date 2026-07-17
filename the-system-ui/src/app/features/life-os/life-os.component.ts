import { Component, OnInit, signal } from '@angular/core';
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
  DietEntry, FoodItem
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
export class LifeOsComponent implements OnInit {
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

  // Wealth
  goals = signal<SavingsGoal[]>([]);
  budgets = signal<BudgetEntry[]>([]);
  newBudget: BudgetEntry = { entryMonth: new Date().toISOString().slice(0, 7), salary: 0, pgRent: 0, foodSpend: 0, transport: 0, onlineOrders: 0, misc: 0, saved: 0, sipAmount: 0 };
  showBudgetForm = false;
  newGoal: SavingsGoal = { goalName: '', target: 0, current: 0 };
  showGoalForm = false;

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

  // English
  english: EnglishLog = { speakingMin: 0, newWords: 0, mockInterview: false };
  newWordInput: string = '';

  // Body
  body = signal<BodyLog | null>(null);

  // Relationship
  relationship = signal<RelationshipLog | null>(null);

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
        this.startWisdomEngine();
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
        break;
    }
  }

  private toast(msg: string): void {
    this.snack.open(msg, '✕', { duration: 2600, panelClass: 'system-snack', horizontalPosition: 'center', verticalPosition: 'top' });
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

  /* ===== Wealth actions ===== */
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
}

