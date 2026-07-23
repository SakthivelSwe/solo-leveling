import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  JobApplication, InterviewRound, LeetcodeLog, LeetcodeStats, CourseProgress, SkillsGap,
  SavingsGoal, BudgetEntry, HealthLog, MindLog, SelfDoubtEvidence,
  EnglishLog, VocabularyLog, BodyLog, RelationshipLog,
  DailyMissionDTO, DopamineLog, DeepWorkSession, InterviewReadinessDTO, DopamineSummary,
  SkillTreeNode, Shadow, BodyMetric, SleepEntry, MoodPoint, WorkoutEntry
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
  interviewReadiness(): Observable<InterviewReadinessDTO> { return this.http.get<InterviewReadinessDTO>(`${this.api}/career/interview-readiness`); }
  syncDevMastery(): Observable<any[]> { return this.http.post<any[]>(`${this.api}/career/sync-dev-mastery`, {}); }

  /* ===== Deep Work OS ===== */
  logDeepWork(b: DeepWorkSession): Observable<DeepWorkSession> { return this.http.post<DeepWorkSession>(`${this.api}/deep-work/log`, b); }
  getDeepWorkWeekly(): Observable<DeepWorkSession[]> { return this.http.get<DeepWorkSession[]>(`${this.api}/deep-work/weekly`); }
  getDeepWorkStats(): Observable<any> { return this.http.get<any>(`${this.api}/deep-work/stats`); }

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
  logDiet(b: any): Observable<any> { return this.http.post<any>(`${this.api}/health/diet`, b); }
  getDietHistory(): Observable<any[]> { return this.http.get<any[]>(`${this.api}/health/diet/history`); }
  generateHealthReport(): Observable<string> { return this.http.get(`${this.api}/health/diet/ai-report`, { responseType: 'text' }); }

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

  /* ===== Daily Mission Generator ===== */
  getDailyMissions(): Observable<DailyMissionDTO> { return this.http.get<DailyMissionDTO>(`${this.api}/daily-mission`); }
  regenerateDailyMissions(): Observable<DailyMissionDTO> { return this.http.post<DailyMissionDTO>(`${this.api}/daily-mission/regenerate`, {}); }

  /* ===== AI Commander ===== */
  generateAiDirective(config: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.api}/ai/commander/directive`, config);
  }

  /* ===== Dopamine OS ===== */
  logDopamine(b: DopamineLog): Observable<DopamineLog> { return this.http.post<DopamineLog>(`${this.api}/dopamine/log`, b); }
  getDopamineToday(): Observable<DopamineSummary> { return this.http.get<DopamineSummary>(`${this.api}/dopamine/today`); }
  getDopamineHistory(days = 30): Observable<DopamineLog[]> { return this.http.get<DopamineLog[]>(`${this.api}/dopamine/history?days=${days}`); }

  /* ===== Skill Tree ===== */
  getSkillTreeNodes(): Observable<SkillTreeNode[]> { return this.http.get<SkillTreeNode[]>(`${this.api}/skill-tree`); }

  /* ===== Shadow Army ===== */
  getShadows(): Observable<Shadow[]> { return this.http.get<Shadow[]>(`${this.api}/shadows`); }

  /* ===== Phase 2 — Physical Tracking ===== */
  // Body metrics (weight + body-fat)
  bodyMetricToday(): Observable<BodyMetric> { return this.http.get<BodyMetric>(`${this.api}/body-metrics/today`); }
  upsertBodyMetric(b: BodyMetric): Observable<BodyMetric> { return this.http.post<BodyMetric>(`${this.api}/body-metrics/log`, b); }
  bodyMetricHistory(): Observable<BodyMetric[]> { return this.http.get<BodyMetric[]>(`${this.api}/body-metrics/history`); }

  // Dedicated sleep tracker (exact bed/wake times + computed duration)
  logSleep(b: { date?: string; bedtime: string; wakeTime: string; quality?: number | null }): Observable<HealthLog> {
    return this.http.post<HealthLog>(`${this.api}/health/sleep`, b);
  }
  sleepHistory(): Observable<SleepEntry[]> { return this.http.get<SleepEntry[]>(`${this.api}/health/sleep`); }

  // Mood trend line
  moodTrend(days = 30): Observable<MoodPoint[]> { return this.http.get<MoodPoint[]>(`${this.api}/mind/mood-trend?days=${days}`); }

  // Workout logger (Phase 4)
  logWorkout(b: WorkoutEntry): Observable<WorkoutEntry> { return this.http.post<WorkoutEntry>(`${this.api}/workout/log`, b); }
  workoutHistory(): Observable<WorkoutEntry[]> { return this.http.get<WorkoutEntry[]>(`${this.api}/workout/history`); }
  deleteWorkout(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/workout/${id}`); }

  // Full data export (Phase 4)
  exportData(): Observable<Record<string, unknown>> { return this.http.get<Record<string, unknown>>(`${this.api}/export`); }

  /* ===== No Fap Challenge ===== */
  getNoFapStatus(): Observable<any> { return this.http.get<any>(`${this.api}/nofap/status`); }
  confirmCleanDay(): Observable<any> { return this.http.post<any>(`${this.api}/nofap/confirm-clean`, {}); }
  reportRelapse(): Observable<any> { return this.http.post<any>(`${this.api}/nofap/relapse`, {}); }
  /** Backfill clean days from a past start date. startDate = 'YYYY-MM-DD' */
  setNoFapStartDate(startDate: string): Observable<any> {
    return this.http.post<any>(`${this.api}/nofap/set-start-date`, { startDate });
  }
}

