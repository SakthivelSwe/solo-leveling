import { Injectable, NgZone, effect, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { SystemNotification } from '../models/models';

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
  }

  private connect(): void {
    if (this.eventSource) return;
    const token = this.auth.token;
    if (!token) return;

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
      this.snack.open(`${n.title} — ${n.message}`, '✕', {
        duration: 6000,
        panelClass: 'system-snack',
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    } catch {
      /* ignore malformed frame */
    }
  }

  private onPlayerUpdate(ev: MessageEvent): void {
    try {
      const data = JSON.parse(ev.data) as PlayerUpdate;
      const current = this.auth.player();
      if (current) {
        this.auth.updatePlayer({
          ...current,
          currentXp: data.currentXp ?? current.currentXp,
          totalXp: data.totalXp ?? current.totalXp,
          level: data.level ?? current.level,
          rankLevel: data.rankLevel ?? current.rankLevel,
          hp: data.hp ?? current.hp,
          maxHp: data.maxHp ?? current.maxHp,
        });
      }
      this.playerTick.update(v => v + 1);
    } catch {
      /* ignore malformed frame */
    }
  }
}

