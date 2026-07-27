import { Component, OnInit, OnDestroy, signal, effect, HostListener, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HapticsService } from '../../core/services/haptics.service';

import { PlayerService } from '../../core/services/player.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { SseService } from '../../core/services/sse.service';
import {
  StatusWindow, Quest, QuestCompletionResult, PlayerSkill,
  Achievement, DayProgress, Player, HeatmapDay, MonthlyReport, Title, Dungeon,
  DailyMissionDTO, DopamineSummary, JobApplication, LeetcodeLog, LeetcodeStats,
  NoFapStatus
} from '../../core/models/models';
import { LifeOsService } from '../../core/services/life-os.service';
import { UiStateService } from '../../core/services/ui-state.service';
import { ScreenTimeService } from '../../core/services/screen-time.service';

import { StatusWindowComponent } from './status-window/status-window.component';
import { QuestLogComponent } from './quest-log/quest-log.component';
import { SkillTreeComponent } from './skill-tree/skill-tree.component';
import { ProgressChartComponent } from '../progress/progress-chart.component';
import { DailyScheduleComponent } from '../../shared/components/daily-schedule.component';
import { SettingsPanelComponent } from '../../shared/components/settings-panel.component';
import { DungeonCardComponent } from '../dungeon/dungeon-card.component';
import { PomodoroComponent } from './pomodoro.component';
import { AiCommanderComponent } from './ai-commander/ai-commander.component';
import { PenaltyZoneComponent } from './penalty-zone/penalty-zone.component';
import { BossBattleComponent } from '../dungeon/boss-battle/boss-battle.component';
import { RankUpModalComponent } from '../../shared/components/rank-up-modal.component';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-system',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive, FormsModule,
    StatusWindowComponent, QuestLogComponent, SkillTreeComponent, ProgressChartComponent,
    DailyScheduleComponent, SettingsPanelComponent, DungeonCardComponent, PomodoroComponent,
    AiCommanderComponent, PenaltyZoneComponent, BossBattleComponent
  ],
  templateUrl: './system.component.html',
  styleUrls: ['./system.component.scss'],
})
export class SystemComponent implements OnInit, OnDestroy {
  status = signal<StatusWindow | null>(this.playerService.getCachedStatus());
  loading = signal(!this.status());
  pendingKey = signal<string | null>(null);
  settingsOpen = signal(false);
  profileMenuOpen = signal(false);
  pressureLevel = signal(localStorage.getItem('sys_pressure') ?? 'STANDARD');
  /** Mobile section tabs: 'status' | 'quests' | 'schedule' */
  mobileTab = signal<'status' | 'quests' | 'schedule'>('status');

  showBossBattle = false;

  dailyMission = signal<DailyMissionDTO | null>(null);
  dopamine = signal<DopamineSummary | null>(null);
  skillTreeNodes = signal<import('../../core/models/models').SkillTreeNode[]>([]);
  shadows = signal<import('../../core/models/models').Shadow[]>([]);
  showAllQuests = signal<boolean>(true);

  weeklyQuests = signal<Quest[]>([]);
  monthlyQuests = signal<Quest[]>([]);
  milestoneQuests = signal<Quest[]>([]);
  noFap = signal<NoFapStatus | null>(null);
  
  todayDateStr = signal<string>('');
  tomorrowDateStr = signal<string>('');
  private timeInterval: any;

  // Career
  jobs = signal<JobApplication[]>([]);
  leetStats = signal<LeetcodeStats | null>(null);
  leetHistory = signal<LeetcodeLog[]>([]);
  newJob: JobApplication = this.blankJob();
  newLeet: LeetcodeLog = this.blankLeet();
  readonly statuses = ['APPLIED', 'SCREENING', 'INTERVIEW', 'REJECTED', 'OFFER'];

  private blankJob(): JobApplication { return { company: '', role: '', status: 'APPLIED', ctcOffered: 0 }; }
  private blankLeet(): LeetcodeLog { return { problemName: '', difficulty: 'EASY', topic: '', solvedWithoutAi: true }; }

  addJob(): void {
    if (!this.newJob.company || !this.newJob.role) { this.toast('⚠ Company and role required'); return; }
    this.lifeOsService.createJob(this.newJob).subscribe(v => {
      this.jobs.update(j => [v, ...j]);
      this.newJob = this.blankJob();
      this.toast('◈ Job application logged');
    });
  }

  changeStatus(job: JobApplication, status: string): void {
    if (!job.id) return;
    this.lifeOsService.updateJobStatus(job.id, status).subscribe(() => {
      this.jobs.update(list => list.map(j => j.id === job.id ? { ...j, status: status as any } : j));
    });
  }

  agentLogs = signal<string[]>([]);
  isAgentRunning = signal<boolean>(false);

  triggerJobAgent(): void {
    if (this.isAgentRunning()) return;
    this.isAgentRunning.set(true);
    this.agentLogs.set(['[SYSTEM] INITIALIZING AUTONOMOUS AGENT...']);
    
    // Listen for SSE logs via window event (dispatched by SseService)
    const logListener = (e: any) => {
      if (e.detail?.message) {
        this.agentLogs.update(logs => [...logs, `[AGENT] ${e.detail.message}`]);
        if (e.detail.message.includes('MISSION ACCOMPLISHED') || e.detail.message.includes('ABORTING') || e.detail.message.includes('CRITICAL ERROR')) {
          this.isAgentRunning.set(false);
          window.removeEventListener('agentLog', logListener);
          this.toast('◈ Agent run completed.');
          // Refresh jobs
          this.lifeOsService.getJobs().subscribe(v => this.jobs.set(v));
        }
      }
    };
    window.addEventListener('agentLog', logListener);

    this.lifeOsService.triggerJobAgent().subscribe({
      next: () => this.toast('◈ AI Agent Deployed!'),
      error: () => {
        this.toast('⚠ Failed to trigger AI Agent.');
        this.isAgentRunning.set(false);
        window.removeEventListener('agentLog', logListener);
      }
    });
  }

  addLeet(): void {
    if (!this.newLeet.problemName) { this.toast('⚠ Problem name required'); return; }
    this.lifeOsService.logLeetcode(this.newLeet).subscribe(() => {
      this.toast('◈ LeetCode solve logged');
      this.newLeet = this.blankLeet();
      this.lifeOsService.leetcodeStats().subscribe(v => this.leetStats.set(v));
      this.lifeOsService.leetcodeHistory().subscribe(v => this.leetHistory.set(v.slice(0, 8)));
    });
  }

  /** Debounce handle for coalescing bursts of live SSE events into one reload. */
  private reloadTimer: ReturnType<typeof setTimeout> | null = null;

  private zone = inject(NgZone);

  constructor(
    private playerService: PlayerService,
    private lifeOsService: LifeOsService,
    public auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    public notifications: NotificationService,
    public sse: SseService,
    private haptics: HapticsService,
    private uiState: UiStateService,
    private screenTime: ScreenTimeService
  ) {
    // Live sync: On SSE player-update, only reload the lightweight status endpoint
    // (player HP, XP, quests done) — NOT all 12 heavy endpoints. This is the main
    // fix for mobile heat: reduces per-event HTTP requests from 12 → 1.
    effect(() => {
      const tick = this.sse.playerTick();
      if (tick > 0 && !this.loading()) {
        if (this.reloadTimer) clearTimeout(this.reloadTimer);
        this.reloadTimer = setTimeout(() => {
          this.reloadTimer = null;
          this.loadLive(); // lightweight: status + missions only
        }, 700);
      }
    });
  }

  ngOnInit(): void {
    // Run date-update timer OUTSIDE Angular's zone: prevents change detection
    // from firing every 60 seconds even when nothing relevant changed.
    this.zone.runOutsideAngular(() => {
      this.updateDates();
      this.timeInterval = setInterval(() => {
        // Only re-enter the zone when we actually have new data to push
        this.zone.run(() => this.updateDates());
      }, 60000);
    });

    // Listen for penalty trigger from Android ScreenTimeService
    window.addEventListener('penaltyTriggered', (e: any) => {
      const app = e.detail?.app || 'a distracting app';
      this.haptics.warning();
      this.toast(`⚠ PENALTY TRIGGERED! You opened ${app} while HP is critical. FOCUS!`);
      // Optionally trigger HP deduction here via playerService if backend supports it.
    });

    this.loadFull(); // full initial load
    this.notifications.refreshUnread();

    // Start aggressive background tracking
    this.screenTime.startEnforcement();
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    if (this.reloadTimer) { clearTimeout(this.reloadTimer); this.reloadTimer = null; }
  }

  private handleStatusUpdate(s: StatusWindow) {
    const oldStatus = this.status();
    this.status.set(s);
    this.auth.updatePlayer(s.player);
    
    // Check for Rank Up
    if (oldStatus && oldStatus.player.rankLevel && s.player.rankLevel && oldStatus.player.rankLevel !== s.player.rankLevel) {
      this.dialog.open(RankUpModalComponent, {
        data: { oldRank: oldStatus.player.rankLevel, newRank: s.player.rankLevel },
        panelClass: 'fullscreen-dialog',
        backdropClass: 'blur-backdrop'
      });
    }
  }

  /**
   * LIGHTWEIGHT live refresh — called on every SSE player-update event.
   * Only fetches the player status and daily missions (2 HTTP requests max).
   * Keeps the dashboard responsive without hammering the radio/CPU on mobile.
   */
  loadLive(): void {
    this.playerService.getStatus().subscribe({
      next: (s: StatusWindow) => this.handleStatusUpdate(s),
      error: () => this.toast('⚠ Connection to the System lost'),
    });
    this.lifeOsService.getDailyMissions().subscribe({
      next: (dm) => this.dailyMission.set(dm),
      error: () => {},
    });
    this.lifeOsService.getNoFapStatus().subscribe({
      next: (nf) => this.noFap.set(nf),
      error: () => {},
    });
  }

  /**
   * FULL load — called once on ngOnInit and after user actions that change
   * heavy data (shadow extraction, job add, AI sync). Fetches all 12 endpoints.
   */
  loadFull(): void {
    this.loading.set(true);
    this.playerService.getStatus().subscribe({
      next: (s: StatusWindow) => { this.handleStatusUpdate(s); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast('⚠ Connection to the System lost'); },
    });
    this.lifeOsService.getDailyMissions().subscribe({
      next: (dm) => this.dailyMission.set(dm),
      error: () => this.dailyMission.set(null),
    });
    this.lifeOsService.getDopamineToday().subscribe({
      next: (ds) => this.dopamine.set(ds),
      error: () => this.dopamine.set(null),
    });
    this.lifeOsService.getSkillTreeNodes().subscribe({
      next: (nodes) => this.skillTreeNodes.set(nodes),
      error: () => this.skillTreeNodes.set([]),
    });
    this.lifeOsService.getShadows().subscribe({
      next: (shadows) => this.shadows.set(shadows),
      error: () => this.shadows.set([]),
    });
    this.lifeOsService.getJobs().subscribe({
      next: v => this.jobs.set(v),
      error: () => this.jobs.set([])
    });
    this.lifeOsService.leetcodeStats().subscribe({
      next: v => this.leetStats.set(v),
      error: () => this.leetStats.set(null)
    });
    this.lifeOsService.leetcodeHistory().subscribe({
      next: v => this.leetHistory.set(v.slice(0, 8)),
      error: () => this.leetHistory.set([])
    });
    this.loadQuestTabs();
    this.lifeOsService.getNoFapStatus().subscribe({
      next: (nf) => this.noFap.set(nf),
      error: () => this.noFap.set(null),
    });
  }

  /**
   * Alias for legacy callers (quest completion, penalty survived, etc.)
   * — reloads only the live data to keep it lean.
   */
  load(): void {
    this.loadLive();
    this.loadQuestTabs();
  }

  loadQuestTabs(): void {
    this.playerService.getWeeklyQuests().subscribe({
      next: (q) => this.weeklyQuests.set(q),
      error: () => this.weeklyQuests.set([]),
    });
    this.playerService.getMonthlyQuests().subscribe({
      next: (q) => this.monthlyQuests.set(q),
      error: () => this.monthlyQuests.set([]),
    });
    this.playerService.getMilestoneQuests().subscribe({
      next: (q) => this.milestoneQuests.set(q),
      error: () => this.milestoneQuests.set([]),
    });
  }

  private toast(msg: string): void {
    this.snack.open(msg, '✕', { duration: 2600, panelClass: 'system-snack', horizontalPosition: 'center', verticalPosition: 'top' });
  }

  onPenaltySurvived(): void {
    // Full reload needed to refresh HP, player state and quests after penalty clear
    this.loadFull();
    this.toast('◈ Penalty Cleared. The System acknowledges your will to survive.');
  }

  extractingShadow = signal(false);

  hasIgris(): boolean {
    return this.shadows().some(s => s.shadowName === 'IGRIS (Discipline)');
  }

  extractShadow(): void {
    if (this.extractingShadow()) return;
    this.extractingShadow.set(true);
    
    this.lifeOsService.extractDisciplineShadow().subscribe({
      next: (shadow) => {
        this.extractingShadow.set(false);
        this.toast('◈ ARISE. The Shadow of Discipline has joined your army.');
        this.haptics.streak();
        this.shadows.update(s => [...s, shadow]);
      },
      error: (err) => {
        this.extractingShadow.set(false);
        this.toast('⚠ Failed to extract shadow.');
      }
    });
  }

  isGeneratingAi = signal(false);

  canSyncAi(): boolean {
    const lastSync = localStorage.getItem('last_ai_sync');
    if (!lastSync) return true;
    return new Date().getTime() - new Date(lastSync).getTime() > 24 * 60 * 60 * 1000;
  }

  generateAiQuests(): void {
    if (!this.canSyncAi()) {
      this.toast('⚠ AI Quest Sync is on cooldown (24h)');
      return;
    }

    // Use snackbar with action instead of window.confirm (blocked in Android WebView)
    const ref = this.snack.open(
      '◈ Initiate AI Quest Sync? Analyzes your stats and generates personalized quests.',
      'CONFIRM',
      { duration: 8000, panelClass: 'system-snack', horizontalPosition: 'center', verticalPosition: 'top' }
    );

    ref.onAction().subscribe(() => {
      this.isGeneratingAi.set(true);
      this.toast('◈ Generating personalized AI quests...');
      this.playerService.generateAiQuests().subscribe({
        next: () => {
          this.isGeneratingAi.set(false);
          localStorage.setItem('last_ai_sync', new Date().toISOString());
          this.toast('◈ AI Sync Complete! New quests locked in.');
          this.loadQuestTabs();
          this.load();
        },
        error: () => {
          this.isGeneratingAi.set(false);
          this.toast('⚠ AI Sync Failed. Check your API key configuration.');
        }
      });
    });
  }

  /** Called when user adds a custom quest — reload the relevant tab. */
  onQuestAdded(quest: Quest): void {
    this.loadQuestTabs();
    this.load();
  }

  /** Called when user deletes a custom quest — reload to reflect change. */
  onQuestDeleted(questKey: string): void {
    this.loadQuestTabs();
    this.load();
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.profileMenuOpen()) {
      this.profileMenuOpen.set(false);
    }
  }

  onComplete(quest: Quest): void {
    if (quest.latitude !== undefined && quest.longitude !== undefined) {
      this.pendingKey.set(quest.questKey);
      this.toast('◈ Validating coordinates...');
      if (!navigator.geolocation) {
        this.pendingKey.set(null);
        this.toast('⚠ Geolocation not supported by this browser.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.playerService.completeQuest(quest.questKey, pos.coords.latitude, pos.coords.longitude).subscribe({
            next: (res: QuestCompletionResult) => this.handleQuestCompletionSuccess(res),
            error: (err) => {
              this.pendingKey.set(null);
              this.toast(`⚠ ${err.error?.message || 'Geo-verification failed.'}`);
            }
          });
        },
        (err) => {
          this.pendingKey.set(null);
          this.toast('⚠ Failed to get location. Enable GPS permissions.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      this.pendingKey.set(quest.questKey);
      this.playerService.completeQuest(quest.questKey).subscribe({
        next: (res: QuestCompletionResult) => this.handleQuestCompletionSuccess(res),
        error: () => this.pendingKey.set(null),
      });
    }
  }

  onVerifyQuest(event: { quest: Quest; imageBase64: string; mimeType: string }): void {
    this.pendingKey.set(event.quest.questKey);
    this.toast('◈ AI Vision is analyzing your proof...');
    this.playerService.verifyQuest(event.quest.questKey, event.imageBase64, event.mimeType).subscribe({
      next: (res) => {
        if (res.verified && res.result) {
          this.toast('◈ AI VERIFIED: ' + res.reason);
          this.handleQuestCompletionSuccess(res.result);
        } else {
          this.pendingKey.set(null);
          this.toast('⚠ AI REJECTED: ' + res.reason);
        }
      },
      error: () => {
        this.pendingKey.set(null);
        this.toast('⚠ AI Verification Failed.');
      }
    });
  }

  private handleQuestCompletionSuccess(res: QuestCompletionResult): void {
    this.pendingKey.set(null);
    // Native haptic — success buzz on level-up, light tap on plain XP.
    if (res.leveledUp) { this.haptics.success(); } else { this.haptics.light(); }
    const statStr = res.statsGained?.length ? ' · ' + res.statsGained.join(' ') : '';
    this.snack.open(`◈ +${res.xpGained} XP${statStr}`, '✕', {
      duration: 3400, panelClass: 'system-snack',
      horizontalPosition: 'center', verticalPosition: 'top',
    });
    res.newAchievements?.forEach((a: Achievement, i: number) => {
      setTimeout(() => {
        this.snack.open(`🏆 ACHIEVEMENT — ${a.title}`, '✕', {
          duration: 4200, panelClass: 'system-snack',
          horizontalPosition: 'center', verticalPosition: 'top',
        });
      }, 700 * (i + 1));
    });
    if (res.leveledUp) {
      setTimeout(() => {
        this.uiState.triggerLevelUp({ newLevel: res.newLevel, newRank: res.newRank, rankChanged: res.rankChanged });
      }, 400);
    }
    this.load();
    this.notifications.refreshUnread();
  }

  // Called if quest completion fails
  private handleQuestCompletionError(e: any): void {
    this.pendingKey.set(null);
    this.haptics.warning();
    const msg = e?.error?.message ?? 'Quest failed';
    this.snack.open(`⚠ ${msg}`, '✕', {
      duration: 2800, panelClass: 'system-snack-warn',
      horizontalPosition: 'center', verticalPosition: 'top',
    });
  }

  logout(): void { this.auth.logout(); }

  private updateDates(): void {
    const now = new Date();
    const tmrw = new Date(now);
    tmrw.setDate(tmrw.getDate() + 1);

    const opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
    this.todayDateStr.set(now.toLocaleDateString('en-GB', opts).toUpperCase());
    this.tomorrowDateStr.set(tmrw.toLocaleDateString('en-GB', opts).toUpperCase());
  }

  /** Returns quests to display based on Daily Mission logic. */
  getDisplayQuests(quests: Quest[]): Quest[] {
    const dm = this.dailyMission();
    if (this.showAllQuests() || !dm) return quests;

    const missionKeys = new Set([
      ...dm.mainQuests.map(q => q.questKey),
      ...dm.sideQuests.map(q => q.questKey)
    ]);
    return quests.filter(q => missionKeys.has(q.questKey));
  }

  /** Maps an equipped title key to its display name for the topbar. */
  titleName(key: string): string {
    const map: Record<string, string> = {
      AWAKENED: 'The Awakened', IRON_WILLED: 'Iron-Willed', RELENTLESS: 'The Relentless',
      CODE_HUNTER: 'Code Hunter', SHADOW_ATHLETE: 'Shadow Athlete', HORMONE_LORD: 'Hormone Lord',
      GATE_BREAKER: 'Gate Breaker', DECORATED: 'The Decorated', DAWN_HUNTER: 'Dawn Hunter',
      ELITE_HUNTER: 'Elite Hunter', SHADOW_MONARCH: 'Shadow Monarch',
    };
    return '❖ ' + (map[key] ?? key);
  }

  accountabilityMsg(done: number, total: number): string {
    const left = total - done;
    const pressure = this.pressureLevel();
    if (pressure === 'BRUTAL') {
      if (left >= 8) return 'YOU HAVE NOT STARTED. SUNG JIN-WOO CLEARS GATES AT DAWN.';
      if (left >= 5) return 'MORE THAN HALF UNDONE. WEAK.';
      if (left >= 3) return 'ALMOST THERE — DO NOT STOP NOW. FINISH THEM ALL.';
      return 'LAST FEW. NO EXCUSES. CLOSE THE GATE.';
    }
    if (pressure === 'STANDARD') {
      if (left >= 8) return 'QUESTS WAITING. BEGIN.';
      if (left >= 5) return 'OVER HALF REMAINING — PUSH.';
      if (left >= 3) return 'ALMOST DONE. FINISH STRONG.';
      return 'FINAL STRETCH. LOCK THEM IN.';
    }
    // MILD
    if (left >= 5) return 'Take it one quest at a time.';
    return 'Almost there. You\'ve got this.';
  }

  hpRiskColor(done: number, total: number): string {
    const pct = done / Math.max(total, 1);
    if (pct < 0.3) return '#E24B4A';
    if (pct < 0.6) return '#FAC775';
    return '#1D9E75';
  }
}
