import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Habit, HabitsOverview, HabitCompletionResult, HabitTemplate,
} from '../models/models';

/**
 * Habits API client — the Atomic Habits engine.
 * Exposes signals for the dashboard so components can react without re-fetching.
 */
@Injectable({ providedIn: 'root' })
export class HabitService {
  private readonly api = environment.apiUrl;

  /** Live overview cache; components can also subscribe to fresh HTTP for details. */
  readonly overview = signal<HabitsOverview | null>(null);
  readonly loading = signal(false);

  constructor(private http: HttpClient) {}

  fetchOverview(): Observable<HabitsOverview> {
    this.loading.set(true);
    return this.http.get<HabitsOverview>(`${this.api}/habits`).pipe(
      tap({
        next: (o) => { this.overview.set(o); this.loading.set(false); },
        error: () => this.loading.set(false),
      }),
    );
  }

  create(body: Partial<Habit>): Observable<Habit> {
    return this.http.post<Habit>(`${this.api}/habits`, body);
  }

  update(id: number, body: Partial<Habit>): Observable<Habit> {
    return this.http.put<Habit>(`${this.api}/habits/${id}`, body);
  }

  archive(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/habits/${id}`);
  }

  complete(id: number, opts: { quality?: number; twoMinute?: boolean; note?: string } = {}): Observable<HabitCompletionResult> {
    return this.http.post<HabitCompletionResult>(
      `${this.api}/habits/${id}/complete`,
      { quality: opts.quality ?? 3, twoMinute: opts.twoMinute ?? false, note: opts.note ?? null },
    );
  }

  templates(rank?: string): Observable<HabitTemplate[]> {
    const q = rank ? `?rank=${encodeURIComponent(rank)}` : '';
    return this.http.get<HabitTemplate[]>(`${this.api}/habits/templates${q}`);
  }

  adopt(templateKey: string): Observable<Habit> {
    return this.http.post<Habit>(`${this.api}/habits/templates/${templateKey}/adopt`, {});
  }

  history(habitId: number): Observable<HabitHistoryEntry[]> {
    return this.http.get<HabitHistoryEntry[]>(`${this.api}/habits/${habitId}/history`);
  }
}

export interface HabitHistoryEntry {
  date: string;
  quality: number;
  xpGained: number;
  twoMinute: boolean;
  note: string | null;
}

