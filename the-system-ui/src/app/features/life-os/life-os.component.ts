import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LifeOsService } from '../../core/services/life-os.service';
import {
  JobApplication, LeetcodeLog, LeetcodeStats, SkillsGap, SavingsGoal,
  HealthLog, MindLog, SelfDoubtEvidence, EnglishLog, BodyLog, RelationshipLog,
  InterviewReadinessDTO, DeepWorkSession
} from '../../core/models/models';
import { fadeInUp, listStagger } from '../../shared/animations';

type Tab = 'CAREER' | 'HEALTH' | 'MIND' | 'WEALTH' | 'ENGLISH' | 'BODY' | 'RELATIONSHIP';

@Component({
  selector: 'app-life-os',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

  // Wealth
  goals = signal<SavingsGoal[]>([]);

  // Health
  health = signal<HealthLog | null>(null);

  // Mind
  mind: MindLog = {};
  evidence = signal<SelfDoubtEvidence[]>([]);

  // English
  english: EnglishLog = { speakingMin: 20, newWords: 0, mockInterview: false };

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
        break;
      case 'HEALTH':
        this.life.getHealthToday().subscribe(v => this.health.set(v ?? { waterGlasses: 0, breakfastEaten: false, lunchEaten: false, dinnerEaten: false }));
        break;
      case 'MIND':
        this.life.getMindToday().subscribe(v => this.mind = v ?? {});
        this.life.getEvidence().subscribe(v => this.evidence.set(v));
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
    this.life.createJob(this.newJob).subscribe(() => {
      this.toast('◈ Application logged');
      this.newJob = this.blankJob();
      this.life.getJobs().subscribe(v => this.jobs.set(v));
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

  /* ===== Wealth actions ===== */
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
  addWater(): void {
    const h = this.health(); if (!h) return;
    const glasses = Math.min(8, (h.waterGlasses ?? 0) + 1);
    this.life.logWater(glasses).subscribe(v => this.health.set(v));
  }
  saveHealth(): void {
    const h = this.health(); if (!h) return;
    this.life.upsertHealth(h).subscribe(v => { this.health.set(v); this.toast('◈ Health log saved'); });
  }

  /* ===== Mind actions ===== */
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

  /* ===== Body actions ===== */
  saveBody(): void {
    const b = this.body(); if (!b) return;
    this.life.upsertBody(b).subscribe(v => { this.body.set(v); this.toast(`◈ ${v.testosteronePillars}/7 pillars locked in`); });
  }

  /* ===== Relationship actions ===== */
  saveRel(): void {
    const r = this.relationship(); if (!r) return;
    this.life.upsertRelationship(r).subscribe(v => { this.relationship.set(v); this.toast('◈ Bonds updated'); });
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

