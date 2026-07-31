import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DungeonBreak {
  id: number;
  playerId: number;
  title: string;
  description: string;
  targetMetric: string;
  targetValue: number;
  timeLimitHours: number;
  spawnedAt: string;
  isCleared: boolean;
  isFailed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DungeonBreakService {
  private api = `${environment.apiUrl}/dungeon-breaks`;

  constructor(private http: HttpClient) {}

  getActiveBreaks(): Observable<DungeonBreak[]> {
    return this.http.get<DungeonBreak[]>(`${this.api}/active`);
  }

  spawnBreak(): Observable<DungeonBreak> {
    return this.http.post<DungeonBreak>(`${this.api}/spawn`, {});
  }

  clearBreak(id: number): Observable<DungeonBreak> {
    return this.http.post<DungeonBreak>(`${this.api}/${id}/clear`, {});
  }
}
