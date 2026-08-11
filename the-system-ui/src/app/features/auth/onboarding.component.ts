import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface Question {
  key: string;
  text: string;
  subtext?: string;
  options: { label: string; value: string; emoji: string }[];
}

interface OnboardingResult {
  bodyLevel: string;
  careerLevel: string;
  disciplineLevel: string;
  englishLevel: string;
  mindLevel: string;
  primaryFocus: string;
  secondaryFocus: string;
  dailyQuestCount: number;
  welcomeMessage: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ob-shell">

      <!-- Progress bar -->
      <div class="ob-progress-wrap">
        <div class="ob-progress-bar" [style.width.%]="progressPct()"></div>
      </div>

      <!-- Result screen -->
      @if (result()) {
        <div class="ob-result">
          <div class="ob-result-icon">⚡</div>
          <h1 class="ob-result-title">YOUR STARTING PROFILE</h1>
          <p class="ob-result-sub">THE SYSTEM has analysed your current level.</p>

          <div class="ob-domains">
            @for (d of domains(); track d.label) {
              <div class="ob-domain-row">
                <span class="ob-domain-label">{{ d.label }}</span>
                <span class="ob-domain-level" [class]="'level-' + d.level.toLowerCase()">{{ d.level }}</span>
              </div>
            }
          </div>

          <div class="ob-focus-box">
            <p class="ob-focus-title">FIRST WEEK FOCUS</p>
            <div class="ob-focus-tags">
              <span class="ob-focus-tag">{{ result()!.primaryFocus }}</span>
              <span class="ob-focus-tag">{{ result()!.secondaryFocus }}</span>
            </div>
          </div>

          <div class="ob-quest-count">
            <span class="ob-qc-num">{{ result()!.dailyQuestCount }}</span>
            <span class="ob-qc-label">small actions per day. That's all.</span>
          </div>

          <p class="ob-welcome-msg">{{ result()!.welcomeMessage }}</p>

          <button class="ob-start-btn" (click)="enterSystem()">
            ENTER THE SYSTEM →
          </button>
        </div>
      }
      @else if (!loading()) {
        <div class="ob-question-wrap">
          <div class="ob-step-label">STEP {{ currentIndex() + 1 }} OF {{ questions.length }}</div>

          <h2 class="ob-question">{{ current().text }}</h2>
          @if (current().subtext) {
            <p class="ob-subtext">{{ current().subtext }}</p>
          }

          <div class="ob-options">
            @for (opt of current().options; track opt.value) {
              <button
                class="ob-option"
                [class.selected]="answers()[current().key] === opt.value"
                (click)="select(current().key, opt.value)">
                <span class="ob-opt-emoji">{{ opt.emoji }}</span>
                <span class="ob-opt-label">{{ opt.label }}</span>
              </button>
            }
          </div>

          @if (answers()[current().key]) {
            <button class="ob-next-btn" (click)="next()">
              {{ isLast() ? 'SEE MY PROFILE →' : 'NEXT →' }}
            </button>
          }
        </div>
      }
      @else {
        <div class="ob-loading">
          <div class="ob-loading-icon">🧠</div>
          <p class="ob-loading-text">ANALYSING YOUR PROFILE...</p>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }

    .ob-shell {
      min-height: 100vh;
      background: linear-gradient(160deg, #0a0a1a 0%, #0f0f2a 60%, #10102a 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 20px 48px;
      position: relative;
    }

    /* Progress */
    .ob-progress-wrap {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: rgba(255,255,255,0.06);
      z-index: 10;
    }
    .ob-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #7C3AED, #A855F7);
      transition: width 0.4s ease;
    }

    /* Question */
    .ob-question-wrap {
      max-width: 540px;
      width: 100%;
      animation: fadeUp 0.4s ease;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .ob-step-label {
      font-size: 0.6rem;
      letter-spacing: 3px;
      color: #7C3AED;
      font-weight: 700;
      margin-bottom: 20px;
    }
    .ob-question {
      font-size: 1.5rem;
      font-weight: 800;
      color: #fff;
      margin: 0 0 8px;
      line-height: 1.3;
    }
    .ob-subtext {
      font-size: 0.78rem;
      color: rgba(255,255,255,0.45);
      margin: 0 0 28px;
      line-height: 1.5;
    }
    .ob-options {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 28px;
    }
    .ob-option {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      background: rgba(255,255,255,0.04);
      border: 1.5px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
      color: rgba(255,255,255,0.7);
      font-size: 0.9rem;
      font-family: inherit;
    }
    .ob-option:hover {
      border-color: rgba(124,58,237,0.5);
      background: rgba(124,58,237,0.1);
      color: #fff;
    }
    .ob-option.selected {
      border-color: #7C3AED;
      background: rgba(124,58,237,0.18);
      color: #fff;
    }
    .ob-opt-emoji { font-size: 1.2rem; flex-shrink: 0; }
    .ob-opt-label { line-height: 1.4; }
    .ob-next-btn {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #7C3AED, #A855F7);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 2px;
      cursor: pointer;
      transition: opacity 0.2s;
      font-family: inherit;
    }
    .ob-next-btn:hover { opacity: 0.85; }

    /* Loading */
    .ob-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .ob-loading-icon { font-size: 3rem; }
    .ob-loading-text {
      font-size: 0.65rem;
      letter-spacing: 3px;
      color: #7C3AED;
      font-weight: 700;
    }

    /* Result */
    .ob-result {
      max-width: 480px;
      width: 100%;
      animation: fadeUp 0.5s ease;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .ob-result-icon { font-size: 2.5rem; text-align: center; }
    .ob-result-title {
      text-align: center;
      font-size: 1.1rem;
      font-weight: 800;
      letter-spacing: 3px;
      color: #fff;
      margin: 0;
    }
    .ob-result-sub {
      text-align: center;
      font-size: 0.72rem;
      color: rgba(255,255,255,0.45);
      margin: 0;
      letter-spacing: 0.5px;
    }
    .ob-domains {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .ob-domain-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ob-domain-label {
      font-size: 0.72rem;
      letter-spacing: 2px;
      color: rgba(255,255,255,0.5);
      font-weight: 700;
    }
    .ob-domain-level {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 3px 10px;
      border-radius: 20px;
    }
    .level-foundation { background: rgba(239,68,68,0.15); color: #EF4444; }
    .level-beginner   { background: rgba(234,179,8,0.15); color: #EAB308; }
    .level-developing { background: rgba(59,130,246,0.15); color: #3B82F6; }
    .level-strong     { background: rgba(34,197,94,0.15); color: #22C55E; }
    .level-advanced   { background: rgba(168,85,247,0.15); color: #A855F7; }

    .ob-focus-box {
      background: rgba(124,58,237,0.1);
      border: 1px solid rgba(124,58,237,0.3);
      border-radius: 12px;
      padding: 14px 18px;
    }
    .ob-focus-title {
      font-size: 0.6rem;
      letter-spacing: 2px;
      color: #7C3AED;
      font-weight: 700;
      margin: 0 0 8px;
    }
    .ob-focus-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .ob-focus-tag {
      background: rgba(124,58,237,0.2);
      border: 1px solid rgba(124,58,237,0.4);
      color: #C4B5FD;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 600;
    }
    .ob-quest-count {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }
    .ob-qc-num {
      font-size: 3rem;
      font-weight: 900;
      color: #A855F7;
      line-height: 1;
    }
    .ob-qc-label {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.5);
    }
    .ob-welcome-msg {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.55);
      line-height: 1.7;
      margin: 0;
      border-left: 2px solid rgba(124,58,237,0.5);
      padding-left: 14px;
    }
    .ob-start-btn {
      padding: 18px;
      background: linear-gradient(135deg, #7C3AED, #A855F7);
      color: #fff;
      border: none;
      border-radius: 14px;
      font-size: 0.9rem;
      font-weight: 800;
      letter-spacing: 2px;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      box-shadow: 0 8px 24px rgba(124,58,237,0.35);
    }
    .ob-start-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(124,58,237,0.45);
    }
  `]
})
export class OnboardingComponent {

  // ── Questions (adaptive by design — future expansion: next question depends on answer) ──
  readonly questions: Question[] = [
    {
      key: 'activityLevel',
      text: 'How active are you right now?',
      subtext: 'Be honest — this helps me give you the right starting point, not an impossible one.',
      options: [
        { emoji: '🛋️', label: 'Almost never — I rarely move or exercise', value: 'never' },
        { emoji: '🚶', label: 'A little — I walk sometimes but no real routine', value: 'sometimes' },
        { emoji: '🏃', label: 'Regularly — I exercise 3+ days a week', value: 'regularly' },
        { emoji: '💪', label: 'Daily — fitness is already part of my life', value: 'daily' },
      ]
    },
    {
      key: 'learningConsistency',
      text: 'How consistently do you learn or study tech?',
      subtext: 'Coding, Java, Angular, LeetCode, System Design — any of these count.',
      options: [
        { emoji: '😴', label: 'Almost never — I haven\'t been consistent', value: 'never' },
        { emoji: '📚', label: 'Sometimes — a few sessions per week but not daily', value: 'sometimes' },
        { emoji: '🧑‍💻', label: 'Regularly — I study most days', value: 'regularly' },
        { emoji: '🔥', label: 'Daily — I am very consistent with learning', value: 'daily' },
      ]
    },
    {
      key: 'disciplineLevel',
      text: 'How would you describe your current discipline?',
      subtext: 'Morning routine, sleeping on time, avoiding distractions, keeping promises to yourself.',
      options: [
        { emoji: '😕', label: 'Low — I struggle to be consistent with anything', value: 'low' },
        { emoji: '🌱', label: 'Medium — I am consistent sometimes but not reliably', value: 'medium' },
        { emoji: '⚡', label: 'High — I have strong routines and rarely slip', value: 'high' },
      ]
    },
    {
      key: 'englishLevel',
      text: 'What is your current English speaking level?',
      subtext: 'Think about job interviews, meetings, explaining your thoughts clearly.',
      options: [
        { emoji: '🔤', label: 'Beginner — I struggle to speak confidently in English', value: 'beginner' },
        { emoji: '💬', label: 'Conversational — I can communicate but need practice', value: 'conversational' },
        { emoji: '🎯', label: 'Fluent — I am comfortable speaking English professionally', value: 'fluent' },
      ]
    },
    {
      key: 'availableTime',
      text: 'How many minutes per day can you realistically commit?',
      subtext: 'Be realistic — not your best day, your average day after work.',
      options: [
        { emoji: '⏱️', label: '15 minutes — I am very busy', value: '15' },
        { emoji: '🕐', label: '30 minutes — I can manage half an hour', value: '30' },
        { emoji: '🕑', label: '1 hour — I can commit a good session daily', value: '60' },
        { emoji: '🚀', label: 'More than 1 hour — I have time and I\'m motivated', value: '90' },
      ]
    },
    {
      key: 'primaryGoal',
      text: 'What is your most important goal right now?',
      options: [
        { emoji: '💼', label: 'Get a better job / switch companies', value: 'better_job' },
        { emoji: '💪', label: 'Get healthier and build physical strength', value: 'fitness' },
        { emoji: '🧠', label: 'Build better habits and discipline', value: 'discipline' },
        { emoji: '🌟', label: 'Improve across all areas of life', value: 'all_areas' },
      ]
    }
  ];

  currentIndex = signal(0);
  answers = signal<Record<string, string>>({});
  loading = signal(false);
  result = signal<OnboardingResult | null>(null);

  current = computed(() => this.questions[this.currentIndex()]);
  isLast = computed(() => this.currentIndex() === this.questions.length - 1);
  progressPct = computed(() => {
    if (this.result()) return 100;
    return Math.round((this.currentIndex() / this.questions.length) * 100);
  });

  domains = computed(() => {
    const r = this.result();
    if (!r) return [];
    return [
      { label: 'BODY',       level: r.bodyLevel },
      { label: 'CAREER',     level: r.careerLevel },
      { label: 'DISCIPLINE', level: r.disciplineLevel },
      { label: 'ENGLISH',    level: r.englishLevel },
      { label: 'MIND',       level: r.mindLevel },
    ];
  });

  constructor(
    private router: Router,
    private http: HttpClient,
    private auth: AuthService
  ) {}

  select(key: string, value: string) {
    this.answers.update(a => ({ ...a, [key]: value }));
  }

  next() {
    if (this.isLast()) {
      this.submit();
    } else {
      this.currentIndex.update(i => i + 1);
    }
  }

  private submit() {
    this.loading.set(true);
    const token = this.auth.token;
    this.http.post<OnboardingResult>(
      `${environment.apiUrl}/api/onboarding/submit`,
      this.answers(),
      { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
    ).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.result.set(result);
        // Update local player data to reflect onboardingComplete = true
        this.auth.markOnboardingComplete();
      },
      error: () => {
        this.loading.set(false);
        // On error, still let them into the system
        this.router.navigate(['/system']);
      }
    });
  }

  enterSystem() {
    this.router.navigate(['/system']);
  }
}
