import {
  Component, OnInit, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  LearningService, LearningLog, SmartNotebookResult, LearningStats
} from '../../core/services/learning.service';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';

@Component({
  selector: 'app-learning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('350ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger(60, animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })))
        ], { optional: true })
      ])
    ])
  ],
  template: `
<div class="learning-page">

  <!-- ── Header ──────────────────────────────────────────── -->
  <div class="page-header" @fadeInUp>
    <div class="header-left">
      <h1 class="page-title"><span class="icon">📚</span> LEARNING LOG</h1>
      <p class="page-subtitle">Track · Recall · Master</p>
    </div>
    <div class="header-stats" *ngIf="stats()">
      <div class="hstat">
        <span class="hstat-value">{{ stats()!.totalHours }}h</span>
        <span class="hstat-label">STUDIED</span>
      </div>
      <div class="hstat">
        <span class="hstat-value">{{ stats()!.recallRate | number:'1.0-0' }}%</span>
        <span class="hstat-label">RECALL RATE</span>
      </div>
      <div class="hstat streak">
        <span class="hstat-value">{{ stats()!.currentLearnStreak }}d</span>
        <span class="hstat-label">STREAK</span>
      </div>
    </div>
  </div>

  <!-- ── Due Recalls Alert ──────────────────────────────── -->
  <div class="recall-alert" *ngIf="dueRecalls().length > 0" @fadeInUp>
    <div class="recall-alert-icon">🔴</div>
    <div class="recall-alert-text">
      <strong>{{ dueRecalls().length }} RECALL{{ dueRecalls().length > 1 ? 'S' : '' }} DUE</strong>
      <span>The System demands you verify your knowledge.</span>
    </div>
    <button class="recall-alert-btn" (click)="openRecallModal(dueRecalls()[0])">
      START RECALL
    </button>
  </div>

  <!-- ── Tabs ──────────────────────────────────────────── -->
  <div class="tabs" @fadeInUp>
    <button class="tab" [class.active]="activeTab() === 'log'" (click)="activeTab.set('log')">
      ⚡ LOG SESSION
    </button>
    <button class="tab" [class.active]="activeTab() === 'history'" (click)="loadHistory()">
      📋 HISTORY
    </button>
    <button class="tab" [class.active]="activeTab() === 'stats'" (click)="activeTab.set('stats')">
      📊 STATS
    </button>
    <button class="tab" [class.active]="activeTab() === 'devmastery'"
            (click)="activeTab.set('devmastery')">
      🔗 DEVMASTERY
    </button>
  </div>

  <!-- ══════════════════════ LOG SESSION TAB ══════════════════════ -->
  <div *ngIf="activeTab() === 'log'" @fadeInUp>

    <!-- Smart Notebook Card -->
    <div class="smart-notebook-card">
      <div class="sn-header">
        <span class="sn-icon">🤖</span>
        <div>
          <div class="sn-title">SMART NOTEBOOK</div>
          <div class="sn-subtitle">Paste a YouTube URL — Gemini AI extracts key points & recall questions</div>
        </div>
      </div>
      <div class="sn-input-row">
        <input
          class="sn-input"
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          [(ngModel)]="youtubeUrl"
          id="youtube-url-input"
        />
        <button class="sn-btn" (click)="analyzeUrl()" [disabled]="analyzing()">
          {{ analyzing() ? '⏳ ANALYZING...' : '✨ ANALYZE' }}
        </button>
      </div>
      <div class="sn-result" *ngIf="notebookResult()">
        <div class="sn-result-title">{{ notebookResult()!.videoTitle }}</div>
        <div class="sn-result-meta">
          <span class="badge">{{ notebookResult()!.subject }}</span>
          <span class="badge teal">{{ notebookResult()!.estimatedMinutes }} min</span>
          <span class="badge gold">{{ notebookResult()!.skillTag }}</span>
        </div>
        <p class="sn-summary">{{ notebookResult()!.summary }}</p>
        <div class="sn-key-points">
          <div class="kp-label">📌 KEY POINTS (in order)</div>
          <div class="kp-item" *ngFor="let pt of notebookResult()!.keyPoints">{{ pt }}</div>
        </div>
        <button class="sn-use-btn" (click)="useNotebookResult()">USE THIS DATA →</button>
      </div>
    </div>

    <!-- Log Form -->
    <div class="log-form card" @fadeInUp>
      <h3 class="form-title">Log Learning Session</h3>

      <div class="form-row two-col">
        <div class="field-group">
          <label>Subject *</label>
          <select [(ngModel)]="form.subject" id="subject-select">
            <option value="">Select subject</option>
            <option *ngFor="let s of subjects" [value]="s">{{ s }}</option>
          </select>
        </div>
        <div class="field-group">
          <label>Source</label>
          <select [(ngModel)]="form.source" id="source-select">
            <option value="YOUTUBE">YouTube</option>
            <option value="DEVMASTERY">DevMastery</option>
            <option value="WEBSITE">Website / Article</option>
            <option value="BOOK">Book</option>
            <option value="PLATFORM">Platform (Udemy etc.)</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div class="field-group">
        <label>Topic *</label>
        <input type="text" [(ngModel)]="form.topic" placeholder="e.g. OOP — Inheritance and Polymorphism"
               id="topic-input"/>
      </div>

      <div class="form-row two-col">
        <div class="field-group">
          <label>Video / Article Title</label>
          <input type="text" [(ngModel)]="form.videoTitle" placeholder="Title from Smart Notebook or manual"
                 id="video-title-input"/>
        </div>
        <div class="field-group">
          <label>Platform</label>
          <input type="text" [(ngModel)]="form.platformName" placeholder="Concept &amp; Coding, Baeldung..."
                 id="platform-input"/>
        </div>
      </div>

      <div class="field-group">
        <label>URL (optional)</label>
        <input type="url" [(ngModel)]="form.sourceUrl" placeholder="https://youtube.com/watch?v=..."
               id="url-input"/>
      </div>

      <!-- Duration slider -->
      <div class="field-group">
        <label>Duration: <strong>{{ form.durationMinutes }} min</strong></label>
        <input type="range" min="5" max="300" step="5" [(ngModel)]="form.durationMinutes"
               class="duration-slider" id="duration-slider"/>
        <div class="slider-labels">
          <span>5 min</span><span>1 hr</span><span>2 hr</span><span>5 hr</span>
        </div>
      </div>

      <!-- Activity chips -->
      <div class="field-group">
        <label>Activity Type</label>
        <div class="chips">
          <button *ngFor="let a of activityTypes" class="chip"
                  [class.selected]="form.activityType === a.value"
                  (click)="form.activityType = a.value" type="button" [id]="'activity-' + a.value">
            {{ a.icon }} {{ a.label }}
          </button>
        </div>
      </div>

      <!-- Toggles -->
      <div class="toggle-row">
        <label class="toggle-label" (click)="form.noteTaken = !form.noteTaken">
          <div class="toggle" [class.on]="form.noteTaken" id="notes-toggle"></div>
          📝 Took Notes <span class="xp-badge">+10 XP</span>
        </label>
        <label class="toggle-label" (click)="form.codedAlong = !form.codedAlong">
          <div class="toggle" [class.on]="form.codedAlong" id="coded-toggle"></div>
          💻 Coded Along <span class="xp-badge">+15 XP</span>
        </label>
        <label class="toggle-label" (click)="form.recallDone = !form.recallDone">
          <div class="toggle" [class.on]="form.recallDone" id="recall-toggle"></div>
          🧠 Recalled Now <span class="xp-badge">+20 XP</span>
        </label>
      </div>

      <!-- Confidence (show only if recall done) -->
      <div class="field-group confidence-group" *ngIf="form.recallDone">
        <label>Confidence Score</label>
        <div class="stars">
          <span *ngFor="let s of [1,2,3,4,5]" class="star"
                [class.lit]="(form.confidenceScore || 0) >= s"
                (click)="form.confidenceScore = s" [id]="'star-' + s">★</span>
        </div>
        <small>{{ confidenceLabel() }}</small>
      </div>

      <!-- Notes -->
      <div class="field-group">
        <label>Notes (optional)</label>
        <textarea [(ngModel)]="form.notes" rows="3"
                  placeholder="What stood out? Any doubts? Key insights..."
                  id="notes-textarea"></textarea>
      </div>

      <!-- XP Preview -->
      <div class="xp-preview">
        <div class="xp-label">ESTIMATED XP</div>
        <div class="xp-value">+{{ estimatedXp() }} XP</div>
      </div>

      <button class="submit-btn" (click)="submitLog()" [disabled]="submitting() || !form.subject || !form.topic"
              id="submit-log-btn">
        {{ submitting() ? '⏳ LOGGING...' : '⚡ LOG SESSION' }}
      </button>

      <div class="success-msg" *ngIf="successMsg()">✅ {{ successMsg() }}</div>
      <div class="error-msg" *ngIf="errorMsg()">❌ {{ errorMsg() }}</div>
    </div>
  </div>

  <!-- ══════════════════════ HISTORY TAB ══════════════════════ -->
  <div *ngIf="activeTab() === 'history'" @fadeInUp>
    <div class="history-list" [@listStagger]="history().length">
      <div class="history-card" *ngFor="let log of history()" @fadeInUp>
        <div class="hc-left">
          <div class="hc-source-icon">{{ sourceIcon(log.source) }}</div>
          <div class="hc-info">
            <div class="hc-topic">{{ log.topic }}</div>
            <div class="hc-meta">
              <span class="badge">{{ log.subject }}</span>
              <span class="meta-sep">·</span>
              <span>{{ log.durationMinutes }} min</span>
              <span class="meta-sep">·</span>
              <span>{{ log.logDate }}</span>
            </div>
            <div class="hc-platform" *ngIf="log.platformName">{{ log.platformName }}</div>
          </div>
        </div>
        <div class="hc-right">
          <div class="xp-chip">+{{ log.xpEarned }} XP</div>
          <div class="recall-status" [class.done]="log.recallDone" [class.due]="!log.recallDone">
            {{ log.recallDone ? '✅ Recalled' : '⏰ Recall Due' }}
          </div>
          <button class="recall-btn" *ngIf="!log.recallDone" (click)="openRecallModal(log)">
            RECALL
          </button>
        </div>
      </div>
      <div class="empty-state" *ngIf="history().length === 0">
        <div class="empty-icon">📚</div>
        <p>No sessions logged yet. Start with the Log Session tab.</p>
      </div>
    </div>
  </div>

  <!-- ══════════════════════ STATS TAB ══════════════════════ -->
  <div *ngIf="activeTab() === 'stats' && stats()" @fadeInUp>
    <div class="stats-grid">
      <div class="stat-card" @fadeInUp>
        <div class="stat-num">{{ stats()!.totalSessions }}</div>
        <div class="stat-lbl">Total Sessions</div>
      </div>
      <div class="stat-card" @fadeInUp>
        <div class="stat-num">{{ stats()!.totalHours }}h {{ stats()!.totalMinutes % 60 }}m</div>
        <div class="stat-lbl">Total Studied</div>
      </div>
      <div class="stat-card" @fadeInUp>
        <div class="stat-num">{{ stats()!.totalXpEarned }}</div>
        <div class="stat-lbl">XP from Learning</div>
      </div>
      <div class="stat-card" [class.alert]="stats()!.recallRate < 60" @fadeInUp>
        <div class="stat-num">{{ stats()!.recallRate | number:'1.0-0' }}%</div>
        <div class="stat-lbl">Recall Rate</div>
      </div>
    </div>

    <!-- Weekly Activity Bar Chart -->
    <div class="card weekly-chart" @fadeInUp>
      <h3 class="chart-title">📅 7-Day Learning Activity</h3>
      <div class="bar-chart">
        <div class="bar-col" *ngFor="let d of stats()!.weeklyActivity">
          <div class="bar-fill"
               [style.height.%]="maxMins() > 0 ? (d.minutes / maxMins() * 100) : 0"
               [class.today]="isToday(d.date)"></div>
          <div class="bar-label">{{ d.date | date:'EEE' }}</div>
          <div class="bar-val" *ngIf="d.minutes > 0">{{ d.minutes }}m</div>
        </div>
      </div>
    </div>

    <!-- Top Subjects -->
    <div class="card" @fadeInUp>
      <h3 class="chart-title">🎯 Top Subjects</h3>
      <div class="subject-list">
        <div class="subject-row" *ngFor="let s of stats()!.topSubjects; let i = index">
          <div class="subject-rank">{{ i + 1 }}</div>
          <div class="subject-name">{{ s.subject }}</div>
          <div class="subject-bar-wrap">
            <div class="subject-bar"
                 [style.width.%]="topSubjectMax() > 0 ? (s.totalMinutes / topSubjectMax() * 100) : 0">
            </div>
          </div>
          <div class="subject-time">{{ s.totalMinutes }}m</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ══════════════════════ DEVMASTERY TAB ══════════════════════ -->
  <div *ngIf="activeTab() === 'devmastery'" @fadeInUp>
    <div class="devmastery-card card">
      <div class="dm-header">
        <div class="dm-logo">⚡ DEVMASTERY</div>
        <a href="https://dev-mastery.pages.dev" target="_blank" class="dm-link">Open DevMastery →</a>
      </div>
      <div class="dm-info">
        <p>When you complete a topic in DevMastery, it automatically syncs here via webhook and awards you <strong>50 XP</strong> in THE SYSTEM.</p>
        <div class="dm-stats">
          <div class="dm-stat">
            <span class="dm-stat-val">{{ devMasterySessions() }}</span>
            <span class="dm-stat-lbl">Topics Synced</span>
          </div>
        </div>
      </div>

      <div class="dm-sync">
        <button class="sync-btn" (click)="manualSync()" [disabled]="syncing()">
          {{ syncing() ? '⏳ SYNCING...' : '🔄 MANUAL SYNC' }}
        </button>
        <div class="sync-note">Use this to import existing DevMastery progress.</div>
      </div>
    </div>
  </div>

</div>

<!-- ══════════════════════ RECALL MODAL ══════════════════════ -->
<div class="modal-overlay" *ngIf="recallModalLog()" (click)="closeRecallModal()">
  <div class="recall-modal" (click)="$event.stopPropagation()" @fadeInUp>
    <div class="rm-header">
      <div class="rm-title">🧠 RECALL CHECK</div>
      <div class="rm-subtitle">{{ recallModalLog()!.topic }}</div>
      <div class="rm-meta">
        Studied {{ recallModalLog()!.logDate }} · {{ recallModalLog()!.durationMinutes }} min
      </div>
    </div>

    <!-- AI Key Points checklist -->
    <div class="rm-section" *ngIf="recallKeyPoints().length > 0">
      <div class="rm-section-title">📌 Key Points (in order) — check what you remember:</div>
      <div class="kp-check-item" *ngFor="let pt of recallKeyPoints(); let i = index">
        <button class="kp-check-btn" [class.checked]="recallChecked[i]"
                (click)="recallChecked[i] = !recallChecked[i]" [id]="'kp-check-' + i">
          {{ recallChecked[i] ? '✅' : '⬜' }}
        </button>
        <span [class.forgotten]="!recallChecked[i]">{{ pt }}</span>
      </div>
    </div>

    <!-- AI Recall Questions -->
    <div class="rm-section" *ngIf="recallQuestions().length > 0">
      <div class="rm-section-title">❓ Recall Questions:</div>
      <div class="rq-item" *ngFor="let q of recallQuestions(); let i = index">
        <div class="rq-q">Q{{ i + 1 }}: {{ q }}</div>
        <textarea class="rq-answer" rows="2" [(ngModel)]="recallAnswers[i]"
                  [placeholder]="'Your answer to Q' + (i + 1) + '...'"></textarea>
      </div>
    </div>

    <!-- Confidence stars -->
    <div class="rm-confidence">
      <div class="rm-section-title">How confident are you?</div>
      <div class="stars large">
        <span *ngFor="let s of [1,2,3,4,5]" class="star"
              [class.lit]="recallConfidence >= s"
              (click)="recallConfidence = s" [id]="'recall-star-' + s">★</span>
      </div>
      <div class="confidence-hint">{{ recallConfidenceLabel() }}</div>
    </div>

    <div class="rm-footer">
      <button class="rm-cancel" (click)="closeRecallModal()">CANCEL</button>
      <button class="rm-submit" (click)="submitRecall()" [disabled]="recallConfidence === 0">
        SUBMIT RECALL — +{{ recallBonusXp() }} XP
      </button>
    </div>
  </div>
</div>
  `,
  styles: [`
.learning-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px 100px;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}
.page-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.5rem;
  color: var(--accent-purple);
  margin: 0;
  .icon { margin-right: 8px; }
}
.page-subtitle { color: var(--text-secondary); font-size: 0.8rem; margin: 4px 0 0; }
.header-stats {
  display: flex;
  gap: 20px;
}
.hstat {
  text-align: center;
  &-value { display: block; font-family: 'Orbitron',monospace; font-size: 1.4rem; color: var(--accent-teal); }
  &-label { display: block; font-size: 0.65rem; color: var(--text-secondary); letter-spacing: 1px; }
  &.streak .hstat-value { color: var(--accent-gold); }
}

/* Recall Alert */
.recall-alert {
  background: rgba(226,75,74,0.12);
  border: 1px solid var(--accent-red);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(226,75,74,0.3); }
  50% { box-shadow: 0 0 0 8px rgba(226,75,74,0); }
}
.recall-alert-icon { font-size: 1.5rem; }
.recall-alert-text {
  flex: 1;
  strong { display: block; color: var(--accent-red); font-family: 'Orbitron',monospace; font-size: 0.85rem; }
  span { color: var(--text-secondary); font-size: 0.8rem; }
}
.recall-alert-btn {
  background: var(--accent-red);
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-family: 'Orbitron', monospace;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all .2s;
  &:hover { background: #c53f3e; transform: translateY(-1px); }
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.tab {
  background: var(--card-bg);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 10px 18px;
  border-radius: 8px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
  &:hover { border-color: var(--accent-purple); color: var(--accent-purple); }
  &.active {
    background: var(--accent-purple-dim);
    border-color: var(--accent-purple);
    color: var(--accent-purple);
  }
}

/* Card */
.card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
}

/* Smart Notebook */
.smart-notebook-card {
  background: linear-gradient(135deg, rgba(108,99,255,0.08), rgba(31,190,142,0.05));
  border: 1px solid rgba(108,99,255,0.3);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}
.sn-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.sn-icon { font-size: 1.8rem; }
.sn-title { font-family: 'Orbitron',monospace; color: var(--accent-purple); font-size: 0.95rem; }
.sn-subtitle { color: var(--text-secondary); font-size: 0.78rem; margin-top: 2px; }
.sn-input-row { display: flex; gap: 10px; }
.sn-input {
  flex: 1;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 0.88rem;
  &:focus { outline: none; border-color: var(--accent-purple); }
}
.sn-btn {
  background: var(--accent-purple);
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-family: 'Orbitron', monospace;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
  &:hover:not(:disabled) { background: #7c75ff; transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.sn-result {
  margin-top: 20px;
  padding: 16px;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  border: 1px solid var(--border-glow);
}
.sn-result-title { font-family: 'Rajdhani',sans-serif; font-weight: 700; font-size: 1.05rem; color: var(--text-primary); margin-bottom: 8px; }
.sn-result-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.sn-summary { color: var(--text-secondary); font-size: 0.83rem; line-height: 1.6; margin-bottom: 16px; }
.sn-key-points { margin-bottom: 16px; }
.kp-label { font-size: 0.78rem; color: var(--accent-gold); font-weight: 600; margin-bottom: 8px; letter-spacing: 0.5px; }
.kp-item {
  background: rgba(255,255,255,0.04);
  border-left: 3px solid var(--accent-purple);
  padding: 8px 12px;
  margin-bottom: 6px;
  border-radius: 0 8px 8px 0;
  font-size: 0.83rem;
  color: var(--text-primary);
}
.sn-use-btn {
  background: var(--accent-teal);
  color: #000;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-family: 'Orbitron',monospace;
  font-size: 0.72rem;
  cursor: pointer;
  font-weight: 700;
  transition: all .2s;
  &:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(31,190,142,0.3); }
}

/* Form */
.log-form { }
.form-title { font-family: 'Orbitron',monospace; font-size: 0.9rem; color: var(--text-secondary); margin: 0 0 20px; letter-spacing: 1px; }
.form-row.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field-group {
  margin-bottom: 16px;
  label { display: block; font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 6px; letter-spacing: 0.5px; }
  input, select, textarea {
    width: 100%; box-sizing: border-box;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 11px 14px;
    color: var(--text-primary);
    font-size: 0.88rem;
    font-family: 'Inter', sans-serif;
    transition: border-color .2s;
    &:focus { outline: none; border-color: var(--accent-purple); }
  }
  textarea { resize: vertical; }
  select option { background: var(--bg-secondary); }
}

/* Duration slider */
.duration-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: var(--border);
  border-radius: 4px;
  outline: none;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px; height: 18px;
    background: var(--accent-purple);
    border-radius: 50%;
    cursor: pointer;
  }
}
.slider-labels { display: flex; justify-content: space-between; color: var(--text-dim); font-size: 0.7rem; margin-top: 4px; }

/* Activity chips */
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 7px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all .2s;
  &:hover { border-color: var(--accent-purple); }
  &.selected { background: var(--accent-purple-dim); border-color: var(--accent-purple); color: var(--accent-purple); }
}

/* Toggle row */
.toggle-row { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px; }
.toggle-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--text-secondary);
  user-select: none;
}
.toggle {
  width: 40px; height: 22px;
  background: var(--border);
  border-radius: 11px;
  position: relative;
  transition: background .2s;
  &::after {
    content: '';
    position: absolute;
    top: 3px; left: 3px;
    width: 16px; height: 16px;
    background: #fff;
    border-radius: 50%;
    transition: transform .2s;
  }
  &.on { background: var(--accent-purple); &::after { transform: translateX(18px); } }
}
.xp-badge {
  background: rgba(250,199,117,0.15);
  color: var(--accent-gold);
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
}

/* Stars */
.stars { display: flex; gap: 8px; }
.star {
  font-size: 1.6rem;
  color: var(--text-dim);
  cursor: pointer;
  transition: all .15s;
  &.lit { color: var(--accent-gold); text-shadow: 0 0 8px rgba(250,199,117,0.6); }
  &:hover { transform: scale(1.2); }
}
.stars.large .star { font-size: 2rem; }

/* Confidence */
.confidence-group small { color: var(--text-secondary); font-size: 0.78rem; margin-top: 6px; display: block; }

/* XP Preview */
.xp-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(108,99,255,0.08);
  border-radius: 10px;
}
.xp-label { color: var(--text-secondary); font-size: 0.78rem; letter-spacing: 1px; }
.xp-value { font-family: 'Orbitron',monospace; color: var(--accent-purple); font-size: 1.1rem; }

/* Submit */
.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-purple-2));
  color: #fff;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all .2s;
  letter-spacing: 1px;
  &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px var(--system-glow); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.success-msg { color: var(--accent-teal); margin-top: 12px; font-size: 0.85rem; text-align: center; }
.error-msg { color: var(--accent-red); margin-top: 12px; font-size: 0.85rem; text-align: center; }

/* History */
.history-list { display: flex; flex-direction: column; gap: 12px; }
.history-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  transition: border-color .2s;
  &:hover { border-color: var(--border-glow); }
}
.hc-left { display: flex; align-items: center; gap: 16px; }
.hc-source-icon { font-size: 1.5rem; }
.hc-topic { font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
.hc-meta { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--text-secondary); }
.hc-platform { font-size: 0.75rem; color: var(--text-dim); margin-top: 3px; }
.meta-sep { color: var(--text-dim); }
.hc-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.xp-chip {
  background: var(--accent-purple-dim);
  color: var(--accent-purple);
  padding: 3px 10px;
  border-radius: 20px;
  font-family: 'Orbitron',monospace;
  font-size: 0.7rem;
}
.recall-status {
  font-size: 0.72rem;
  &.done { color: var(--accent-teal); }
  &.due { color: var(--accent-gold); }
}
.recall-btn {
  background: rgba(250,199,117,0.15);
  color: var(--accent-gold);
  border: 1px solid rgba(250,199,117,0.3);
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.72rem;
  cursor: pointer;
  font-family: 'Orbitron',monospace;
  transition: all .2s;
  &:hover { background: rgba(250,199,117,0.25); }
}

/* Badges */
.badge {
  background: var(--accent-purple-dim);
  color: var(--accent-purple);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 600;
  &.teal { background: rgba(31,190,142,0.15); color: var(--accent-teal); }
  &.gold { background: rgba(250,199,117,0.15); color: var(--accent-gold); }
}

/* Empty state */
.empty-state { text-align: center; padding: 48px; color: var(--text-secondary); .empty-icon { font-size: 3rem; margin-bottom: 12px; } }

/* Stats */
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; }
@media (min-width: 600px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  &.alert { border-color: var(--accent-red); }
}
.stat-num { font-family: 'Orbitron',monospace; font-size: 1.4rem; color: var(--accent-teal); margin-bottom: 4px; }
.stat-lbl { font-size: 0.72rem; color: var(--text-secondary); letter-spacing: 0.5px; }

/* Bar Chart */
.weekly-chart { }
.chart-title { font-family: 'Orbitron',monospace; font-size: 0.8rem; color: var(--text-secondary); margin: 0 0 20px; letter-spacing: 1px; }
.bar-chart { display: flex; gap: 8px; align-items: flex-end; height: 120px; }
.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  position: relative;
}
.bar-fill {
  width: 100%;
  min-height: 4px;
  background: var(--accent-purple-dim);
  border-radius: 4px 4px 0 0;
  transition: height .5s ease;
  &.today { background: var(--accent-teal); box-shadow: 0 0 10px rgba(31,190,142,0.4); }
}
.bar-label { font-size: 0.65rem; color: var(--text-dim); margin-top: 6px; }
.bar-val { font-size: 0.6rem; color: var(--text-secondary); position: absolute; top: -18px; }

/* Subject List */
.subject-list { display: flex; flex-direction: column; gap: 10px; }
.subject-row { display: flex; align-items: center; gap: 12px; }
.subject-rank { width: 20px; color: var(--text-dim); font-size: 0.78rem; text-align: center; }
.subject-name { width: 120px; font-size: 0.83rem; color: var(--text-primary); }
.subject-bar-wrap { flex: 1; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
.subject-bar { height: 100%; background: var(--accent-purple); border-radius: 3px; transition: width .5s ease; }
.subject-time { font-size: 0.75rem; color: var(--text-secondary); width: 50px; text-align: right; }

/* DevMastery card */
.devmastery-card { }
.dm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.dm-logo { font-family: 'Orbitron',monospace; color: var(--accent-purple); font-size: 1.1rem; }
.dm-link { color: var(--accent-teal); font-size: 0.83rem; text-decoration: none; &:hover { text-decoration: underline; } }
.dm-info p { color: var(--text-secondary); font-size: 0.85rem; line-height: 1.6; margin-bottom: 16px; }
.dm-stats { display: flex; gap: 24px; margin-bottom: 20px; }
.dm-stat { text-align: center; }
.dm-stat-val { display: block; font-family: 'Orbitron',monospace; font-size: 1.5rem; color: var(--accent-teal); }
.dm-stat-lbl { font-size: 0.7rem; color: var(--text-secondary); }
.dm-setup { margin-bottom: 20px; h4 { color: var(--text-primary); margin-bottom: 8px; font-size: 0.9rem; } p { color: var(--text-secondary); font-size: 0.82rem; } }
.code-block {
  background: rgba(0,0,0,0.4);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
  font-family: monospace;
  font-size: 0.78rem;
  color: var(--accent-teal);
  margin: 8px 0;
  line-height: 1.8;
}
.sync-btn {
  background: var(--accent-teal);
  color: #000;
  border: none;
  padding: 12px 28px;
  border-radius: 10px;
  font-family: 'Orbitron',monospace;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all .2s;
  &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(31,190,142,0.3); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.sync-note { font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.recall-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-glow);
  border-radius: 20px;
  padding: 28px;
  max-width: 600px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(108,99,255,0.2);
}
.rm-header { margin-bottom: 24px; }
.rm-title { font-family: 'Orbitron',monospace; color: var(--accent-purple); font-size: 1.1rem; margin-bottom: 4px; }
.rm-subtitle { color: var(--text-primary); font-weight: 600; font-size: 1rem; margin-bottom: 4px; }
.rm-meta { color: var(--text-secondary); font-size: 0.78rem; }
.rm-section { margin-bottom: 24px; }
.rm-section-title { font-size: 0.78rem; color: var(--accent-gold); font-weight: 600; margin-bottom: 12px; letter-spacing: 0.5px; }
.kp-check-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 0.83rem;
  color: var(--text-primary);
}
.kp-check-btn {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  line-height: 1;
}
.forgotten { color: var(--text-secondary); text-decoration: line-through; }
.rq-item { margin-bottom: 16px; }
.rq-q { color: var(--text-primary); font-size: 0.85rem; font-weight: 500; margin-bottom: 6px; }
.rq-answer {
  width: 100%; box-sizing: border-box;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--text-primary);
  font-size: 0.83rem;
  resize: vertical;
  &:focus { outline: none; border-color: var(--accent-purple); }
}
.rm-confidence { margin-bottom: 24px; }
.confidence-hint { color: var(--text-secondary); font-size: 0.78rem; margin-top: 8px; }
.rm-footer { display: flex; gap: 12px; justify-content: flex-end; }
.rm-cancel {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'Rajdhani',sans-serif;
  font-size: 0.9rem;
  &:hover { border-color: var(--text-secondary); }
}
.rm-submit {
  background: var(--accent-purple);
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-family: 'Orbitron',monospace;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all .2s;
  &:hover:not(:disabled) { background: #7c75ff; transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
  `]
})
export class LearningComponent implements OnInit {

  // ── Signals ──────────────────────────────────────────────────────────────
  activeTab = signal<'log' | 'history' | 'stats' | 'devmastery'>('log');
  stats = signal<LearningStats | null>(null);
  history = signal<LearningLog[]>([]);
  dueRecalls = signal<LearningLog[]>([]);
  notebookResult = signal<SmartNotebookResult | null>(null);
  recallModalLog = signal<LearningLog | null>(null);
  analyzing = signal(false);
  submitting = signal(false);
  syncing = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  // ── Form state ────────────────────────────────────────────────────────────
  youtubeUrl = '';
  form: Partial<LearningLog> = this.defaultForm();
  recallConfidence = 0;
  recallChecked: boolean[] = [];
  recallAnswers: string[] = [];
  devMasterySessions = signal(0);

  readonly webhookUrl = 'https://your-the-system-api.onrender.com/api/devmastery/webhook';

  readonly subjects = ['Java', 'Spring Boot', 'DSA', 'System Design', 'Angular', 'JavaScript', 'Python', 'DevOps', 'English', 'Other'];
  readonly activityTypes = [
    { value: 'WATCHED_VIDEO', icon: '▶️', label: 'Watched' },
    { value: 'READ_ARTICLE', icon: '📄', label: 'Read' },
    { value: 'CODED_ALONG', icon: '💻', label: 'Coded Along' },
    { value: 'PRACTICED', icon: '🔁', label: 'Practiced' },
    { value: 'TOOK_NOTES', icon: '📝', label: 'Took Notes' },
  ];

  // Computed
  maxMins = computed(() => {
    const s = this.stats();
    if (!s) return 0;
    return Math.max(...s.weeklyActivity.map(d => d.minutes), 1);
  });
  topSubjectMax = computed(() => {
    const s = this.stats();
    if (!s || !s.topSubjects.length) return 1;
    return Math.max(...s.topSubjects.map(x => x.totalMinutes), 1);
  });
  recallKeyPoints = computed(() =>
    this.ls.parseKeyPoints(this.recallModalLog()?.aiKeyPoints));
  recallQuestions = computed(() =>
    this.ls.parseKeyPoints(this.recallModalLog()?.aiRecallQuestions));

  estimatedXp = computed(() => {
    const f = this.form;
    let base = Math.max(1, (f.durationMinutes || 30) / 5);
    let bonus = 0;
    if (f.noteTaken)   bonus += 10;
    if (f.codedAlong)  bonus += 15;
    if (f.recallDone)  bonus += 20;
    let mult = 1.0;
    const c = f.confidenceScore || 0;
    if (c >= 4) mult = 1.2;
    else if (c >= 1 && c <= 2) mult = 0.8;
    return Math.max(5, Math.min(100, Math.round((base + bonus) * mult)));
  });

  constructor(private ls: LearningService) {}

  ngOnInit() {
    this.loadStats();
    this.loadDueRecalls();
  }

  loadStats() {
    this.ls.getStats().subscribe({
      next: s => {
        this.stats.set(s);
        this.devMasterySessions.set(0); // will update from stats when devmastery count added
      }
    });
  }

  loadHistory() {
    this.activeTab.set('history');
    this.ls.getHistory().subscribe(h => this.history.set(h));
  }

  loadDueRecalls() {
    this.ls.getDueRecalls().subscribe(r => this.dueRecalls.set(r));
  }

  analyzeUrl() {
    if (!this.youtubeUrl.trim()) return;
    this.analyzing.set(true);
    this.notebookResult.set(null);
    this.ls.analyzeUrl(this.youtubeUrl).pipe(finalize(() => this.analyzing.set(false))).subscribe({
      next: r => this.notebookResult.set(r),
      error: () => this.errorMsg.set('Could not analyze URL. Check your Gemini API key.')
    });
  }

  useNotebookResult() {
    const r = this.notebookResult();
    if (!r) return;
    this.form.subject = r.subject;
    this.form.topic = r.topic;
    this.form.videoTitle = r.videoTitle;
    this.form.durationMinutes = r.estimatedMinutes;
    this.form.source = 'YOUTUBE';
    this.form.sourceUrl = this.youtubeUrl;
    this.form.activityType = 'WATCHED_VIDEO';
    // Store AI data in the form
    (this.form as any)._notebookResult = r;
    this.successMsg.set('Smart Notebook data applied to the form!');
    setTimeout(() => this.successMsg.set(''), 3000);
  }

  submitLog() {
    if (!this.form.subject || !this.form.topic) return;
    this.submitting.set(true);
    this.errorMsg.set('');

    const nr: SmartNotebookResult | undefined = (this.form as any)._notebookResult;
    const body: LearningLog = {
      subject: this.form.subject!,
      topic: this.form.topic!,
      source: this.form.source || 'YOUTUBE',
      sourceUrl: this.form.sourceUrl,
      platformName: this.form.platformName,
      durationMinutes: this.form.durationMinutes || 30,
      activityType: this.form.activityType || 'WATCHED_VIDEO',
      noteTaken: !!this.form.noteTaken,
      codedAlong: !!this.form.codedAlong,
      recallDone: !!this.form.recallDone,
      confidenceScore: this.form.confidenceScore || 0,
      notes: this.form.notes,
      videoTitle: this.form.videoTitle,
      aiSummary: nr?.summary,
      aiKeyPoints: nr ? JSON.stringify(nr.keyPoints) : undefined,
      aiRecallQuestions: nr ? JSON.stringify(nr.recallQuestions) : undefined,
    };

    this.ls.logSession(body).pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: saved => {
        this.successMsg.set(`Logged! +${saved.xpEarned} XP earned. ${!saved.recallDone ? '📅 Recall due tomorrow.' : ''}`);
        this.form = this.defaultForm();
        this.notebookResult.set(null);
        this.youtubeUrl = '';
        this.loadStats();
        this.loadDueRecalls();
        setTimeout(() => this.successMsg.set(''), 5000);
      },
      error: e => this.errorMsg.set(e.error?.message || 'Failed to log session.')
    });
  }

  openRecallModal(log: LearningLog) {
    this.recallModalLog.set(log);
    this.recallConfidence = 0;
    const kps = this.ls.parseKeyPoints(log.aiKeyPoints);
    this.recallChecked = kps.map(() => false);
    const qs = this.ls.parseKeyPoints(log.aiRecallQuestions);
    this.recallAnswers = qs.map(() => '');
  }

  closeRecallModal() { this.recallModalLog.set(null); }

  submitRecall() {
    const log = this.recallModalLog();
    if (!log?.id || this.recallConfidence === 0) return;
    this.ls.markRecall(log.id, this.recallConfidence, this.recallChecked).subscribe({
      next: updated => {
        this.closeRecallModal();
        this.loadDueRecalls();
        this.loadStats();
        // Update history inline if loaded
        this.history.update(h => h.map(x => x.id === updated.id ? updated : x));
      }
    });
  }

  manualSync() {
    this.syncing.set(true);
    const email = localStorage.getItem('system_user_email');
    if (!email) {
      alert('Error: User email not found in local storage.');
      this.syncing.set(false);
      return;
    }

    this.ls.manualSyncDevMastery(email).pipe(finalize(() => this.syncing.set(false))).subscribe({
      next: (res) => {
        alert(`Sync complete! Synced ${res.topicsSynced} new topics. Earned ${res.xpAwarded} XP.`);
        this.loadStats();
        this.loadHistory();
      },
      error: (e) => {
        alert('Sync failed: ' + (e.error?.message || e.message));
      }
    });
  }

  isToday(date: string): boolean {
    return date === new Date().toISOString().slice(0, 10);
  }

  sourceIcon(source: string): string {
    const icons: Record<string, string> = {
      YOUTUBE: '▶️', DEVMASTERY: '⚡', WEBSITE: '🌐',
      BOOK: '📖', PLATFORM: '🎓', OTHER: '📚'
    };
    return icons[source] || '📚';
  }

  confidenceLabel(): string {
    const labels = ['', 'Completely forgot', 'Mostly forgot', 'Partially remembered',
                    'Remembered well', 'Perfect recall!'];
    return labels[this.form.confidenceScore || 0] || '';
  }

  recallConfidenceLabel(): string {
    const labels = ['', '😓 Forgot most of it', '😕 Remembered a little',
                    '🙂 Partial recall', '😊 Good memory', '🔥 Perfect!'];
    return labels[this.recallConfidence] || 'Select a rating';
  }

  recallBonusXp(): number {
    return [0, 5, 5, 10, 20, 30][this.recallConfidence] || 0;
  }

  private defaultForm(): Partial<LearningLog> {
    return {
      subject: '', topic: '', source: 'YOUTUBE', durationMinutes: 60,
      activityType: 'WATCHED_VIDEO', noteTaken: false, codedAlong: false,
      recallDone: false, confidenceScore: 0
    };
  }
}
