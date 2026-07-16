import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LearningLog {
  id?: number;
  playerId?: number;
  logDate?: string;
  subject: string;
  topic: string;
  source: string;            // YOUTUBE | DEVMASTERY | WEBSITE | BOOK | PLATFORM | OTHER
  sourceUrl?: string;
  platformName?: string;
  durationMinutes: number;
  activityType: string;      // WATCHED_VIDEO | READ_ARTICLE | CODED_ALONG | PRACTICED | TOOK_NOTES
  noteTaken: boolean;
  codedAlong: boolean;
  recallDone: boolean;
  confidenceScore?: number;
  reviewDueDate?: string;
  reviewCount?: number;
  xpEarned?: number;
  videoTitle?: string;
  aiSummary?: string;
  aiKeyPoints?: string;       // JSON string of string[]
  aiRecallQuestions?: string; // JSON string of string[]
  recallKeyPointResults?: string; // JSON string of boolean[]
  aiAnalyzed?: boolean;
  devMasteryTopicId?: string;
  notes?: string;
  createdAt?: string;
}

export interface SmartNotebookResult {
  videoTitle: string;
  subject: string;
  topic: string;
  estimatedMinutes: number;
  summary: string;
  keyPoints: string[];
  recallQuestions: string[];
  skillTag: string;
}

export interface LearningStats {
  totalSessions: number;
  totalMinutes: number;
  totalHours: number;
  totalXpEarned: number;
  recallRate: number;
  currentLearnStreak: number;
  dueRecallsCount: number;
  topSubjects: { subject: string; sessions: number; totalMinutes: number }[];
  weeklyActivity: { date: string; minutes: number }[];
}

@Injectable({ providedIn: 'root' })
export class LearningService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Log a new learning session */
  logSession(body: LearningLog): Observable<LearningLog> {
    return this.http.post<LearningLog>(`${this.api}/learning/log`, body);
  }

  /** Recent 30 sessions */
  getHistory(): Observable<LearningLog[]> {
    return this.http.get<LearningLog[]>(`${this.api}/learning/history`);
  }

  /** Sessions with recall overdue */
  getDueRecalls(): Observable<LearningLog[]> {
    return this.http.get<LearningLog[]>(`${this.api}/learning/due-recalls`);
  }

  /** Mark recall done */
  markRecall(logId: number, confidenceScore: number, keyPointResults: boolean[]): Observable<LearningLog> {
    return this.http.post<LearningLog>(`${this.api}/learning/${logId}/recall`, {
      confidenceScore,
      keyPointResults
    });
  }

  /** Aggregated stats */
  getStats(): Observable<LearningStats> {
    return this.http.get<LearningStats>(`${this.api}/learning/stats`);
  }

  /** Gemini Smart Notebook — analyze YouTube URL */
  analyzeUrl(url: string): Observable<SmartNotebookResult> {
    return this.http.post<SmartNotebookResult>(`${this.api}/learning/analyze-url`, { url });
  }

  /** Sync DevMastery progress */
  manualSyncDevMastery(email: string): Observable<{topicsSynced: number, xpAwarded: number}> {
    return this.http.post<{topicsSynced: number, xpAwarded: number}>(
      `${this.api}/devmastery/sync`, { email }
    );
  }

  /** Parse JSON string of key points safely */
  parseKeyPoints(json: string | undefined): string[] {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  }

  /** Parse JSON string of recall question results safely */
  parseRecallResults(json: string | undefined): boolean[] {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  }
}
