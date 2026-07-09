import { Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiService, ChatMessage, BossBattle, Evaluation } from '../../core/services/ai.service';
import { fadeInUp, listStagger } from '../../shared/animations';

const BOSS_TOPICS = [
  { label: 'Core Java',          difficulty: 'EASY',   icon: '☕' },
  { label: 'Spring Boot REST',   difficulty: 'EASY',   icon: '🌱' },
  { label: 'Spring Security+JWT',difficulty: 'MEDIUM', icon: '🔐' },
  { label: 'Microservices',      difficulty: 'MEDIUM', icon: '🔗' },
  { label: 'DSA — Arrays/Strings',difficulty: 'EASY',  icon: '📊' },
  { label: 'DSA — Trees/Graphs', difficulty: 'MEDIUM', icon: '🌲' },
  { label: 'System Design',      difficulty: 'HARD',   icon: '🏗️' },
  { label: 'Angular + RxJS',     difficulty: 'MEDIUM', icon: '🔺' },
  { label: 'Kafka + Redis',      difficulty: 'HARD',   icon: '⚡' },
  { label: 'English — HR Round', difficulty: 'MEDIUM', icon: '💬' },
];

type View = 'CHAT' | 'BOSS' | 'HISTORY';

@Component({
  selector: 'app-ai-mentor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ai-mentor.component.html',
  styleUrls: ['./ai-mentor.component.scss'],
  animations: [fadeInUp, listStagger],
})
export class AiMentorComponent implements OnInit {
  @ViewChild('chatEnd') chatEnd!: ElementRef;

  view = signal<View>('CHAT');
  chatMessages = signal<ChatMessage[]>([]);
  userInput = '';
  chatLoading = signal(false);
  coachingMsg = signal('');

  // Boss Battle
  readonly topics = BOSS_TOPICS;
  selectedTopic = BOSS_TOPICS[1];
  selectedDifficulty = 'MEDIUM';
  battle = signal<BossBattle | null>(null);
  currentQ = signal(0);
  answer = '';
  evaluations = signal<Evaluation[]>([]);
  battleLoading = signal(false);
  battleHistory = signal<BossBattle[]>([]);

  constructor(private ai: AiService) {}

  ngOnInit(): void {
    // Load coaching message
    this.ai.getCoaching().subscribe({
      next: r => {
        this.coachingMsg.set(r.message);
        this.pushSystem(r.message);
      },
      error: () => this.pushSystem('◈ THE SYSTEM is online. Ask your question, Hunter.')
    });
  }

  setView(v: View): void {
    this.view.set(v);
    if (v === 'HISTORY') this.ai.getBattleHistory().subscribe(h => this.battleHistory.set(h));
  }

  // ── CHAT ──────────────────────────────────────────────────────────────────
  sendChat(): void {
    const msg = this.userInput.trim();
    if (!msg || this.chatLoading()) return;
    this.userInput = '';
    this.chatMessages.update(list => [...list, { role: 'user', text: msg, ts: new Date() }]);
    this.chatLoading.set(true);
    this.ai.chat(msg, 'general').subscribe({
      next: r => { this.pushSystem(r.reply); this.chatLoading.set(false); this.scrollChat(); },
      error: () => { this.pushSystem('◈ CONNECTION FAILED. Try again.'); this.chatLoading.set(false); }
    });
  }

  getSuggestion(): void {
    this.chatLoading.set(true);
    this.ai.getSuggestion().subscribe({
      next: r => {
        try {
          const obj = JSON.parse(r.raw);
          const steps = (obj.steps as string[]).map((s, i) => `${i+1}. ${s}`).join('\n');
          this.pushSystem(`◈ SUGGESTED TASK: ${obj.task}\n\n${steps}\n\nXP ESTIMATE: +${obj.xpEstimate}`);
        } catch { this.pushSystem(r.raw); }
        this.chatLoading.set(false);
        this.scrollChat();
      },
      error: () => { this.pushSystem('◈ Could not generate suggestion.'); this.chatLoading.set(false); }
    });
  }

  // ── BOSS BATTLE ───────────────────────────────────────────────────────────
  startBattle(): void {
    this.battleLoading.set(true);
    this.battle.set(null);
    this.evaluations.set([]);
    this.currentQ.set(0);
    this.answer = '';
    this.ai.startBattle(this.selectedTopic.label, this.selectedDifficulty).subscribe({
      next: b => { this.battle.set(b); this.battleLoading.set(false); },
      error: () => { this.battleLoading.set(false); alert('Failed to start battle. AI may be loading.'); }
    });
  }

  submitAnswer(): void {
    const b = this.battle();
    if (!b || !this.answer.trim()) return;
    this.battleLoading.set(true);
    this.ai.answerQuestion(b.id, this.currentQ(), this.answer).subscribe({
      next: ev => {
        this.evaluations.update(list => [...list, ev]);
        this.answer = '';
        this.battleLoading.set(false);
        const total = b.questions?.length ?? 5;
        if (this.currentQ() < total - 1) {
          this.currentQ.update(q => q + 1);
        } else {
          // All questions done — complete
          this.ai.completeBattle(b.id).subscribe(finished => this.battle.set(finished));
        }
      },
      error: () => this.battleLoading.set(false)
    });
  }

  scoreColor(score: number): string {
    if (score >= 8) return '#1D9E75';
    if (score >= 5) return '#FAC775';
    return '#E24B4A';
  }

  xpLabel(xp: number): string {
    if (xp >= 300) return 'S-RANK PERFORMANCE';
    if (xp >= 150) return 'SATISFACTORY';
    return 'ATTEMPTED — KEEP TRAINING';
  }

  private pushSystem(text: string): void {
    this.chatMessages.update(list => [...list, { role: 'system', text, ts: new Date() }]);
    setTimeout(() => this.scrollChat(), 50);
  }

  private scrollChat(): void {
    try { this.chatEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' }); } catch {}
  }

  onInputKey(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendChat(); }
  }
}

