import { Injectable, NgZone, effect, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { SystemNotification } from '../models/models';
import { LocalNotificationsService } from './local-notifications.service';

interface PlayerUpdate {
  currentXp?: number;
  totalXp?: number;
  level?: number;
  rankLevel?: string;
  hp?: number;
  maxHp?: number;
  leveledUp?: boolean;
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

  constructor(
    private auth: AuthService,
    private notifications: NotificationService,
    private snack: MatSnackBar,
    private zone: NgZone,
    private localNotifs: LocalNotificationsService,
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
      this.zone.run(() => this.connected.set(true)),
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

    // EventSource auto-reconnects on error; just reflect the dropped state.
    es.onerror = () => this.zone.run(() => this.connected.set(false));
  }

  private disconnect(): void {
    this.eventSource?.close();
    this.eventSource = undefined;
    this.connected.set(false);
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
        horizontalPosition: 'end',
        verticalPosition: 'bottom', // moved to bottom to be less intrusive to UI
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
        });
      }
      this.playerTick.update(v => v + 1);
    } catch {
      /* ignore malformed frame */
    }
  }
}

