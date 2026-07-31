import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';
import { StatusWindow } from '../../core/models/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="system-shell profile-bg">
      <div class="particle-bg"></div>

      <!-- Topbar -->
      <header class="topbar">
        <div class="brand">
          <span class="mono diamond">?</span>
          <span class="mono name">TROPHY ROOM</span>
          <span class="tech tag">PROFILE</span>
        </div>
        <nav class="nav tech">
          <a routerLink="/system">STATUS</a>
          <a routerLink="/profile" class="active">TROPHY ROOM</a>
        </nav>
      </header>

      <div class="content-wrapper" *ngIf="status() as s">
        
        <!-- Player Identity Card -->
        <div class="identity-card glass-panel">
          <div class="id-header">
            <div class="avatar-ring">
              <div class="avatar-inner">
                <span style="font-size: 3rem;">{{ getArchetypeIcon(s.player.archetype || 'NONE') }}</span>
              </div>
            </div>
            <div class="id-info">
              <h2 class="mono head player-name">{{ s.player.displayName }}</h2>
              <div class="class-badge tech">ARCHETYPE: {{ s.player.archetype || 'UNAWAKENED' }}</div>
              <div class="title-badge tech">TITLE: {{ s.player.equippedTitle || 'NONE' }}</div>
            </div>
          </div>
        </div>

        <!-- Trophy Shelf -->
        <div class="trophy-shelf">
          <h3 class="mono head" style="color: #FAC775; text-shadow: 0 0 15px rgba(250,199,117,0.5);">? THE VAULT OF VICTORIES</h3>
          
          <div class="shelf-grid">
            
            <div class="trophy-slot" *ngFor="let t of getTrophies()">
              <div class="trophy" [class.unlocked]="t.unlocked" [style.boxShadow]="t.unlocked ? '0 0 20px ' + t.color : 'none'">
                <div class="trophy-icon" [style.color]="t.unlocked ? t.color : '#333'">{{ t.icon }}</div>
                <div class="trophy-glow" *ngIf="t.unlocked" [style.background]="t.color"></div>
              </div>
              <div class="trophy-name tech">{{ t.name }}</div>
              <div class="trophy-desc tech">{{ t.unlocked ? t.desc : '???' }}</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-bg {
      background: radial-gradient(circle at top right, rgba(108, 99, 255, 0.1) 0%, rgba(10,10,20,1) 60%);
      min-height: 100vh;
    }
    .content-wrapper {
      max-width: 1000px;
      margin: 40px auto;
      padding: 0 20px;
      display: flex;
      flex-direction: column;
      gap: 40px;
    }
    
    .identity-card {
      border-color: rgba(108, 99, 255, 0.4);
      background: rgba(108, 99, 255, 0.05);
      padding: 40px;
      position: relative;
      overflow: hidden;
    }
    .identity-card::before {
      content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
      background: linear-gradient(45deg, transparent, rgba(108,99,255,0.1), transparent);
      transform: rotate(45deg); animation: shine 6s linear infinite;
    }
    @keyframes shine { 0% { transform: translateX(-100%) rotate(45deg); } 100% { transform: translateX(100%) rotate(45deg); } }
    
    .id-header {
      display: flex;
      align-items: center;
      gap: 30px;
    }
    .avatar-ring {
      width: 120px; height: 120px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6C63FF, #FAC775);
      padding: 4px;
      box-shadow: 0 0 20px rgba(108, 99, 255, 0.5);
    }
    .avatar-inner {
      width: 100%; height: 100%;
      background: #0a0a14;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .player-name { font-size: 2.5rem; color: #fff; margin-bottom: 8px; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
    .class-badge, .title-badge {
      display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 0.9rem; margin-right: 12px; font-weight: 700;
    }
    .class-badge { background: rgba(108, 99, 255, 0.2); color: #b3aef0; border: 1px solid rgba(108, 99, 255, 0.4); }
    .title-badge { background: rgba(250, 199, 117, 0.2); color: #FAC775; border: 1px solid rgba(250, 199, 117, 0.4); }

    /* Trophy Shelf */
    .trophy-shelf { margin-top: 20px; }
    .shelf-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 30px;
      margin-top: 30px;
      padding: 40px;
      background: rgba(0,0,0,0.4);
      border-radius: 12px;
      border-bottom: 8px solid rgba(255,255,255,0.05); /* The literal shelf */
      box-shadow: inset 0 20px 20px -20px rgba(0,0,0,0.8);
    }
    .trophy-slot { display: flex; flex-direction: column; align-items: center; text-align: center; }
    .trophy {
      width: 100px; height: 100px;
      background: rgba(20,20,30,0.8);
      border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      position: relative;
      margin-bottom: 16px;
      border: 2px solid rgba(255,255,255,0.05);
      transition: all 0.3s;
    }
    .trophy.unlocked {
      background: rgba(40,40,50,0.8);
      border-color: rgba(255,255,255,0.2);
      transform: translateY(-5px);
    }
    .trophy-icon { font-size: 3rem; position: relative; z-index: 2; transition: all 0.3s; }
    .trophy.unlocked:hover .trophy-icon { transform: scale(1.1); }
    .trophy-glow {
      position: absolute; width: 60%; height: 60%;
      border-radius: 50%; filter: blur(25px); opacity: 0.4; z-index: 1;
    }
    .trophy-name { color: #fff; font-weight: 700; margin-bottom: 4px; font-size: 0.95rem; }
    .trophy-desc { color: #8a8a9a; font-size: 0.75rem; line-height: 1.4; }
  `]
})
export class ProfileComponent implements OnInit {
  playerService = inject(PlayerService);
  status = signal<StatusWindow | null>(null);

  ngOnInit() {
    this.status.set(this.playerService.getCachedStatus());
    this.playerService.getStatus().subscribe(s => this.status.set(s));
  }

  getArchetypeIcon(arch: string) {
    if (arch === 'SCHOLAR') return '?????';
    if (arch === 'ATHLETE') return '??';
    if (arch === 'HUSTLER') return '??????';
    if (arch === 'MONK') return '?????';
    return '??';
  }

  getTrophies() {
    const level = this.status()?.player?.level || 1;
    const rank = this.status()?.player?.rankLevel || 'E';
    return [
      { name: 'Awakening', desc: 'Accepted the System.', icon: '???', color: '#5DCAA5', unlocked: true },
      { name: 'Level 10', desc: 'Surpassed the limits of a beginner.', icon: '?', color: '#378ADD', unlocked: level >= 10 },
      { name: 'D-Rank Hunter', desc: 'Promoted to D-Rank.', icon: '???', color: '#6C63FF', unlocked: rank !== 'E' },
      { name: 'Financial Freedom', desc: 'Saved 1,000,000.', icon: '??', color: '#FAC775', unlocked: false },
      { name: 'Iron Will', desc: 'Achieved a 30-day discipline streak.', icon: '??', color: '#E24B4A', unlocked: false },
    ];
  }
}
