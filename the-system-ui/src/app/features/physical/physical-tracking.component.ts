import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LifeOsService } from '../../core/services/life-os.service';
import { HealthService } from '../../core/services/health.service';
import { WorkoutEntry } from '../../core/models/models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-physical-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="pt-shell">
    <header class="pt-topbar">
      <a class="btn-back spring-hover tech" routerLink="/system" aria-label="Back to dashboard">
        <span class="back-icon">‹</span> BACK
      </a>
      <h1 class="mono sys-title">
        <span class="title-icon">🔥</span> HUNTER TRAINING
      </h1>
      <span class="spacer"></span>
    </header>

    <div class="intro-panel system-card">
      <div class="intro-content">
        <h3 class="mono quest-title">
          <span class="diamond">◈</span> COURAGE OF THE WEAK
        </h3>
        <p class="tech quest-desc">The System demands daily physical conditioning. Failure to complete this quest will result in penalties. No gym required—only your resolve.</p>
      </div>
    </div>

    <!-- Dynamic Progress Grid -->
    <div class="training-grid">
      <div class="training-card" *ngFor="let ex of trackedExercises()" [class.completed]="getTodayProgress(ex) >= getGoal(ex)">
        <div class="card-glow"></div>
        <div class="t-head">
          <div class="t-icon-wrapper">
            <span class="t-icon">{{ getIcon(ex) }}</span>
          </div>
          <span class="t-title mono">{{ ex | uppercase }}</span>
          <button class="t-remove spring-hover" (click)="removeExercise(ex)" aria-label="Remove exercise" title="Remove">✕</button>
        </div>
        
        <div class="t-progress-container">
          <div class="t-progress-bar">
            <div class="ring-bg"></div>
            <div class="ring-fill" [class.run-fill]="isCardio(ex)" [style.width]="Math.min(100, (getTodayProgress(ex) / getGoal(ex) * 100)) + '%'">
              <div class="fill-glow"></div>
            </div>
          </div>
          <div class="t-stats">
            <span class="t-count mono">{{ getTodayProgress(ex) | number: (isCardio(ex) ? '1.0-1' : '1.0-0') }}</span>
            <span class="t-max tech">/ {{ getGoal(ex) }}{{ isCardio(ex) ? ' KM' : '' }}</span>
          </div>
        </div>

        <div class="t-actions">
          <button class="t-btn spring-hover" (click)="logCustom(ex, getInc1(ex))" [disabled]="saving()">
            <span class="btn-text">+{{ getInc1(ex) }}{{ isCardio(ex) ? ' KM' : '' }}</span>
          </button>
          <button class="t-btn spring-hover" (click)="logCustom(ex, getInc2(ex))" [disabled]="saving()">
            <span class="btn-text">+{{ getInc2(ex) }}{{ isCardio(ex) ? ' KM' : '' }}</span>
          </button>
        </div>
        
        <div class="cleared-stamp mono" *ngIf="getTodayProgress(ex) >= getGoal(ex)">CLEARED</div>
      </div>
    </div>

    <!-- Additional Controls -->
    <div class="controls-grid">
      <!-- Health Connect / Google Fit Sync -->
      <div class="control-card system-card">
        <div class="cc-header">
          <h3 class="mono cc-title"><span class="diamond" style="color: #1FBE8E">◈</span> WEARABLE SYNC</h3>
        </div>
        <p class="tech cc-desc">
          Connect to Google Fit or Health Connect to automatically log your steps and running distance.
        </p>
        <button class="btn-action btn-sync mono spring-hover" (click)="syncWearable()" [disabled]="syncing()">
          <span class="icon" *ngIf="!syncing()">⚡</span>
          <span class="spinner" *ngIf="syncing()"></span>
          {{ syncing() ? 'SYNCING DATA...' : 'SYNC HEALTH DATA' }}
        </button>
      </div>

      <!-- Add New Custom Exercise -->
      <div class="control-card system-card">
        <div class="cc-header">
          <h3 class="mono cc-title"><span class="diamond" style="color: var(--accent-purple)">◈</span> ADD CUSTOM WORKOUT</h3>
        </div>
        <div class="add-form">
          <div class="input-wrapper">
            <input type="text" class="custom-input tech" placeholder="E.g. Pull-ups, Planks, Swimming" [(ngModel)]="newWorkoutName" (keyup.enter)="addWorkout()" />
            <div class="input-focus-border"></div>
          </div>
          <div class="form-row">
            <label class="custom-checkbox tech">
              <input type="checkbox" [(ngModel)]="isNewCardio" />
              <span class="checkmark"></span>
              <span class="lbl-text">Cardio (KM)</span>
            </label>
            <button class="btn-action btn-add mono spring-hover" (click)="addWorkout()">ADD</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lifetime Stats -->
    <div class="lifetime-panel system-card">
      <div class="lp-header">
        <h3 class="mono"><span class="diamond" style="color: var(--accent-gold)">◈</span> LIFETIME RECORDS</h3>
      </div>
      <div class="stat-grid tech">
        <div class="stat-box" *ngFor="let ex of trackedExercises()">
          <div class="sb-glow"></div>
          <span class="slbl">TOTAL {{ ex | uppercase }}</span>
          <div class="sval-wrap">
            <span class="sval mono">{{ getTotalProgress(ex) | number: (isCardio(ex) ? '1.0-1' : '1.0-0') }}</span>
            <span class="sunit" *ngIf="isCardio(ex)">KM</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ PROGRESSIVE OVERLOAD TRACKER ═══════════════════════════════ -->
    <div class="po-panel system-card">
      <div class="card-glow"></div>
      <div class="po-header">
        <div>
          <h3 class="mono po-title"><span class="diamond" style="color:#A855F7">◈</span> PROGRESSIVE OVERLOAD</h3>
          <p class="tech po-sub">Track sets × reps × weight. Beat last session.</p>
        </div>
        <button class="po-add-btn mono spring-hover" (click)="poFormOpen = !poFormOpen">{{ poFormOpen ? '✕' : '+ LOG SET' }}</button>
      </div>

      <!-- Log Set Form -->
      <div class="po-form" *ngIf="poFormOpen">
        <div class="po-form-row">
          <input class="custom-input" placeholder="Exercise (e.g. Bench Press)" [(ngModel)]="poExercise" style="flex:2"/>
          <input class="custom-input" type="number" placeholder="Sets" [(ngModel)]="poSets" min="1" style="width:70px"/>
          <input class="custom-input" type="number" placeholder="Reps" [(ngModel)]="poReps" min="1" style="width:70px"/>
          <input class="custom-input" type="number" placeholder="Weight (kg)" [(ngModel)]="poWeight" min="0" step="0.5" style="width:100px"/>
          <button class="po-submit-btn mono spring-hover" (click)="logPoSet()" [disabled]="!poExercise">LOG</button>
        </div>
        <div class="tech" style="font-size:0.7rem;color:var(--text-secondary);margin-top:6px;">Volume = Sets × Reps × Weight (kg)</div>
      </div>

      <!-- Session History -->
      <div class="po-history" *ngIf="poLogs.length > 0">
        <div class="po-exercise-group" *ngFor="let group of poGrouped">
          <div class="po-ex-header">
            <span class="mono po-ex-name">{{ group.exercise }}</span>
            <span class="tech po-ex-vol" style="color:#A855F7">VOL {{ group.totalVolume | number:'1.0-0' }} kg</span>
            <span class="tech po-ex-vs" [style.color]="group.vsLast >= 0 ? '#1D9E75' : '#E24B4A'">
              {{ group.vsLast >= 0 ? '↑' : '↓' }} {{ group.vsLast | number:'1.0-0' }} vs last
            </span>
          </div>
          <div class="po-sets-row">
            <div class="po-set-chip" *ngFor="let s of group.sets; let i = index">
              <span class="tech">S{{ i+1 }}</span>
              <span class="mono">{{ s.reps }}×{{ s.weight }}kg</span>
            </div>
          </div>
        </div>
      </div>
      <div class="tech" *ngIf="poLogs.length === 0" style="color:var(--text-secondary);font-size:0.75rem;padding:12px 0;">No sets logged today. Start your first set above.</div>
    </div>

    <!-- ═══ SLEEP QUALITY TRACKER ════════════════════════════════════════ -->
    <div class="sleep-panel system-card">
      <div class="card-glow"></div>
      <div class="sleep-header">
        <div>
          <h3 class="mono sleep-title"><span class="diamond" style="color:#4fc3f7">◈</span> SLEEP TRACKER</h3>
          <p class="tech sleep-sub">Log sleep quality for recovery score calculation.</p>
        </div>
        <div class="sleep-recovery-badge" [style.background]="sleepRecoveryColor + '22'" [style.border-color]="sleepRecoveryColor + '66'">
          <span class="mono sleep-score" [style.color]="sleepRecoveryColor">{{ sleepRecoveryScore }}</span>
          <span class="tech" style="font-size:0.6rem;letter-spacing:1px;">RECOVERY</span>
        </div>
      </div>

      <!-- Log sleep -->
      <div class="sleep-form">
        <div class="sleep-form-row">
          <div style="display:flex;flex-direction:column;gap:4px;flex:1;">
            <label class="tech" style="font-size:0.65rem;color:var(--text-secondary);letter-spacing:1px;">SLEPT AT</label>
            <input class="custom-input" type="time" [(ngModel)]="sleepBedTime" style="width:100%;"/>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;flex:1;">
            <label class="tech" style="font-size:0.65rem;color:var(--text-secondary);letter-spacing:1px;">WOKE AT</label>
            <input class="custom-input" type="time" [(ngModel)]="sleepWakeTime" style="width:100%;"/>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;flex:1;">
            <label class="tech" style="font-size:0.65rem;color:var(--text-secondary);letter-spacing:1px;">QUALITY</label>
            <select class="custom-input" [(ngModel)]="sleepQuality">
              <option value="5">5 ⭐ Deep</option>
              <option value="4">4 ⭐ Good</option>
              <option value="3">3 ⭐ Average</option>
              <option value="2">2 ⭐ Poor</option>
              <option value="1">1 ⭐ Terrible</option>
            </select>
          </div>
          <button class="po-submit-btn mono spring-hover" (click)="logSleep()" [disabled]="!sleepBedTime || !sleepWakeTime">LOG SLEEP</button>
        </div>
      </div>

      <!-- Sleep history mini -->
      <div class="sleep-history" *ngIf="sleepLogs.length > 0">
        <div class="sleep-row" *ngFor="let s of sleepLogs.slice(0, 7)">
          <span class="tech sleep-date">{{ s.date }}</span>
          <span class="mono sleep-dur" [style.color]="s.hours >= 7 ? '#1D9E75' : (s.hours >= 6 ? '#FAC775' : '#E24B4A')">
            {{ s.hours | number:'1.0-1' }}h
          </span>
          <div class="sleep-stars">
            <span *ngFor="let star of [1,2,3,4,5]" [style.color]="star <= s.quality ? '#FAC775' : 'rgba(255,255,255,0.15)'">★</span>
          </div>
          <div class="sleep-bar-bg">
            <div class="sleep-bar-fill" [style.width.%]="(s.hours / 10) * 100" [style.background]="s.hours >= 7 ? '#1D9E75' : (s.hours >= 6 ? '#FAC775' : '#E24B4A')"></div>
          </div>
        </div>
      </div>
      <div class="tech" *ngIf="sleepLogs.length === 0" style="color:var(--text-secondary);font-size:0.75rem;padding:12px 0;">No sleep logged yet. Track your first night above.</div>
    </div>

  </div>
  `,
  styles: [`
  :host { display: block; }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .pt-shell { 
    max-width: 900px; 
    margin: 0 auto; 
    padding: max(env(safe-area-inset-top, 20px), 20px) 24px 80px; 
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  
  /* Topbar */
  .pt-topbar { 
    display: flex; 
    align-items: center; 
    justify-content: space-between;
  }
  .sys-title { 
    margin: 0; 
    font-size: 1.2rem; 
    letter-spacing: 4px; 
    color: var(--accent-red); 
    text-shadow: 0 0 15px rgba(226,75,74,0.5), 0 0 30px rgba(226,75,74,0.2);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sys-title .title-icon { font-size: 1.4rem; }
  
  .btn-back { 
    text-decoration: none; 
    color: var(--text-secondary); 
    font-size: 0.8rem; 
    letter-spacing: 2px; 
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.1); 
    border-radius: 8px; 
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  .btn-back:hover { 
    color: var(--text-primary); 
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.3);
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  }
  .pt-topbar .spacer { width: 90px; }

  /* Intro Panel */
  .intro-panel { 
    position: relative;
    padding: 24px 28px; 
    background: linear-gradient(135deg, rgba(226,75,74,0.08) 0%, rgba(13,13,28,0.8) 100%);
    border: 1px solid rgba(226,75,74,0.3);
    border-radius: 12px;
    box-shadow: inset 0 0 40px rgba(226,75,74,0.05), 0 8px 32px rgba(0,0,0,0.5);
    overflow: hidden;
  }
  .intro-panel::before {
    content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
    background: var(--accent-red);
    box-shadow: 0 0 15px var(--accent-red);
  }
  .quest-title { 
    margin: 0 0 12px; 
    color: #fca5a5; 
    font-size: 1rem; 
    letter-spacing: 4px; 
    display: flex;
    align-items: center;
    gap: 8px;
    text-shadow: 0 2px 10px rgba(226,75,74,0.4);
  }
  .quest-title .diamond { font-size: 0.8em; color: var(--accent-red); }
  .quest-desc { 
    margin: 0; 
    font-size: 0.85rem; 
    color: var(--text-secondary); 
    line-height: 1.6; 
    max-width: 80%;
  }

  /* Training Grid */
  .training-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); 
    gap: 24px; 
  }
  
  .training-card { 
    background: rgba(18, 18, 30, 0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.08); 
    border-radius: 16px; 
    padding: 24px; 
    display: flex; 
    flex-direction: column; 
    gap: 20px;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
    position: relative; 
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  }
  .training-card:hover {
    transform: translateY(-4px);
    border-color: rgba(255,255,255,0.15);
    box-shadow: 0 15px 40px rgba(0,0,0,0.6), inset 0 0 20px rgba(255,255,255,0.02);
  }
  
  .card-glow {
    position: absolute; top: 0; left: 0; right: 0; height: 100%;
    background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 60%);
    pointer-events: none;
  }
  
  .training-card.completed {
    border-color: rgba(29,158,117,0.4);
    background: rgba(13, 28, 22, 0.7);
    box-shadow: 0 10px 30px rgba(0,0,0,0.4), inset 0 0 30px rgba(29,158,117,0.1);
  }
  .training-card.completed:hover {
    border-color: rgba(29,158,117,0.6);
    box-shadow: 0 15px 40px rgba(0,0,0,0.5), inset 0 0 40px rgba(29,158,117,0.15);
  }
  
  .cleared-stamp {
    position: absolute; 
    top: 24px; right: -30px;
    background: linear-gradient(90deg, #1D9E75, #147a59); 
    color: #fff; 
    font-size: 0.6rem; 
    font-weight: 800;
    padding: 6px 30px; 
    transform: rotate(45deg); 
    letter-spacing: 3px;
    box-shadow: 0 2px 10px rgba(29,158,117,0.5);
    z-index: 10;
  }

  .t-head { display: flex; align-items: center; gap: 14px; position: relative; z-index: 2; }
  .t-icon-wrapper {
    width: 42px; height: 42px;
    border-radius: 10px;
    background: rgba(255,255,255,0.05);
    display: flex; align-items: center; justify-content: center;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: inset 0 2px 4px rgba(255,255,255,0.05);
  }
  .t-icon { font-size: 1.4rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
  .t-title { font-size: 1.05rem; letter-spacing: 3px; color: var(--text-primary); font-weight: 700; flex: 1; }
  .t-remove { 
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); 
    color: var(--text-secondary); width: 28px; height: 28px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; cursor: pointer; transition: all 0.2s; 
  }
  .t-remove:hover { color: #fff; background: rgba(226,75,74,0.8); border-color: #E24B4A; box-shadow: 0 0 10px rgba(226,75,74,0.5); }

  .t-progress-container {
    display: flex; flex-direction: column; gap: 10px; position: relative; z-index: 2; margin-top: 10px;
  }
  .t-stats {
    display: flex; align-items: baseline; justify-content: flex-end; gap: 4px;
    position: absolute; right: 0; top: -38px;
  }
  .t-count { font-size: 1.8rem; font-weight: 800; color: #fff; text-shadow: 0 2px 10px rgba(0,0,0,0.8); }
  .t-max { font-size: 0.85rem; color: rgba(255,255,255,0.5); font-weight: 600; }

  .t-progress-bar { 
    position: relative; height: 12px; border-radius: 6px; 
    background: rgba(0,0,0,0.5); 
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);
    overflow: hidden; 
    border: 1px solid rgba(255,255,255,0.05); 
  }
  .ring-fill { 
    position: absolute; left: 0; top: 0; bottom: 0; 
    background: linear-gradient(90deg, #E24B4A, #ff6b6b); 
    transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1); 
    border-radius: 6px;
    box-shadow: 0 0 10px rgba(226,75,74,0.5);
  }
  .run-fill { 
    background: linear-gradient(90deg, #534AB7, #786df0); 
    box-shadow: 0 0 10px rgba(83,74,183,0.5);
  }
  .training-card.completed .ring-fill, .training-card.completed .run-fill { 
    background: linear-gradient(90deg, #1D9E75, #26cf9a); 
    box-shadow: 0 0 15px rgba(29,158,117,0.6);
  }
  
  .fill-glow {
    position: absolute; top: 0; right: 0; bottom: 0; width: 20px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4));
    border-radius: 0 6px 6px 0;
  }

  .t-actions { display: flex; gap: 12px; position: relative; z-index: 2; margin-top: 4px; }
  .t-btn { 
    flex: 1; padding: 12px 0; border-radius: 8px; 
    border: 1px solid rgba(255,255,255,0.08); 
    background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%); 
    color: var(--text-primary); font-family: 'Rajdhani', sans-serif;
    font-size: 0.9rem; letter-spacing: 2px; font-weight: 700; cursor: pointer; transition: all 0.2s;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  }
  .t-btn:hover:not([disabled]) { 
    background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%); 
    border-color: rgba(255,255,255,0.2); 
    transform: translateY(-2px); 
    box-shadow: 0 6px 15px rgba(0,0,0,0.4);
  }
  .t-btn:active:not([disabled]) { transform: translateY(1px); box-shadow: 0 2px 5px rgba(0,0,0,0.4); }
  .t-btn[disabled] { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }

  /* Controls Grid */
  .controls-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 24px;
  }
  
  .control-card {
    background: rgba(18, 18, 30, 0.4);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
    padding: 24px;
    display: flex; flex-direction: column;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .control-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255,255,255,0.1);
    box-shadow: 0 12px 32px rgba(0,0,0,0.4);
  }
  
  .cc-header { margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; }
  .cc-title { margin: 0; font-size: 0.9rem; letter-spacing: 3px; color: var(--text-primary); display: flex; gap: 8px; align-items: center; }
  
  .cc-desc { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px; flex: 1; }
  
  .btn-action {
    padding: 14px 24px; border-radius: 8px; border: none;
    font-size: 0.85rem; letter-spacing: 2px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.3s ease;
    width: 100%;
    font-family: 'Rajdhani', sans-serif;
  }
  .btn-sync {
    background: linear-gradient(135deg, rgba(29,158,117,0.2), rgba(29,158,117,0.05));
    border: 1px solid rgba(29,158,117,0.4);
    color: #1FBE8E;
    box-shadow: 0 4px 15px rgba(29,158,117,0.1);
  }
  .btn-sync:hover:not([disabled]) {
    background: linear-gradient(135deg, rgba(29,158,117,0.3), rgba(29,158,117,0.1));
    border-color: rgba(29,158,117,0.8);
    box-shadow: 0 6px 20px rgba(29,158,117,0.2), inset 0 0 10px rgba(29,158,117,0.2);
  }
  
  .spinner {
    width: 16px; height: 16px; border: 2px solid rgba(31, 190, 142, 0.3); border-top-color: #1FBE8E;
    border-radius: 50%; animation: spin 1s linear infinite;
  }
  
  .add-form { display: flex; flex-direction: column; gap: 16px; }
  
  .input-wrapper { position: relative; }
  .custom-input {
    width: 100%; padding: 14px 16px; 
    background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
    color: var(--text-primary); font-size: 0.9rem;
    transition: all 0.3s;
    outline: none;
    box-sizing: border-box;
  }
  .custom-input::placeholder { color: rgba(255,255,255,0.3); }
  .custom-input:focus { background: rgba(0,0,0,0.6); border-color: var(--accent-purple); }
  .input-focus-border {
    position: absolute; bottom: -1px; left: 10%; right: 10%; height: 2px;
    background: var(--accent-purple); opacity: 0; transition: all 0.3s;
    box-shadow: 0 0 10px var(--accent-purple);
  }
  .custom-input:focus + .input-focus-border { left: 0; right: 0; opacity: 1; }
  
  .form-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  
  /* Custom Checkbox */
  .custom-checkbox {
    display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none;
    font-size: 0.85rem; color: var(--text-secondary); transition: color 0.2s;
  }
  .custom-checkbox:hover { color: var(--text-primary); }
  .custom-checkbox input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
  .checkmark {
    height: 20px; width: 20px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
    border-radius: 4px; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .custom-checkbox input:checked ~ .checkmark { background: var(--accent-purple); border-color: var(--accent-purple); }
  .checkmark:after {
    content: ""; display: none; width: 5px; height: 10px;
    border: solid white; border-width: 0 2px 2px 0;
    transform: rotate(45deg); margin-bottom: 2px;
  }
  .custom-checkbox input:checked ~ .checkmark:after { display: block; }
  
  .btn-add {
    background: linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05));
    border: 1px solid rgba(168,85,247,0.4);
    color: #c084fc; width: auto; min-width: 100px; padding: 12px 24px;
    box-shadow: 0 4px 15px rgba(168,85,247,0.1);
  }
  .btn-add:hover {
    background: linear-gradient(135deg, rgba(168,85,247,0.3), rgba(168,85,247,0.1));
    border-color: rgba(168,85,247,0.8);
    box-shadow: 0 6px 20px rgba(168,85,247,0.2), inset 0 0 10px rgba(168,85,247,0.2);
  }

  /* Lifetime Panel */
  .lifetime-panel {
    background: rgba(18, 18, 30, 0.4); border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px; padding: 24px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }
  .lp-header { margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; }
  .lp-header h3 { margin: 0; font-size: 0.95rem; letter-spacing: 3px; color: var(--text-primary); display: flex; gap: 8px; align-items: center; }
  
  .stat-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px;
  }
  
  .stat-box {
    position: relative; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05);
    border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 8px;
    overflow: hidden; transition: all 0.3s;
  }
  .stat-box:hover {
    background: rgba(255,255,255,0.02); border-color: rgba(250,199,117,0.3);
    transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.4);
  }
  .sb-glow {
    position: absolute; top: -50px; right: -50px; width: 100px; height: 100px;
    background: radial-gradient(circle, rgba(250,199,117,0.1) 0%, transparent 70%);
  }
  .slbl { font-size: 0.65rem; color: var(--text-secondary); letter-spacing: 2px; font-weight: 600; text-transform: uppercase; z-index: 1; }
  .sval-wrap { display: flex; align-items: baseline; gap: 6px; z-index: 1; }
  .sval { font-size: 1.6rem; color: var(--text-primary); font-weight: 800; text-shadow: 0 2px 8px rgba(0,0,0,0.5); }
  .sunit { font-size: 0.8rem; color: rgba(255,255,255,0.4); font-weight: 700; }

  /* ── Progressive Overload ── */
  .po-panel { position:relative; overflow:hidden; padding:24px 28px; border:1px solid rgba(168,85,247,0.25); border-radius:12px; background:linear-gradient(135deg,rgba(168,85,247,0.06),rgba(13,13,28,0.8)); }
  .po-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
  .po-title { margin:0 0 4px; font-size:1rem; letter-spacing:3px; color:#c4a0ff; }
  .po-sub { margin:0; font-size:0.75rem; color:var(--text-secondary); }
  .po-add-btn { padding:8px 16px; border-radius:8px; border:1px solid rgba(168,85,247,0.5); background:rgba(168,85,247,0.12); color:#c4a0ff; font-size:0.75rem; letter-spacing:2px; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
  .po-add-btn:hover { background:rgba(168,85,247,0.25); box-shadow:0 0 12px rgba(168,85,247,0.4); }
  .po-form { margin-bottom:16px; padding:16px; border-radius:10px; background:rgba(0,0,0,0.3); border:1px solid rgba(168,85,247,0.2); }
  .po-form-row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
  .po-submit-btn { padding:10px 16px; border-radius:8px; border:1px solid rgba(29,158,117,0.5); background:rgba(29,158,117,0.15); color:#5DCAA5; font-size:0.72rem; letter-spacing:2px; cursor:pointer; white-space:nowrap; transition:all 0.2s; }
  .po-submit-btn:hover:not(:disabled) { background:rgba(29,158,117,0.3); box-shadow:0 0 10px rgba(29,158,117,0.4); }
  .po-submit-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .po-history { display:flex; flex-direction:column; gap:12px; }
  .po-exercise-group { border:1px solid rgba(168,85,247,0.15); border-radius:10px; padding:12px 16px; background:rgba(0,0,0,0.2); }
  .po-ex-header { display:flex; align-items:center; gap:12px; margin-bottom:10px; flex-wrap:wrap; }
  .po-ex-name { font-size:0.9rem; color:#fff; font-weight:600; }
  .po-ex-vol { font-size:0.72rem; letter-spacing:1px; }
  .po-ex-vs { font-size:0.72rem; letter-spacing:0.5px; }
  .po-sets-row { display:flex; gap:8px; flex-wrap:wrap; }
  .po-set-chip { display:flex; flex-direction:column; align-items:center; gap:2px; padding:6px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); font-size:0.7rem; }
  .po-set-chip .tech { font-size:0.55rem; color:var(--text-secondary); letter-spacing:1px; }
  .po-set-chip .mono { color:#fff; }

  /* ── Sleep Tracker ── */
  .sleep-panel { position:relative; overflow:hidden; padding:24px 28px; border:1px solid rgba(79,195,247,0.2); border-radius:12px; background:linear-gradient(135deg,rgba(79,195,247,0.05),rgba(13,13,28,0.85)); }
  .sleep-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
  .sleep-title { margin:0 0 4px; font-size:1rem; letter-spacing:3px; color:#8fd8f7; }
  .sleep-sub { margin:0; font-size:0.75rem; color:var(--text-secondary); }
  .sleep-recovery-badge { display:flex; flex-direction:column; align-items:center; padding:10px 16px; border-radius:10px; border:1px solid; }
  .sleep-score { font-size:1.6rem; font-weight:800; }
  .sleep-form { margin-bottom:16px; }
  .sleep-form-row { display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end; }
  .sleep-history { display:flex; flex-direction:column; gap:8px; }
  .sleep-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .sleep-row:last-child { border-bottom:none; }
  .sleep-date { font-size:0.7rem; color:var(--text-secondary); width:48px; flex-shrink:0; }
  .sleep-dur { font-size:1rem; font-weight:700; width:38px; text-align:right; flex-shrink:0; }
  .sleep-stars { display:flex; gap:2px; font-size:0.75rem; flex-shrink:0; }
  .sleep-bar-bg { flex:1; height:6px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden; }
  .sleep-bar-fill { height:100%; border-radius:3px; transition:width 0.8s ease; }

  @media (max-width: 768px) {
    .training-grid, .controls-grid { grid-template-columns: 1fr; }
    .quest-desc { max-width: 100%; }
    .pt-shell { padding: 20px 16px 80px; }
    .t-stats { position: relative; top: 0; margin-bottom: 8px; justify-content: flex-start; }
    .t-progress-container { flex-direction: column-reverse; margin-top: 0; }
    .po-form-row { flex-direction: column; }
    .sleep-form-row { flex-direction: column; }
  }
  `]
})
export class PhysicalTrackingComponent implements OnInit {
  saving = signal(false);
  history = signal<WorkoutEntry[]>([]);
  Math = Math;

  // List of exercises the user has added to their dashboard
  trackedExercises = signal<string[]>([]);
  
  // A map to remember if a custom exercise is cardio-based
  cardioMap = signal<{ [key: string]: boolean }>({});

  newWorkoutName = '';
  isNewCardio = false;
  syncing = signal(false);

  constructor(private lifeOs: LifeOsService, private snack: MatSnackBar, public health: HealthService) {}

  async ngOnInit() {
    this.loadPreferences();
    this.loadHistory();
    await this.health.checkAvailability();
  }

  loadPreferences() {
    const saved = localStorage.getItem('lifeos.trackedWorkouts');
    const savedCardio = localStorage.getItem('lifeos.cardioMap');

    if (saved) {
      this.trackedExercises.set(JSON.parse(saved));
    } else {
      // Default Courage of the Weak setup
      this.trackedExercises.set(['Push-ups', 'Sit-ups', 'Squats', 'Running']);
    }

    if (savedCardio) {
      this.cardioMap.set(JSON.parse(savedCardio));
    } else {
      this.cardioMap.set({ 'Running': true, 'Swimming': true, 'Cycling': true });
    }
  }

  savePreferences() {
    localStorage.setItem('lifeos.trackedWorkouts', JSON.stringify(this.trackedExercises()));
    localStorage.setItem('lifeos.cardioMap', JSON.stringify(this.cardioMap()));
  }

  loadHistory() {
    this.lifeOs.workoutHistory().subscribe({
      next: data => this.history.set(data),
      error: err => console.error('Failed to load training history', err)
    });
  }

  addWorkout() {
    const name = this.newWorkoutName.trim();
    if (!name) return;
    
    // Capitalize first letter
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

    if (this.trackedExercises().includes(formattedName)) {
      this.snack.open('Exercise already exists.', 'OK', { duration: 2000 });
      return;
    }

    this.trackedExercises.update(list => [...list, formattedName]);
    this.cardioMap.update(map => ({ ...map, [formattedName]: this.isNewCardio }));
    this.savePreferences();

    this.newWorkoutName = '';
    this.isNewCardio = false;
    this.snack.open(`${formattedName} added to dashboard.`, 'OK', { duration: 2000 });
  }

  removeExercise(name: string) {
    if (confirm(`Remove ${name} from your dashboard? Your logged history will NOT be deleted.`)) {
      this.trackedExercises.update(list => list.filter(ex => ex !== name));
      this.savePreferences();
    }
  }

  logCustom(exercise: string, value: number) {
    this.saving.set(true);
    const cardio = this.isCardio(exercise);

    const entry: WorkoutEntry = { 
      exerciseName: exercise, 
      sets: 1, 
      reps: cardio ? 1 : value, 
      weightKg: cardio ? value : 0 
    };
    
    this.lifeOs.logWorkout(entry).subscribe({
      next: (saved) => {
        this.history.update(h => [saved, ...h]);
        this.saving.set(false);
        this.snack.open(`+${value} ${cardio ? 'KM' : 'reps'} of ${exercise} logged.`, 'OK', { duration: 2000 });
      },
      error: (err) => {
        console.error(err);
        this.saving.set(false);
        this.snack.open('Failed to log training.', 'OK', { duration: 3000 });
      }
    });
  }

  async syncWearable() {
    this.syncing.set(true);
    const available = await this.health.checkAvailability();
    if (!available) {
      this.snack.open('Health Connect/Google Fit is not available or permission denied.', 'OK', { duration: 3000 });
      this.syncing.set(false);
      return;
    }

    const data = await this.health.syncToday();
    let dataSynced = false;

    if (data.steps > 0) {
      if (!this.trackedExercises().includes('Steps')) {
        this.trackedExercises.update(list => [...list, 'Steps']);
        this.savePreferences();
      }
      const currentSteps = this.getTodayProgress('Steps');
      const stepDelta = data.steps - currentSteps;
      if (stepDelta > 0) {
        this.logCustom('Steps', stepDelta);
        dataSynced = true;
      }
    }

    if (data.distance > 0) {
      if (!this.trackedExercises().includes('Running')) {
        this.trackedExercises.update(list => [...list, 'Running']);
        this.cardioMap.update(map => ({ ...map, 'Running': true }));
        this.savePreferences();
      }
      const currentRunning = this.getTodayProgress('Running');
      // Fix floating point precision issues for distance (e.g. 1.23 - 1.20 = 0.030000000000000027)
      const distDelta = Number((data.distance - currentRunning).toFixed(3));
      if (distDelta > 0) {
        this.logCustom('Running', distDelta);
        dataSynced = true;
      }
    }

    if (!dataSynced) {
      this.snack.open('Health data is already up to date.', 'OK', { duration: 2000 });
    }
    this.syncing.set(false);
  }

  // --- Dynamic Configuration Helpers ---

  getIcon(ex: string): string {
    const l = ex.toLowerCase();
    if (l.includes('push')) return '💪';
    if (l.includes('sit')) return '🪨';
    if (l.includes('squat')) return '🦵';
    if (l.includes('run') || l.includes('jog')) return '🏃';
    if (l.includes('swim')) return '🏊';
    if (l.includes('cycle') || l.includes('bike')) return '🚴';
    if (l.includes('pull')) return '🧗';
    return '⚡';
  }

  isCardio(ex: string): boolean {
    return !!this.cardioMap()[ex];
  }

  getGoal(ex: string): number {
    return this.isCardio(ex) ? 10 : 100;
  }

  getInc1(ex: string): number {
    return this.isCardio(ex) ? 1 : 10;
  }

  getInc2(ex: string): number {
    return this.isCardio(ex) ? 2.5 : 25;
  }

  // --- Data Access Helpers ---

  getTodayProgress(exercise: string): number {
    const todayStr = new Date().toISOString().split('T')[0];
    const isCardio = this.isCardio(exercise);

    return this.history()
      .filter(e => e.exerciseName === exercise && e.workoutDate === todayStr)
      .reduce((sum, e) => sum + (isCardio ? (e.weightKg || 0) : (e.reps || 0)), 0);
  }

  getTotalProgress(exercise: string): number {
    const isCardio = this.isCardio(exercise);

    return this.history()
      .filter(e => e.exerciseName === exercise)
      .reduce((sum, e) => sum + (isCardio ? (e.weightKg || 0) : (e.reps || 0)), 0);
  }

  // ── Progressive Overload ──────────────────────────────────────────────

  poFormOpen = false;
  poExercise = '';
  poSets = 3;
  poReps = 10;
  poWeight = 0;
  poLogs: { exercise: string; sets: number; reps: number; weight: number; ts: Date }[] = this.loadPoLogs();

  loadPoLogs(): { exercise: string; sets: number; reps: number; weight: number; ts: Date }[] {
    try {
      const saved = localStorage.getItem('lifeos.poLogs');
      if (!saved) return [];
      return JSON.parse(saved).map((l: any) => ({ ...l, ts: new Date(l.ts) }));
    } catch { return []; }
  }

  savePoLogs() {
    localStorage.setItem('lifeos.poLogs', JSON.stringify(this.poLogs));
  }

  logPoSet() {
    if (!this.poExercise) return;
    const entry = { exercise: this.poExercise.trim(), sets: this.poSets || 1, reps: this.poReps || 1, weight: this.poWeight || 0, ts: new Date() };
    this.poLogs = [entry, ...this.poLogs.filter(l => l.exercise !== entry.exercise || l.ts.toDateString() === entry.ts.toDateString())];
    this.savePoLogs();
    this.snack.open(`◈ ${entry.sets}×${entry.reps} @ ${entry.weight}kg logged for ${entry.exercise}`, 'OK', { duration: 2500 });
    this.poExercise = '';
  }

  get poGrouped(): { exercise: string; sets: { reps: number; weight: number }[]; totalVolume: number; vsLast: number }[] {
    const today = new Date().toDateString();
    const todayLogs = this.poLogs.filter(l => new Date(l.ts).toDateString() === today);
    const grouped = new Map<string, { sets: { reps: number; weight: number }[]; totalVolume: number }>();
    for (const l of todayLogs) {
      if (!grouped.has(l.exercise)) grouped.set(l.exercise, { sets: [], totalVolume: 0 });
      const g = grouped.get(l.exercise)!;
      for (let s = 0; s < l.sets; s++) g.sets.push({ reps: l.reps, weight: l.weight });
      g.totalVolume += l.sets * l.reps * l.weight;
    }
    return Array.from(grouped.entries()).map(([exercise, data]) => ({
      exercise, sets: data.sets, totalVolume: data.totalVolume, vsLast: data.totalVolume
    }));
  }

  // ── Sleep Tracker ─────────────────────────────────────────────────────

  sleepBedTime = '';
  sleepWakeTime = '';
  sleepQuality = '4';
  sleepLogs: { date: string; hours: number; quality: number }[] = this.loadSleepLogs();

  loadSleepLogs(): { date: string; hours: number; quality: number }[] {
    try {
      const saved = localStorage.getItem('lifeos.sleepLogs');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  }

  logSleep() {
    if (!this.sleepBedTime || !this.sleepWakeTime) return;
    const [bh, bm] = this.sleepBedTime.split(':').map(Number);
    const [wh, wm] = this.sleepWakeTime.split(':').map(Number);
    let hours = (wh + wm / 60) - (bh + bm / 60);
    if (hours < 0) hours += 24; // overnight
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    this.sleepLogs = [{ date: today, hours: Math.round(hours * 10) / 10, quality: Number(this.sleepQuality) }, ...this.sleepLogs.slice(0, 29)];
    localStorage.setItem('lifeos.sleepLogs', JSON.stringify(this.sleepLogs));
    this.snack.open(`◈ Sleep logged: ${hours.toFixed(1)}h · Quality ${this.sleepQuality}⭐`, 'OK', { duration: 2500 });
    this.sleepBedTime = '';
    this.sleepWakeTime = '';
  }

  get sleepRecoveryScore(): string {
    if (!this.sleepLogs.length) return '--';
    const avg = this.sleepLogs.slice(0, 7).reduce((a, l) => a + l.hours, 0) / Math.min(7, this.sleepLogs.length);
    const qAvg = this.sleepLogs.slice(0, 7).reduce((a, l) => a + l.quality, 0) / Math.min(7, this.sleepLogs.length);
    const score = Math.round((avg / 8) * 60 + (qAvg / 5) * 40);
    return score + '%';
  }

  get sleepRecoveryColor(): string {
    const score = parseInt(this.sleepRecoveryScore) || 0;
    if (score >= 80) return '#1D9E75';
    if (score >= 60) return '#FAC775';
    return '#E24B4A';
  }
}
