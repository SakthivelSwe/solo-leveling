import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LifeOsService } from '../../core/services/life-os.service';
import { DopamineLog } from '../../core/models/models';

@Component({
  selector: 'app-dopamine-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dopamine-tracker.component.html',
  styleUrls: ['./dopamine-tracker.component.scss']
})
export class DopamineTrackerComponent implements OnInit {
  
  // Today's form data
  socialMediaMin = signal(0);
  reelsMin = signal(0);
  gamingMin = signal(0);
  junkFoodItems = signal(0);
  pornViewed = signal(false);
  exerciseDone = signal(false);
  coldShower = signal(false);
  
  // Stats & Status
  isSaving = signal(false);
  saveSuccess = signal(false);
  todayLog = signal<DopamineLog | null>(null);
  history = signal<DopamineLog[]>([]);

  // Local calculation to preview changes before saving
  projectedScore = computed(() => {
    let score = 0;
    score += Math.floor(this.socialMediaMin() / 30) * 8;
    score += Math.floor(this.reelsMin() / 30) * 15;
    if (this.gamingMin() > 60) score += 12;
    score += this.junkFoodItems() * 5;
    if (this.pornViewed()) score += 20;
    if (this.exerciseDone()) score -= 20;
    if (this.coldShower()) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  });

  projectedMultiplier = computed(() => {
    const s = this.projectedScore();
    if (s <= 30) return 1.0;
    if (s <= 60) return 0.85;
    if (s <= 80) return 0.70;
    return 0.55;
  });

  constructor(private api: LifeOsService) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.api.getDopamineHistory(14).subscribe((res: DopamineLog[]) => {
      this.history.set(res.reverse()); // Ensure chronological order for chart
      
      // Try to find today's log in history
      const todayStr = new Date().toISOString().split('T')[0];
      const today = res.find((r: DopamineLog) => r.logDate === todayStr);
      
      if (today) {
        this.todayLog.set(today);
        this.socialMediaMin.set(today.socialMediaMin);
        this.reelsMin.set(today.reelsMin);
        this.gamingMin.set(today.gamingMin);
        this.junkFoodItems.set(today.junkFoodItems);
        this.pornViewed.set(today.pornViewed);
        this.exerciseDone.set(today.exerciseDone);
        this.coldShower.set(today.coldShower);
      }
    });
  }

  saveLog() {
    this.isSaving.set(true);
    const payload: DopamineLog = {
      logDate: new Date().toISOString().split('T')[0],
      socialMediaMin: this.socialMediaMin(),
      reelsMin: this.reelsMin(),
      gamingMin: this.gamingMin(),
      junkFoodItems: this.junkFoodItems(),
      pornViewed: this.pornViewed(),
      exerciseDone: this.exerciseDone(),
      coldShower: this.coldShower(),
      dopamineScore: 0,
      focusPct: 0
    };

    this.api.logDopamine(payload).subscribe({
      next: (res: DopamineLog) => {
        this.todayLog.set(res);
        this.isSaving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
        this.loadHistory();
      },
      error: () => this.isSaving.set(false)
    });
  }

  adjust(sig: any, amount: number, max: number = 999) {
    const current = sig();
    const next = Math.max(0, Math.min(max, current + amount));
    sig.set(next);
  }
}
