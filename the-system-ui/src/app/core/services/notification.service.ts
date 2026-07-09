import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SystemNotification } from '../models/models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = environment.apiUrl;

  readonly unread = signal(0);
  readonly items = signal<SystemNotification[]>([]);

  constructor(private http: HttpClient) {}

  refreshUnread(): void {
    this.http.get<{ count: number }>(`${this.api}/notifications/unread-count`)
      .subscribe({ next: r => this.unread.set(r.count), error: () => {} });
  }

  load(): Observable<SystemNotification[]> {
    return this.http.get<SystemNotification[]>(`${this.api}/notifications`).pipe(
      tap(list => this.items.set(list)),
    );
  }

  /** Live push from the SSE stream — prepend the alert and sync the unread badge. */
  ingest(notification: SystemNotification, unreadCount: number): void {
    this.items.update(list => {
      if (list.some(n => n.id === notification.id)) return list;
      return [notification, ...list].slice(0, 50);
    });
    this.unread.set(unreadCount);
  }

  markRead(id: number): void {
    this.http.post(`${this.api}/notifications/${id}/read`, {}).subscribe({
      next: () => {
        this.items.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
        this.unread.update(c => Math.max(0, c - 1));
      },
      error: () => {},
    });
  }

  markAllRead(): void {
    this.http.post(`${this.api}/notifications/read-all`, {}).subscribe({
      next: () => {
        this.items.update(list => list.map(n => ({ ...n, read: true })));
        this.unread.set(0);
      },
      error: () => {},
    });
  }
}

