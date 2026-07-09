import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  JobApplication, InterviewRound, LeetcodeLog, LeetcodeStats, CourseProgress, SkillsGap,
  SavingsGoal, BudgetEntry, HealthLog, MindLog, SelfDoubtEvidence,
  EnglishLog, VocabularyLog, BodyLog, RelationshipLog,
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class LifeOsService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /* ===== Career OS ===== */
  getJobs(): Observable<JobApplication[]> { return this.http.get<JobApplication[]>(`${this.api}/career/jobs`); }
  createJob(b: JobApplication): Observable<JobApplication> { return this.http.post<JobApplication>(`${this.api}/career/jobs`, b); }
  updateJobStatus(id: number, status: string): Observable<JobApplication> {
    return this.http.put<JobApplication>(`${this.api}/career/jobs/${id}/status`, { status });
  }
  getRounds(id: number): Observable<InterviewRound[]> { return this.http.get<InterviewRound[]>(`${this.api}/career/jobs/${id}/rounds`); }
  addRound(id: number, b: InterviewRound): Observable<InterviewRound> { return this.http.post<InterviewRound>(`${this.api}/career/jobs/${id}/rounds`, b); }

  logLeetcode(b: LeetcodeLog): Observable<LeetcodeLog> { return this.http.post<LeetcodeLog>(`${this.api}/career/leetcode`, b); }
  leetcodeStats(): Observable<LeetcodeStats> { return this.http.get<LeetcodeStats>(`${this.api}/career/leetcode/stats`); }
  leetcodeHistory(): Observable<LeetcodeLog[]> { return this.http.get<LeetcodeLog[]>(`${this.api}/career/leetcode/history`); }

  upsertCourse(b: CourseProgress): Observable<CourseProgress> { return this.http.post<CourseProgress>(`${this.api}/career/courses`, b); }
  getCourses(): Observable<CourseProgress[]> { return this.http.get<CourseProgress[]>(`${this.api}/career/courses`); }
  skillsGap(): Observable<SkillsGap> { return this.http.get<SkillsGap>(`${this.api}/career/skills-gap`); }

  /* ===== Wealth OS ===== */
  getGoals(): Observable<SavingsGoal[]> { return this.http.get<SavingsGoal[]>(`${this.api}/wealth/goals`); }
  createGoal(b: SavingsGoal): Observable<SavingsGoal> { return this.http.post<SavingsGoal>(`${this.api}/wealth/goals`, b); }
  updateGoal(id: number, current: number): Observable<SavingsGoal> {
    return this.http.put<SavingsGoal>(`${this.api}/wealth/goals/${id}/progress`, { current });
  }
  getBudgets(): Observable<BudgetEntry[]> { return this.http.get<BudgetEntry[]>(`${this.api}/wealth/budget`); }
  upsertBudget(b: BudgetEntry): Observable<BudgetEntry> { return this.http.post<BudgetEntry>(`${this.api}/wealth/budget`, b); }

  /* ===== Health OS ===== */
  getHealthToday(): Observable<HealthLog> { return this.http.get<HealthLog>(`${this.api}/health/today`); }
  upsertHealth(b: HealthLog): Observable<HealthLog> { return this.http.post<HealthLog>(`${this.api}/health/log`, b); }
  logWater(glasses: number): Observable<HealthLog> { return this.http.post<HealthLog>(`${this.api}/health/water`, { glasses }); }
  healthHistory(): Observable<HealthLog[]> { return this.http.get<HealthLog[]>(`${this.api}/health/history`); }

  /* ===== Mind OS ===== */
  getMindToday(): Observable<MindLog> { return this.http.get<MindLog>(`${this.api}/mind/today`); }
  upsertMind(b: MindLog): Observable<MindLog> { return this.http.post<MindLog>(`${this.api}/mind/log`, b); }
  getEvidence(): Observable<SelfDoubtEvidence[]> { return this.http.get<SelfDoubtEvidence[]>(`${this.api}/mind/evidence`); }
  addEvidence(evidence: string, category = 'CHARACTER'): Observable<SelfDoubtEvidence> {
    return this.http.post<SelfDoubtEvidence>(`${this.api}/mind/evidence`, { evidence, category });
  }

  /* ===== English OS ===== */
  upsertEnglish(b: EnglishLog): Observable<EnglishLog> { return this.http.post<EnglishLog>(`${this.api}/english/log`, b); }
  englishHistory(): Observable<EnglishLog[]> { return this.http.get<EnglishLog[]>(`${this.api}/english/history`); }
  addWord(b: VocabularyLog): Observable<VocabularyLog> { return this.http.post<VocabularyLog>(`${this.api}/english/vocabulary`, b); }
  vocabulary(): Observable<VocabularyLog[]> { return this.http.get<VocabularyLog[]>(`${this.api}/english/vocabulary`); }

  /* ===== Body OS ===== */
  getBodyToday(): Observable<BodyLog> { return this.http.get<BodyLog>(`${this.api}/body/today`); }
  upsertBody(b: BodyLog): Observable<BodyLog> { return this.http.post<BodyLog>(`${this.api}/body/log`, b); }
  bodyHistory(): Observable<BodyLog[]> { return this.http.get<BodyLog[]>(`${this.api}/body/history`); }

  /* ===== Relationship OS ===== */
  getRelationshipToday(): Observable<RelationshipLog> { return this.http.get<RelationshipLog>(`${this.api}/relationship/today`); }
  upsertRelationship(b: RelationshipLog): Observable<RelationshipLog> { return this.http.post<RelationshipLog>(`${this.api}/relationship/log`, b); }
}

