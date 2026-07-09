import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  role: 'system' | 'user';
  text: string;
  ts?: Date;
}

export interface BossBattle {
  id: number;
  topic: string;
  difficulty: string;
  questions: BossQuestion[];
  score: number | null;
  xpEarned: number;
  startedAt: string;
  completedAt: string | null;
}

export interface BossQuestion {
  question: string;
  hint: string;
  expectedKeyPoints: string[];
}

export interface Evaluation {
  questionIndex: number;
  question: string;
  score: number;
  feedback: string;
  missedPoints: string[];
  strongPoints: string[];
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly api = environment.apiUrl;

  /** Latest coaching message — persisted for dashboard display */
  coaching = signal<string>('');

  constructor(private http: HttpClient) {}

  getCoaching(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.api}/ai/coaching`).pipe(
      tap(r => this.coaching.set(r.message))
    );
  }

  getSuggestion(): Observable<{ raw: string }> {
    return this.http.get<{ raw: string }>(`${this.api}/ai/suggestion`);
  }

  getWeeklyReview(): Observable<{ review: string }> {
    return this.http.get<{ review: string }>(`${this.api}/ai/weekly-review`);
  }

  chat(message: string, context = 'general'): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(`${this.api}/ai/mentor`, { message, context });
  }

  startBattle(topic: string, difficulty: string): Observable<BossBattle> {
    return this.http.post<BossBattle>(`${this.api}/boss-battle/start`, { topic, difficulty });
  }

  answerQuestion(battleId: number, questionIndex: number, answer: string): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${this.api}/boss-battle/${battleId}/answer`,
      { questionIndex, answer });
  }

  completeBattle(battleId: number): Observable<BossBattle> {
    return this.http.post<BossBattle>(`${this.api}/boss-battle/${battleId}/complete`, {});
  }

  getBattleHistory(): Observable<BossBattle[]> {
    return this.http.get<BossBattle[]>(`${this.api}/boss-battle/history`);
  }
}

