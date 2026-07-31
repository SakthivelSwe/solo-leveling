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

type View = 'CHAT' | 'BOSS' | 'HISTORY' | 'JOURNAL' | 'REPORT' | 'DIRECTIVE';

const CHAT_CONTEXTS = [
  { label: 'General System',         value: 'general',         icon: '◈', description: 'General assistant' },
  { label: 'Omni-Context Analysis',  value: 'system_status',   icon: '🧠', description: 'Analyze full life data' },
  { label: '🔥 Drill Sergeant',       value: 'drill_sergeant',  icon: '🔥', description: 'Brutal accountability. No excuses.' },
  { label: '🏋️ The Coach',           value: 'coach',           icon: '🏋️', description: 'Motivational, supportive, growth-focused' },
  { label: '📊 The Analyst',          value: 'analyst',         icon: '📊', description: 'Data-driven insights on your patterns' },
  { label: '💰 Financial Advisor',    value: 'financial',       icon: '💰', description: 'Wealth building and money strategy' },
  { label: 'Code Reviewer',          value: 'code review',     icon: '💻', description: 'Code quality and architecture review' },
  { label: 'System Architect',       value: 'system design',   icon: '🏗️', description: 'System design coaching' },
  { label: 'Career Strategist',      value: 'career advice',   icon: '📈', description: 'Job search and career planning' },
  { label: 'HR Recruiter',           value: 'hr interview',    icon: '👔', description: 'Interview preparation' }
];

@Component({
  selector: 'app-ai-mentor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ai-mentor.component.html',
  styleUrls: ['./ai-mentor.component.scss'],
  animations: [fadeInUp, listStagger],
})
export class AiMentorComponent implements OnInit {
  // Course Correction Protocol
  triggerCourseCorrection() {
    this.view.set('CHAT');
    this.selectedContext.set(CHAT_CONTEXTS[2]); // Drill Sergeant
    const msg = "SYSTEM ALERT: Disciplinary dip detected. You have missed your morning workout for 2 consecutive days. The Course Correction Protocol has been initiated. What is your excuse, Hunter? Respond immediately.";
    this.chatMessages.update(msgs => [
      ...msgs, 
      { id: Date.now().toString(), role: 'system', text: msg, ts: new Date() }
    ]);
  }
  // Morning Directive
  directiveText = signal<string | null>(null);
  directiveLoading = signal(false);

  generateDirective() {
    this.directiveLoading.set(true);
    setTimeout(() => {
      // Mocked AI directive generation based on sleep/performance
      const text = `SYSTEM SCAN COMPLETE.
SLEEP QUALITY: 65% (SUB-OPTIMAL).
PERFORMANCE: 82% (STABLE).

DIRECTIVE: Your physical vessel is fatigued, but your mind remains sharp. Focus on low-intensity, high-leverage tasks today. Prioritize hydration and a 20-minute restorative nap. Do not engage in heavy lifting or strenuous physical quests today. 

"The obstacle is the way, but only if you have the energy to climb it."`;
      this.directiveText.set(text);
      this.directiveLoading.set(false);
    }, 1500);
  }
  @ViewChild('chatEnd') chatEnd!: ElementRef;

  view = signal<View>('CHAT');
  chatMessages = signal<ChatMessage[]>([]);
  userInput = '';
  chatLoading = signal(false);
  coachingMsg = signal('');

  // Chat contexts
  readonly contexts = CHAT_CONTEXTS;
  selectedContext = signal(CHAT_CONTEXTS[0]);

  // Boss Battle
  readonly topics = BOSS_TOPICS;
  selectedTopic = BOSS_TOPICS[1];
  customTopic = '';
  selectedDifficulty = 'MEDIUM';
  battle = signal<BossBattle | null>(null);
  currentQ = signal(0);
  answer = '';
  evaluations = signal<Evaluation[]>([]);
  battleLoading = signal(false);
  battleHistory = signal<BossBattle[]>([]);

  // Journal Prompts
  journalPrompts = signal<string[]>([
    'What did you accomplish today that your past self would be proud of?',
    'What is one thing you avoided today? Why? What will you do differently?',
    'Rate your focus today from 1-10 and explain why.',
    'What is the one area of your life that needs the most attention right now?',
    'If you could redo today, what would you change?'
  ]);
  journalAnswers = signal<string[]>(['', '', '', '', '']);
  journalLoading = signal(false);
  journalFeedback = signal('');

  // Weekly Report Card
  weeklyReport = signal<string>('');
  weeklyReportLoading = signal(false);
  weeklyGrade = signal<string>('');


  // Web Speech API
  isVoiceMode = signal(false);
  isListening = signal(false);
  recognition: any;
  synth = window.speechSynthesis;

  constructor(private ai: AiService) {
    this.initSpeech();
  }

  private initSpeech(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.onstart = () => this.isListening.set(true);
      this.recognition.onend = () => this.isListening.set(false);
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.userInput = transcript;
        this.sendChat();
      };
    }
  }

  toggleVoiceMode(): void {
    this.isVoiceMode.set(!this.isVoiceMode());
    if (this.isVoiceMode()) {
      this.pushSystem('◈ VOICE MODE ACTIVATED. I AM LISTENING.');
      this.speakText('Voice mode activated. I am listening.');
    } else {
      this.pushSystem('◈ VOICE MODE DEACTIVATED.');
      this.synth.cancel();
      if (this.isListening()) this.recognition.stop();
    }
  }

  startListening(): void {
    if (this.recognition && !this.isListening()) {
      try { this.recognition.start(); } catch (e) {}
    }
  }

  private speakText(text: string): void {
    if (!this.isVoiceMode() || !this.synth) return;
    this.synth.cancel();
    const cleanText = text.replace(/[◈▸*#_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.pitch = 0.8;
    utterance.rate = 1.0;
    
    // Try to find a male, robotic, or stern English voice
    const voices = this.synth.getVoices();
    const systemVoice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Daniel') || v.lang === 'en-GB' || v.lang === 'en-US');
    if (systemVoice) utterance.voice = systemVoice;

    this.synth.speak(utterance);
    
    // Auto-listen after speaking if in Voice mode and chat view
    utterance.onend = () => {
      if (this.isVoiceMode() && this.view() === 'CHAT') {
        this.startListening();
      }
    };
  }

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
    if (v === 'REPORT') this.generateWeeklyReport();
  }

  // ── JOURNAL ───────────────────────────────────────────────────────────────
  submitJournal(): void {
    const answers = this.journalAnswers().filter(a => a.trim() !== '');
    if (answers.length < 3) {
      this.pushSystem('◈ SYSTEM REQUIRES AT LEAST 3 MEANINGFUL ANSWERS FOR ANALYSIS.');
      this.view.set('CHAT');
      return;
    }
    
    this.journalLoading.set(true);
    const payload = this.journalPrompts().map((p, i) => `Q: ${p}\nA: ${this.journalAnswers()[i]}`).join('\n\n');
    
    this.ai.chat(payload, 'coach').subscribe({
      next: r => {
        this.journalFeedback.set(r.reply);
        this.journalLoading.set(false);
      },
      error: () => {
        this.journalFeedback.set('◈ ERROR ANALYZING JOURNAL.');
        this.journalLoading.set(false);
      }
    });
  }

  // ── WEEKLY REPORT ─────────────────────────────────────────────────────────
  generateWeeklyReport(): void {
    if (this.weeklyReport()) return; // Already loaded
    this.weeklyReportLoading.set(true);
    
    // In a real implementation this would fetch aggregated stats from the backend
    // For now we ask the AI to generate a report based on the Omni-Context
    this.ai.chat('Generate my weekly AI Report Card based on my current stats. Grade me from S to E, and give me brutal feedback.', 'system_status').subscribe({
      next: r => {
        this.weeklyReport.set(r.reply);
        this.weeklyGrade.set(r.reply.match(/[SABCDE]-RANK/)?.[0] || 'A-RANK');
        this.weeklyReportLoading.set(false);
      },
      error: () => {
        this.weeklyReport.set('◈ ERROR GENERATING REPORT.');
        this.weeklyReportLoading.set(false);
      }
    });
  }

  // ── CHAT ──────────────────────────────────────────────────────────────────
  sendChat(): void {
    const msg = this.userInput.trim();
    if (!msg || this.chatLoading()) return;
    this.userInput = '';
    this.chatMessages.update(list => [...list, { role: 'user', text: msg, ts: new Date() }]);
    this.chatLoading.set(true);
    this.ai.chat(msg, this.selectedContext().value).subscribe({
      next: r => { 
        this.pushSystem(r.reply); 
        this.chatLoading.set(false); 
        this.scrollChat(); 
        if (this.isVoiceMode()) {
          this.speakText(r.reply);
        }
      },
      error: () => { 
        this.pushSystem('◈ CONNECTION FAILED. Try again.'); 
        this.chatLoading.set(false); 
        if (this.isVoiceMode()) this.speakText('Connection failed.');
      }
    });
  }

  getSuggestion(): void {
    this.chatLoading.set(true);
    this.ai.getSuggestion().subscribe({
      next: r => {
        try {
          const obj = JSON.parse(r.raw);
          const steps = (obj.steps as string[]).map((s, i) => `${i+1}. ${s}`).join('\n');
          const msg = `◈ SUGGESTED TASK: ${obj.task}\n\n${steps}\n\nXP ESTIMATE: +${obj.xpEstimate}`;
          this.pushSystem(msg);
          if (this.isVoiceMode()) this.speakText(`Suggested task: ${obj.task}. ${obj.xpEstimate} XP.`);
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
    
    const topicToUse = this.customTopic.trim() || this.selectedTopic.label;
    
    this.ai.startBattle(topicToUse, this.selectedDifficulty).subscribe({
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

