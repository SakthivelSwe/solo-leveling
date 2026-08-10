import { Injectable, NgZone, effect, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { SystemNotification, StatusWindow } from '../models/models';
import { LocalNotificationsService } from './local-notifications.service';

interface PlayerUpdate {
  currentXp?: number;
  totalXp?: number;
  level?: number;
  rankLevel?: string;
  hp?: number;
  maxHp?: number;
  leveledUp?: boolean;
  inPenaltyZone?: boolean;
  penaltyZoneEndTime?: string;
}

/**
 * Real-time link to THE SYSTEM (Server-Sent Events).
 * Auto-connects while the Hunter is authenticated and streams live notifications
 * and XP / HP / rank changes — no manual refresh required.
 */
@Injectable({ providedIn: 'root' })
export class SseService {
  private eventSource?: EventSource;

  /** True while the live link is open. */
  readonly connected = signal(false);
  /** Bumps on every player-update so views can reload live (e.g. the dashboard). */
  readonly playerTick = signal(0);

  /** Backoff state for SSE reconnect on error — prevents aggressive reconnect loops. */
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelayMs = 5000; // starts at 5s, caps at 30s

  /** Offline queue key — stores quest completions while offline. */
  private readonly OFFLINE_QUEUE_KEY = 'system_offline_queue';

  /** Emits when a status hydration completes on reconnect. */
  readonly freshStatus = signal<StatusWindow | null>(null);

  constructor(
    private auth: AuthService,
    private notifications: NotificationService,
    private snack: MatSnackBar,
    private zone: NgZone,
    private localNotifs: LocalNotificationsService,
    private http: HttpClient,
  ) {
    // Open the link while authenticated; close it on logout.
    effect(
      () => {
        if (this.auth.isAuthenticated()) {
          this.connect();
        } else {
          this.disconnect();
        }
      },
      { allowSignalWrites: true },
    );

    // Battery/heat saver: an EventSource left open in the background keeps the
    // radio + CPU busy (and auto-reconnects on every drop). While the app/tab is
    // hidden we close the link entirely, then re-open it the moment the Hunter
    // returns. Missed background alerts are still delivered via local notifications.
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.disconnect();
        } else if (this.auth.isAuthenticated()) {
          this.connect();
        }
      });
    }
  }

  private connect(): void {
    if (this.eventSource) return;
    const token = this.auth.token;
    if (!token) return;

    // Request desktop notification permissions if supported
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const url = `${environment.apiUrl}/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    this.eventSource = es;

    es.addEventListener('connected', () =>
      this.zone.run(() => {
        this.connected.set(true);
        this.reconnectDelayMs = 5000; // reset backoff on successful connection

        // Phase 3A (ANDROID-1 FIX): Hydrate dashboard immediately on reconnect.
        // On Doze mode wakeup, SSE reconnects but no events arrive for seconds.
        // Eagerly fetching fresh status eliminates stale data in that window.
        this.http.get<StatusWindow>(`${environment.apiUrl}/player/status`).subscribe({
          next: s => this.freshStatus.set(s),
          error: () => { /* non-fatal — SSE will catch up via events */ }
        });

        // Phase 3B (ANDROID-2 FIX): Replay any queued offline completions.
        this.replayOfflineQueue();
      }),
    );

    es.addEventListener('notification', (ev: MessageEvent) =>
      this.zone.run(() => this.onNotification(ev)),
    );

    es.addEventListener('player-update', (ev: MessageEvent) =>
      this.zone.run(() => this.onPlayerUpdate(ev)),
    );

    // Habit completion → same player-state envelope, just re-use the handler.
    es.addEventListener('habit-update', (ev: MessageEvent) =>
      this.zone.run(() => this.onPlayerUpdate(ev)),
    );

    es.addEventListener('agent-log', (ev: MessageEvent) =>
      this.zone.run(() => {
        const payload = JSON.parse(ev.data);
        window.dispatchEvent(new CustomEvent('agentLog', { detail: payload }));
      })
    );

    // EventSource auto-reconnects on error; add backoff so an unreachable server
    // doesn't trigger rapid reconnect storms that drain battery and heat the CPU.
    es.onerror = () => this.zone.run(() => {
      this.connected.set(false);
      // Close the broken connection — don't let browser auto-reconnect
      this.disconnect();
      if (this.auth.isAuthenticated() && !document.hidden) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, 30000);
          this.connect();
        }, this.reconnectDelayMs);
      }
    });
  }

  private disconnect(): void {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.reconnectDelayMs = 5000; // reset backoff on intentional disconnect
    this.eventSource?.close();
    this.eventSource = undefined;
    this.connected.set(false);
  }

  // ── Phase 3B: Offline Quest Completion Queue (ANDROID-2 FIX) ─────────────

  /**
   * Queue a quest completion for retry when offline.
   * Called by the quest completion handler when HTTP POST fails with network error.
   * Stored in localStorage so it survives app restarts.
   */
  queueOfflineCompletion(questKey: string): void {
    const queue = this.getOfflineQueue();
    if (!queue.includes(questKey)) {
      queue.push(questKey);
      localStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      this.snack.open(
        `◈ Queued — "${questKey}" will sync when online`,
        '✕', { duration: 5000, panelClass: 'system-snack' }
      );
    }
  }

  /** Returns the number of pending offline quest completions. */
  get pendingOfflineCount(): number {
    return this.getOfflineQueue().length;
  }

  private getOfflineQueue(): string[] {
    try {
      return JSON.parse(localStorage.getItem(this.OFFLINE_QUEUE_KEY) || '[]');
    } catch { return []; }
  }

  private replayOfflineQueue(): void {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return;

    this.snack.open(
      `◈ Syncing ${queue.length} offline quest${queue.length > 1 ? 's' : ''}…`,
      '', { duration: 3000, panelClass: 'system-snack' }
    );

    // Replay in sequence — each queued key re-fires the complete POST
    const replay = (keys: string[]) => {
      if (keys.length === 0) {
        localStorage.removeItem(this.OFFLINE_QUEUE_KEY);
        this.snack.open('◈ Offline queue synced ✓', '', { duration: 2000, panelClass: 'system-snack' });
        this.playerTick.update(v => v + 1); // refresh dashboard
        return;
      }
      const [head, ...rest] = keys;
      this.http.post(`${environment.apiUrl}/quests/${head}/complete`, {}).subscribe({
        next: () => replay(rest),
        error: () => {
          // Re-queue only failed items
          localStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(keys));
          this.snack.open('◈ Partial sync — some quests remain queued', '', { duration: 3000, panelClass: 'system-snack' });
        }
      });
    };

    replay(queue);
  }

  private onNotification(ev: MessageEvent): void {
    try {
      const payload = JSON.parse(ev.data) as {
        notification: SystemNotification;
        unreadCount: number;
      };
      this.notifications.ingest(payload.notification, payload.unreadCount);
      const n = payload.notification;

      // In-app snackbar
      this.snack.open(`◈ ${n.title} — ${n.message}`, '✕', {
        duration: 8000,
        panelClass: 'system-snack',
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });

      // Desktop Web Notification (if app is hidden)
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`◈ ${n.title}`, {
          body: n.message,
          icon: '/assets/icons/icon-192x192.png' // Default PWA icon
        });
      }
    } catch {
      /* ignore malformed frame */
    }
  }

  private onPlayerUpdate(ev: MessageEvent): void {
    try {
      const data = JSON.parse(ev.data) as PlayerUpdate;
      const current = this.auth.player();
      if (current) {
        const newHp = data.hp ?? current.hp;

        // Check for HP drop below 40% (maxHp is 100)
        if (newHp < 40 && current.hp >= 40) {
          this.localNotifs.triggerHpWarning(newHp);
        }

        this.auth.updatePlayer({
          ...current,
          currentXp: data.currentXp ?? current.currentXp,
          totalXp: data.totalXp ?? current.totalXp,
          level: data.level ?? current.level,
          rankLevel: data.rankLevel ?? current.rankLevel,
          hp: newHp,
          maxHp: data.maxHp ?? current.maxHp,
          inPenaltyZone: data.inPenaltyZone ?? current.inPenaltyZone,
          penaltyZoneEndTime: data.penaltyZoneEndTime ?? current.penaltyZoneEndTime,
        });
      }
      this.playerTick.update(v => v + 1);
    } catch {
      /* ignore malformed frame */
    }
  }
}

