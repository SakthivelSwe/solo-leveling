import { Component, Inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { AddictionInsight } from '../../../core/models/models';

@Component({
  selector: 'app-urge-protocol',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="urge-modal">
      <div class="overlay-scanline"></div>
      
      <div class="header">
        <h2 class="mono emergency-title">🚨 EMERGENCY PROTOCOL ACTIVE</h2>
        <p class="tech subtitle">Dopamine withdrawal detected. Do not engage.</p>
      </div>

      <!-- Breathing circle -->
      <div class="breathing-container">
        <div class="breath-circle" [class.inhale]="bState() === 'INHALE'" [class.hold]="bState() === 'HOLD'" [class.exhale]="bState() === 'EXHALE'">
          <div class="breath-text tech">{{ bText() }}</div>
        </div>
      </div>

      <!-- Rotating Truth Bomb -->
      <div class="truth-bomb-box system-card">
        <h3 class="mono">SYSTEM WARNING</h3>
        <p class="truth-text tech">{{ currentTruth()?.description }}</p>
      </div>

      <!-- Timer and Actions -->
      <div class="footer">
        <div class="timer mono">{{ formatTime(timeLeft()) }}</div>
        <p class="tech">Survive the timer to earn Willpower XP.</p>
        
        <div class="actions">
          <button class="btn-fail tech" (click)="fail()">I CAN'T DO IT (EXIT)</button>
          <button class="btn-survive tech" 
                  [disabled]="timeLeft() > 0" 
                  (click)="survive()">
            {{ timeLeft() > 0 ? 'HOLD THE LINE...' : 'I SURVIVED (+20 XP)' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .urge-modal {
      background: #050505;
      color: #fff;
      padding: 32px;
      min-width: 80vw;
      min-height: 80vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      border: 2px solid #ff3333;
      box-shadow: 0 0 50px rgba(255, 51, 51, 0.2) inset;
    }
    .overlay-scanline {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
      background-size: 100% 2px, 3px 100%;
      pointer-events: none;
      z-index: 1;
    }
    .header, .breathing-container, .truth-bomb-box, .footer { z-index: 2; position: relative; width: 100%; text-align: center; }
    
    .emergency-title { color: #ff3333; font-size: 2rem; letter-spacing: 4px; text-shadow: 0 0 15px rgba(255,51,51,0.6); animation: pulse 2s infinite; margin: 0; }
    .subtitle { color: #f87171; letter-spacing: 2px; margin-top: 8px; }

    /* Breathing Animation */
    .breathing-container { display: flex; justify-content: center; align-items: center; height: 250px; margin: 20px 0; }
    .breath-circle {
      width: 150px; height: 150px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(79,195,247,0.3) 0%, rgba(79,195,247,0) 70%);
      border: 2px solid #4fc3f7;
      display: flex; justify-content: center; align-items: center;
      transition: all 4s ease-in-out;
      box-shadow: 0 0 30px rgba(79,195,247,0.4);
    }
    .breath-circle.inhale { transform: scale(1.6); border-color: #81d4fa; background: radial-gradient(circle, rgba(129,212,250,0.5) 0%, rgba(79,195,247,0) 70%); }
    .breath-circle.hold { transform: scale(1.6); border-color: #FAC775; box-shadow: 0 0 40px rgba(250,199,117,0.5); }
    .breath-circle.exhale { transform: scale(1); border-color: #4fc3f7; }
    .breath-text { font-size: 1.2rem; font-weight: bold; letter-spacing: 4px; color: #fff; text-shadow: 0 0 10px #000; }

    /* Truth Bombs */
    .truth-bomb-box {
      max-width: 600px; margin: 0 auto; padding: 24px;
      background: rgba(255,51,51,0.05); border-color: rgba(255,51,51,0.3);
    }
    .truth-bomb-box h3 { color: #ff3333; margin-top: 0; letter-spacing: 2px; }
    .truth-text { font-size: 1rem; line-height: 1.6; color: #e2e8f0; }

    /* Footer / Timer */
    .timer { font-size: 3.5rem; color: #FAC775; text-shadow: 0 0 20px rgba(250,199,117,0.5); margin-bottom: 10px; }
    .actions { display: flex; justify-content: center; gap: 24px; margin-top: 20px; }
    
    .btn-fail { background: transparent; border: 1px solid #64748b; color: #94a3b8; padding: 12px 24px; cursor: pointer; transition: all .2s; }
    .btn-fail:hover { border-color: #ff3333; color: #ff3333; }
    
    .btn-survive {
      background: rgba(250,199,117,0.1); border: 2px solid #FAC775; color: #FAC775;
      padding: 12px 32px; font-size: 1.1rem; cursor: pointer; transition: all .2s;
    }
    .btn-survive:not(:disabled) {
      background: #FAC775; color: #000; box-shadow: 0 0 30px rgba(250,199,117,0.6);
      animation: pulse-gold 1.5s infinite;
    }
    .btn-survive:disabled { opacity: 0.5; border-color: #475569; color: #94a3b8; cursor: not-allowed; }

    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
    @keyframes pulse-gold { 0% { box-shadow: 0 0 20px rgba(250,199,117,0.4); } 50% { box-shadow: 0 0 40px rgba(250,199,117,0.8); transform: scale(1.05); } 100% { box-shadow: 0 0 20px rgba(250,199,117,0.4); } }
  `]
})
export class UrgeProtocolComponent implements OnInit, OnDestroy {
  bState = signal<'INHALE' | 'HOLD' | 'EXHALE'>('INHALE');
  bText = signal('INHALE');
  
  timeLeft = signal(120); // 2 minutes
  currentTruth = signal<AddictionInsight | null>(null);
  
  private breathTimer: any;
  private mainTimer: any;
  private truthTimer: any;

  constructor(
    public dialogRef: MatDialogRef<UrgeProtocolComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { insights: AddictionInsight[] }
  ) {}

  ngOnInit() {
    this.startBreathing();
    this.startMainTimer();
    this.cycleTruths();
  }

  ngOnDestroy() {
    clearInterval(this.breathTimer);
    clearInterval(this.mainTimer);
    clearInterval(this.truthTimer);
  }

  startBreathing() {
    // 4-7-8 method simplified for visual loop (4s in, 4s hold, 6s out)
    const loop = () => {
      this.bState.set('INHALE');
      this.bText.set('INHALE');
      setTimeout(() => {
        this.bState.set('HOLD');
        this.bText.set('HOLD');
        setTimeout(() => {
          this.bState.set('EXHALE');
          this.bText.set('EXHALE');
        }, 4000); // Hold for 4s
      }, 4000); // Inhale for 4s
    };
    loop();
    this.breathTimer = setInterval(loop, 14000); // 4 + 4 + 6 = 14s loop
  }

  startMainTimer() {
    this.mainTimer = setInterval(() => {
      if (this.timeLeft() > 0) {
        this.timeLeft.set(this.timeLeft() - 1);
      } else {
        clearInterval(this.mainTimer);
      }
    }, 1000);
  }

  cycleTruths() {
    if (this.data.insights && this.data.insights.length > 0) {
      const pickRandom = () => {
        const idx = Math.floor(Math.random() * this.data.insights.length);
        this.currentTruth.set(this.data.insights[idx]);
      };
      pickRandom();
      this.truthTimer = setInterval(pickRandom, 10000); // Rotate every 10s
    }
  }

  formatTime(s: number): string {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  survive() {
    this.dialogRef.close(true); // Survived
  }

  fail() {
    this.dialogRef.close(false); // Did not survive / aborted
  }
}
