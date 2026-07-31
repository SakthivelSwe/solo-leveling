import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar-evolution',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar-container glass-panel">
      <div class="avatar-header">
        <h3 class="mono head" style="color: #1D9E75;">? EVOLUTION STATE</h3>
        <span class="tech stage-badge" [style.color]="stageColor()">STAGE: {{ evolutionStage() }}</span>
      </div>
      
      <div class="avatar-display">
        <!-- Dynamic CSS Silhouette based on stats -->
        <div class="silhouette-wrap">
          <div class="silhouette" 
               [class.stage-e]="evolutionStage() === 'E-RANK'"
               [class.stage-d]="evolutionStage() === 'D-RANK'"
               [class.stage-c]="evolutionStage() === 'C-RANK'"
               [class.stage-b]="evolutionStage() === 'B-RANK'"
               [class.stage-a]="evolutionStage() === 'A-RANK'"
               [class.stage-s]="evolutionStage() === 'S-RANK'">
               <div class="aura" [style.background]="auraColor()"></div>
               <div class="body-shape" [style.transform]="bodyScale()"></div>
          </div>
        </div>
      </div>
      
      <div class="stats-row">
        <div class="stat-pip tech"><span style="color:#8a8a9a">BF%</span> <span class="mono">{{ bodyFat || '?' }}%</span></div>
        <div class="stat-pip tech"><span style="color:#8a8a9a">WT</span> <span class="mono">{{ weight || '?' }}KG</span></div>
      </div>
    </div>
  `,
  styles: [`
    .avatar-container {
      border-color: rgba(29, 158, 117, 0.4);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .avatar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .stage-badge {
      font-weight: 700;
      letter-spacing: 1px;
      font-size: 0.85rem;
      text-shadow: 0 0 10px currentColor;
    }
    .avatar-display {
      height: 250px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: radial-gradient(circle at center, rgba(29,158,117,0.1) 0%, rgba(0,0,0,0) 70%);
      border-radius: 12px;
      position: relative;
      overflow: hidden;
    }
    .silhouette-wrap {
      position: relative;
      width: 120px;
      height: 200px;
      display: flex;
      justify-content: center;
      align-items: flex-end;
    }
    .aura {
      position: absolute;
      width: 100%;
      height: 100%;
      bottom: 0;
      border-radius: 50% 50% 10% 10%;
      filter: blur(20px);
      opacity: 0.5;
      transition: all 1s ease;
      z-index: 1;
    }
    .body-shape {
      position: absolute;
      width: 60px;
      height: 160px;
      background: #000;
      border-radius: 30px 30px 10px 10px;
      box-shadow: inset 0 0 15px rgba(255,255,255,0.2), 0 0 10px rgba(0,0,0,0.8);
      z-index: 2;
      transition: transform 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .stats-row {
      display: flex;
      justify-content: space-around;
      background: rgba(0,0,0,0.3);
      padding: 12px;
      border-radius: 8px;
    }
    .stat-pip {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 0.8rem;
    }
    .stat-pip .mono {
      font-size: 1.1rem;
      color: #fff;
    }
    /* Stages */
    .stage-e .body-shape { background: #2a2a2a; }
    .stage-d .body-shape { background: #3a3a3a; box-shadow: inset 0 0 15px rgba(79, 195, 247, 0.2); }
    .stage-s .body-shape { background: #111; box-shadow: inset 0 0 20px #BA7517, 0 0 20px #BA7517; }
  `]
})
export class AvatarEvolutionComponent {
  @Input() weight: number = 0;
  @Input() bodyFat: number = 0;

  evolutionStage = computed(() => {
    const bf = this.bodyFat;
    if (!bf) return 'E-RANK';
    if (bf > 25) return 'E-RANK';
    if (bf > 20) return 'D-RANK';
    if (bf > 15) return 'C-RANK';
    if (bf > 12) return 'B-RANK';
    if (bf > 8) return 'A-RANK';
    return 'S-RANK';
  });

  auraColor = computed(() => {
    switch (this.evolutionStage()) {
      case 'E-RANK': return 'rgba(138, 138, 154, 0.2)';
      case 'D-RANK': return 'rgba(55, 138, 221, 0.3)';
      case 'C-RANK': return 'rgba(29, 158, 117, 0.4)';
      case 'B-RANK': return 'rgba(108, 99, 255, 0.5)';
      case 'A-RANK': return 'rgba(226, 75, 74, 0.6)';
      case 'S-RANK': return 'rgba(250, 199, 117, 0.8)';
      default: return 'transparent';
    }
  });

  stageColor = computed(() => {
    switch (this.evolutionStage()) {
      case 'E-RANK': return '#8a8a9a';
      case 'D-RANK': return '#378ADD';
      case 'C-RANK': return '#1D9E75';
      case 'B-RANK': return '#6C63FF';
      case 'A-RANK': return '#E24B4A';
      case 'S-RANK': return '#FAC775';
      default: return '#fff';
    }
  });

  bodyScale = computed(() => {
    const bf = this.bodyFat || 25;
    // Higher BF = wider, lower BF = more V-tapered (this is a simplified CSS representation)
    const scaleX = 1 + (bf / 100);
    return `scaleX(${scaleX})`;
  });
}
