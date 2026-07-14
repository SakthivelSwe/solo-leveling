import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  StatusWindow, Quest, QuestCompletionResult, PlayerSkill,
  Achievement, DayProgress, Player, HeatmapDay, MonthlyReport, Title, Dungeon
} from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly api = environment.apiUrl;

  private readonly CACHE_KEY = 'system_cached_status';

  constructor(private http: HttpClient) {}

  getCachedStatus(): StatusWindow | null {
    const raw = localStorage.getItem(this.CACHE_KEY);
    return raw ? JSON.parse(raw) as StatusWindow : null;
  }

  getStatus(): Observable<StatusWindow> {
    return this.http.get<StatusWindow>(`${this.api}/player/status`).pipe(
      tap(s => localStorage.setItem(this.CACHE_KEY, JSON.stringify(s)))
    );
  }

  getProfile(): Observable<Player> {
    return this.http.get<Player>(`${this.api}/player/profile`);
  }

  updateProfile(body: { displayName?: string; username?: string }): Observable<Player> {
    return this.http.put<Player>(`${this.api}/player/profile`, body);
  }

  /** Permanently deletes the account and all server-side data. */
  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${this.api}/player/account`);
  }

  getTodayQuests(): Observable<Quest[]> {
    return this.http.get<Quest[]>(`${this.api}/quests/today`);
  }

  completeQuest(key: string): Observable<QuestCompletionResult> {
    return this.http.post<QuestCompletionResult>(`${this.api}/quests/${key}/complete`, {});
  }

  getSkills(): Observable<PlayerSkill[]> {
    return this.http.get<PlayerSkill[]>(`${this.api}/skills`);
  }

  getAchievements(): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.api}/achievements`);
  }

  getWeeklyProgress(): Observable<DayProgress[]> {
    return this.http.get<DayProgress[]>(`${this.api}/progress/weekly`);
  }

  getHeatmap(days = 126): Observable<HeatmapDay[]> {
    return this.http.get<HeatmapDay[]>(`${this.api}/progress/heatmap?days=${days}`);
  }

  getMonthlyReport(): Observable<MonthlyReport> {
    return this.http.get<MonthlyReport>(`${this.api}/progress/report`);
  }

  getTitles(): Observable<Title[]> {
    return this.http.get<Title[]>(`${this.api}/titles`);
  }

  equipTitle(key: string): Observable<Title[]> {
    return this.http.post<Title[]>(`${this.api}/titles/${key}/equip`, {});
  }

  getDungeon(): Observable<Dungeon> {
    return this.http.get<Dungeon>(`${this.api}/dungeon`);
  }
}

