import { Component, OnInit, OnDestroy, signal, effect, HostListener } from '@angular/core';
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
  DailyMissionDTO, DopamineSummary
} from '../../core/models/models';
import { LifeOsService } from '../../core/services/life-os.service';
import { UiStateService } from '../../core/services/ui-state.service';

import { StatusWindowComponent } from './status-window/status-window.component';
import { QuestLogComponent } from './quest-log/quest-log.component';
import { SkillTreeComponent } from './skill-tree/skill-tree.component';
import { ProgressChartComponent } from '../progress/progress-chart.component';
import { DailyScheduleComponent } from '../../shared/components/daily-schedule.component';
import { SettingsPanelComponent } from '../../shared/components/settings-panel.component';
import { DungeonCardComponent } from '../dungeon/dungeon-card.component';
import { PomodoroComponent } from './pomodoro.component';

@Component({
  selector: 'app-system',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive,
    StatusWindowComponent, QuestLogComponent, SkillTreeComponent, ProgressChartComponent,
    DailyScheduleComponent, SettingsPanelComponent, DungeonCardComponent, PomodoroComponent,
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

  dailyMission = signal<DailyMissionDTO | null>(null);
  dopamine = signal<DopamineSummary | null>(null);
  skillTreeNodes = signal<import('../../core/models/models').SkillTreeNode[]>([]);
  shadows = signal<import('../../core/models/models').Shadow[]>([]);
  showAllQuests = signal<boolean>(false);

  /** Debounce handle for coalescing bursts of live SSE events into one reload. */
  private reloadTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private playerService: PlayerService,
    private lifeOsService: LifeOsService,
    public auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    public notifications: NotificationService,
    public sse: SseService,
    private haptics: HapticsService,
    private uiState: UiStateService
  ) {
    // Live sync: reload the dashboard whenever a real-time player-update arrives
    // (e.g. a quest completed in another tab, or midnight HP processing).
    // Debounced so a BURST of events fires a single reload instead of hammering
    // the backend with several HTTP requests per event (saves battery + heat).
    effect(() => {
      const tick = this.sse.playerTick();
      if (tick > 0 && !this.loading()) {
        if (this.reloadTimer) clearTimeout(this.reloadTimer);
        this.reloadTimer = setTimeout(() => {
          this.reloadTimer = null;
          this.load();
        }, 700);
      }
    });
  }

  ngOnInit(): void {
    this.load();
    this.notifications.refreshUnread();
  }

  ngOnDestroy(): void {
    if (this.reloadTimer) { clearTimeout(this.reloadTimer); this.reloadTimer = null; }
  }

  load(): void {
    this.playerService.getStatus().subscribe({
      next: (s: StatusWindow) => { this.status.set(s); this.auth.updatePlayer(s.player); this.loading.set(false); },
      error: () => this.loading.set(false),
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
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.profileMenuOpen()) {
      this.profileMenuOpen.set(false);
    }
  }

  onComplete(quest: Quest): void {
    this.pendingKey.set(quest.questKey);
    this.playerService.completeQuest(quest.questKey).subscribe({
      next: (res: QuestCompletionResult) => {
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
      },
      error: (e: { error?: { message?: string } }) => {
        this.pendingKey.set(null);
        this.haptics.warning();
        const msg = e?.error?.message ?? 'Quest failed';
        this.snack.open(`⚠ ${msg}`, '✕', {
          duration: 2800, panelClass: 'system-snack-warn',
          horizontalPosition: 'center', verticalPosition: 'top',
        });
      },
    });
  }

  logout(): void { this.auth.logout(); }

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
