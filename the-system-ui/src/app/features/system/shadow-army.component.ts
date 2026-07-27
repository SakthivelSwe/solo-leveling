import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Shadow } from '../../core/models/models';
import { environment } from '../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';

@Component({
  selector: 'app-shadow-army',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="shadow-army-container system-card">
      <header class="sa-header">
        <h2 class="mono">◈ SHADOW ARMY</h2>
        <p class="tech">Extracted from mastered habits. They fight for you now.</p>
        
        <button class="btn primary extract-btn" (click)="extractDiscipline()" [disabled]="extracting()">
          {{ extracting() ? 'EXTRACTING...' : 'ARISE: DISCIPLINE SHADOW' }}
        </button>
      </header>

      <div class="shadow-grid" [@listStagger]="shadows().length">
        <div class="shadow-card" *ngFor="let s of shadows()">
          <div class="shadow-avatar"></div>
          <div class="shadow-info">
            <h3 class="mono">{{ s.shadowName }}</h3>
            <span class="shadow-type mono">{{ s.shadowType }}</span>
            <div class="shadow-stats tech">
              <span>LVL {{ s.shadowLevel }}</span>
              <span>PWR {{ s.powerLevel }}</span>
            </div>
          </div>
        </div>
        
        <div class="empty-state tech" *ngIf="shadows().length === 0 && !loading()">
          NO SHADOWS EXTRACTED. MASTER A HABIT (25+ DAYS) TO AWAKEN ONE.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shadow-army-container { background: rgba(0,0,0,0.4); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
    .sa-header { text-align: center; margin-bottom: 30px; }
    .sa-header h2 { color: var(--accent-gold); font-size: 1.5rem; letter-spacing: 4px; margin: 0 0 10px; text-shadow: 0 0 10px rgba(250,199,117,0.3); }
    .sa-header p { color: var(--text-secondary); margin-bottom: 20px; font-size: 0.85rem; }
    
    .extract-btn {
      background: linear-gradient(90deg, #1a1a2e 0%, #3a0ca3 100%);
      color: #fff; border: 1px solid #7209b7; padding: 12px 24px; font-size: 0.9rem; letter-spacing: 2px;
      box-shadow: 0 0 15px rgba(114,9,183,0.4); transition: all 0.3s ease;
    }
    .extract-btn:hover:not([disabled]) {
      box-shadow: 0 0 25px rgba(114,9,183,0.8); transform: translateY(-2px);
      text-shadow: 0 0 8px #fff;
    }

    .shadow-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
    .shadow-card {
      background: linear-gradient(180deg, rgba(20,20,35,0.9) 0%, rgba(10,10,20,0.95) 100%);
      border: 1px solid rgba(114,9,183,0.3); border-radius: 12px; padding: 16px;
      position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      transition: all 0.3s ease;
      cursor: pointer;
    }
    .shadow-card:hover {
      border-color: rgba(114,9,183,0.8); box-shadow: 0 0 20px rgba(114,9,183,0.4);
      transform: translateY(-5px);
    }
    .shadow-card::before {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
      background: linear-gradient(0deg, rgba(114,9,183,0.15) 0%, transparent 100%);
      pointer-events: none;
    }
    
    .shadow-avatar {
      width: 60px; height: 60px; margin: 0 auto 16px; border-radius: 50%;
      background: radial-gradient(circle, #3a0ca3 0%, #000 70%);
      box-shadow: 0 0 15px rgba(114,9,183,0.6);
      animation: breathe 3s infinite alternate ease-in-out;
    }
    @keyframes breathe {
      0% { transform: scale(0.95); box-shadow: 0 0 10px rgba(114,9,183,0.4); }
      100% { transform: scale(1.05); box-shadow: 0 0 25px rgba(114,9,183,0.8); }
    }

    .shadow-info { text-align: center; }
    .shadow-info h3 { color: #fff; font-size: 1rem; margin: 0 0 4px; letter-spacing: 2px; }
    .shadow-type { display: block; color: var(--accent-teal); font-size: 0.65rem; margin-bottom: 12px; }
    .shadow-stats { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--accent-gold); border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; }
    
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary); opacity: 0.7; }
  `],
  animations: [
    trigger('listStagger', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger('100ms', animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' })))
        ], { optional: true })
      ])
    ])
  ]
})
export class ShadowArmyComponent implements OnInit {
  shadows = signal<Shadow[]>([]);
  loading = signal(true);
  extracting = signal(false);
  private api = environment.apiUrl;

  constructor(private http: HttpClient, private snack: MatSnackBar) {}

  ngOnInit() {
    this.loadShadows();
  }

  loadShadows() {
    this.http.get<Shadow[]>(`${this.api}/shadows`).subscribe({
      next: (res) => { this.shadows.set(res); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  extractDiscipline() {
    this.extracting.set(true);
    this.http.post<Shadow>(`${this.api}/shadows/extract-discipline`, {}).subscribe({
      next: (s) => {
        this.shadows.update(arr => [s, ...arr]);
        this.snack.open('ARISE... Discipline Shadow extracted!', 'OK', { duration: 4000 });
        this.extracting.set(false);
      },
      error: (err) => {
        this.snack.open(err.error?.message || 'Extraction failed or already active.', 'OK', { duration: 3000 });
        this.extracting.set(false);
      }
    });
  }
}
