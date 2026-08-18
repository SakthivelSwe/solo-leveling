import { Component, OnInit, OnDestroy, signal, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SseService } from '../../../core/services/sse.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { fadeInUp, listStagger } from '../../../shared/animations';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

interface BossChallenge {
  title: string;
  description: string;
  initialCode: string;
}

@Component({
  selector: 'app-boss-battle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [fadeInUp, listStagger],
  templateUrl: './boss-battle.component.html',
  styleUrls: ['./boss-battle.component.scss']
})
export class BossBattleComponent implements OnInit, OnDestroy {
  challenge: BossChallenge = {
    title: 'The Gatekeeper of Igris',
    description: 'Write a Java method `public int[] twoSum(int[] nums, int target)` that returns the indices of the two numbers such that they add up to target. The shadow army approaches. If your code is unoptimized (O(n^2)), Igris will deal 50 damage.',
    initialCode: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Defeat the boss\n        return new int[]{};\n    }\n}'
  };

  code = this.challenge.initialCode;

  aiFeedback = signal<string[]>([]);
  isEvaluating = signal<boolean>(false);
  bossHp = signal<number>(100);
  playerHp = signal<number>(100);

  private codeSubject = new Subject<string>();

  constructor(private http: HttpClient) {
    this.codeSubject.pipe(debounceTime(2000)).subscribe(currentCode => {
      this.evaluateLiveCode(currentCode);
    });
  }

  ngOnInit(): void {
    // We could listen for live SSE from the mentor during the battle
    window.addEventListener('agentLog', this.agentLogHandler);
  }

  /** Stored so the listener can be removed on destroy (previously it leaked). */
  private agentLogHandler = (e: any) => {
    if (e.detail?.type === 'BOSS_BATTLE') {
      this.aiFeedback.update(f => [...f, e.detail.message]);
    }
  };

  ngOnDestroy(): void {
    window.removeEventListener('agentLog', this.agentLogHandler);
    this.codeSubject.complete();
  }

  onCodeChange(newCode: string): void {
    this.code = newCode;
    this.codeSubject.next(this.code);
  }

  evaluateLiveCode(currentCode: string): void {
    if (this.bossHp() <= 0) return; // Boss dead
    // We send a lightweight ping to the AI Mentor to check for syntax or algorithmic blunders
    this.http.post<{feedback: string, damageToPlayer: number, damageToBoss: number}>(`${environment.apiUrl}/quests/boss-battle/evaluate`, { code: currentCode })
      .subscribe({
        next: (res) => {
          if (res.feedback) {
            this.aiFeedback.update(f => [...f, res.feedback]);
          }
          if (res.damageToPlayer > 0) {
            this.playerHp.update(hp => Math.max(0, hp - res.damageToPlayer));
          }
          if (res.damageToBoss > 0) {
            this.bossHp.update(hp => Math.max(0, hp - res.damageToBoss));
            if (this.bossHp() <= 0) {
              this.aiFeedback.update(f => [...f, '◈ IGRIS DEFEATED. YOU HAVE LEVELED UP.']);
            }
          }
        },
        error: () => {}
      });
  }

  submitFinal(): void {
    this.isEvaluating.set(true);
    this.evaluateLiveCode(this.code);
    setTimeout(() => this.isEvaluating.set(false), 2000);
  }
}
