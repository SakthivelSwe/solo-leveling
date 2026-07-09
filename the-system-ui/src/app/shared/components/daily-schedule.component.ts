import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ScheduleItem {
  time: string;    // "08:05"
  action: string;
  quests: string[];
  category: 'TESTOSTERONE' | 'DAILY' | 'SKILL' | 'REST';
}

const SCHEDULE: ScheduleItem[] = [
  { time: '08:00', action: 'WAKE UP', quests: [], category: 'REST' },
  { time: '08:05', action: 'COLD SHOWER — last 30s cold', quests: ['COLD_SHOWER'], category: 'TESTOSTERONE' },
  { time: '08:15', action: '20-min squats + pushups + jumping jacks', quests: ['EXERCISE'], category: 'TESTOSTERONE' },
  { time: '08:35', action: 'Morning sunlight + breakfast (eggs + banana + nuts)', quests: ['MORNING_SUN','BREAKFAST','ZINC_MEAL'], category: 'TESTOSTERONE' },
  { time: '09:00', action: 'Office work (Copilot is fine here)', quests: [], category: 'REST' },
  { time: '09:30', action: 'Drink first water bottle', quests: ['WATER'], category: 'DAILY' },
  { time: '13:00', action: 'Proper lunch — rice + dhal. ZERO soft drinks.', quests: ['NO_SODA'], category: 'DAILY' },
  { time: '13:10', action: '5-min deep breathing — cortisol reset', quests: ['BREATHING'], category: 'TESTOSTERONE' },
  { time: '17:00', action: 'Drink second water bottle', quests: ['WATER'], category: 'DAILY' },
  { time: '21:00', action: '1 hr coding WITHOUT AI — no Copilot, no ChatGPT', quests: ['CODE_NO_AI'], category: 'SKILL' },
  { time: '22:00', action: 'Solve 1 LeetCode problem', quests: ['LEETCODE'], category: 'SKILL' },
  { time: '22:30', action: '20-min English — Vanessa YouTube', quests: ['ENGLISH'], category: 'SKILL' },
  { time: '22:50', action: 'Evening reflection + call/message girlfriend', quests: [], category: 'REST' },
  { time: '23:00', action: 'Phone face down. No reels. No porn.', quests: ['NO_REELS','NO_PORN'], category: 'TESTOSTERONE' },
  { time: '23:30', action: 'Sleep. Testosterone is built here.', quests: ['SLEEP'], category: 'DAILY' },
];

@Component({
  selector: 'app-daily-schedule',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="sched system-card">
  <div class="sched-head">
    <span class="mono diam">◈</span>
    <div>
      <h3 class="mono title">TODAY'S DIRECTIVE</h3>
      <p class="tech sub">FOLLOW THIS. NO NEGOTIATION.</p>
    </div>
    <span class="tech clock mono">{{ currentTime() }}</span>
  </div>

  <div class="items">
    <div *ngFor="let item of schedule; let i = index"
         class="item"
         [class.past]="isPast(item.time)"
         [class.now]="isNow(i)"
         [class.future]="!isPast(item.time) && !isNow(i)"
         [attr.data-cat]="item.category">
      <div class="time-col">
        <span class="t mono">{{ item.time }}</span>
        <span class="line" *ngIf="i < schedule.length - 1"></span>
      </div>
      <div class="content">
        <span class="action tech" [class.done-text]="isPast(item.time)">{{ item.action }}</span>
        <div class="quests" *ngIf="item.quests.length > 0">
          <span *ngFor="let q of item.quests" class="qtag mono">{{ q }}</span>
        </div>
      </div>
      <span class="now-tag mono" *ngIf="isNow(i)">▸ NOW</span>
      <span class="done-icon" *ngIf="isPast(item.time)">✓</span>
    </div>
  </div>

  <div class="mandate tech">
    ◈ THIS IS NOT A SUGGESTION. SKIPPING THIS SCHEDULE COSTS YOU HP AND KEEPS YOU E-RANK.
    SUNG JIN-WOO DIDN'T SKIP. NEITHER SHOULD YOU.
  </div>
</div>
  `,
  styles: [`
:host { display: block; }
.sched { padding: 20px; }
.sched-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
.diam { font-size: 1.4rem; color: var(--accent-gold); text-shadow: 0 0 16px var(--accent-gold); }
.title { margin: 0; font-size: .88rem; letter-spacing: 4px; }
.sub { margin: 2px 0 0; font-size: .62rem; letter-spacing: 2px; color: var(--text-secondary); }
.clock { margin-left: auto; font-size: 1.1rem; color: var(--accent-gold); letter-spacing: 2px; }

.items { display: flex; flex-direction: column; }
.item {
  display: flex; gap: 12px; align-items: flex-start; position: relative;
  padding: 8px 6px; border-radius: 8px; transition: background .2s;
}
.item.now { background: rgba(83,74,183,0.12); border-left: 3px solid var(--accent-purple); padding-left: 10px; }
.item.past { opacity: 0.45; }

.time-col { display: flex; flex-direction: column; align-items: center; min-width: 52px; }
.t { font-size: .66rem; letter-spacing: 1px; color: var(--text-secondary); }
.line { flex: 1; width: 1px; background: var(--border); min-height: 16px; margin: 3px 0; }

.content { flex: 1; }
.action { font-size: .82rem; letter-spacing: .5px; color: var(--text-primary); display: block; line-height: 1.4; }
.done-text { text-decoration: line-through; color: var(--text-secondary); }
.quests { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 5px; }
.qtag { font-size: .56rem; letter-spacing: 1px; padding: 2px 7px; border-radius: 5px; background: rgba(83,74,183,0.18); color: #b3aef0; }

.item[data-cat="TESTOSTERONE"] .qtag { background: rgba(226,75,74,0.15); color: #f09595; }
.item[data-cat="SKILL"] .qtag { background: rgba(83,74,183,0.22); color: #b3aef0; }
.item[data-cat="DAILY"] .qtag { background: rgba(29,158,117,0.18); color: #5dcaa5; }

.now-tag { font-size: .6rem; letter-spacing: 1px; color: var(--accent-purple); font-weight: 700; margin-top: 2px; animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }
.done-icon { color: var(--accent-teal); font-size: .9rem; margin-top: 2px; }

.item[data-cat="TESTOSTERONE"] .t { color: rgba(226,75,74,0.6); }
.item[data-cat="SKILL"] .t { color: rgba(83,74,183,0.8); }

.mandate {
  margin-top: 16px; padding: 12px 14px; border-radius: 8px;
  background: rgba(226,75,74,0.06); border: 1px solid rgba(226,75,74,0.20);
  font-size: .64rem; letter-spacing: 1px; color: rgba(240,149,149,0.7); line-height: 1.6;
}
  `],
})
export class DailyScheduleComponent implements OnInit, OnDestroy {
  readonly schedule = SCHEDULE;
  currentTime = signal('');
  private timer: any;

  ngOnInit(): void {
    this.tick();
    this.timer = setInterval(() => this.tick(), 30000);
  }
  ngOnDestroy(): void { clearInterval(this.timer); }

  private tick(): void {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    this.currentTime.set(`${h}:${m}`);
  }

  isPast(time: string): boolean {
    const [sh, sm] = time.split(':').map(Number);
    const now = new Date();
    return now.getHours() > sh || (now.getHours() === sh && now.getMinutes() > sm);
  }

  isNow(idx: number): boolean {
    const curr = this.schedule[idx];
    const next = this.schedule[idx + 1];
    if (!next) return false;
    const [sh, sm] = curr.time.split(':').map(Number);
    const [eh, em] = next.time.split(':').map(Number);
    const now = new Date();
    const h = now.getHours(); const m = now.getMinutes();
    const afterStart = h > sh || (h === sh && m >= sm);
    const beforeEnd  = h < eh || (h === eh && m < em);
    return afterStart && beforeEnd;
  }
}

