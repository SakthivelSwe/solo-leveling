import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-modal glass-panel" *ngIf="isOpen()">
      <div class="modal-header">
        <h2 class="mono head">SYSTEM CONFIGURATION</h2>
        <button class="icon-btn" (click)="close()">?</button>
      </div>

      <div class="modal-body">
        
        <div class="config-section">
          <h3 class="mono sub">UI THEME</h3>
          <div class="theme-grid">
            <button class="theme-btn" [class.active]="theme() === 'default'" (click)="setTheme('default')">
              <span class="color-dot" style="background: #378ADD;"></span> SYSTEM BLUE
            </button>
            <button class="theme-btn" [class.active]="theme() === 'monarch'" (click)="setTheme('monarch')">
              <span class="color-dot" style="background: #8A2BE2;"></span> MONARCH PURPLE
            </button>
            <button class="theme-btn" [class.active]="theme() === 'blood'" (click)="setTheme('blood')">
              <span class="color-dot" style="background: #E24B4A;"></span> BLOOD RED
            </button>
          </div>
        </div>

        <div class="config-section">
          <h3 class="mono sub">AI VOICE PERSONA</h3>
          <select class="sys-select tech" [ngModel]="aiPersona()" (ngModelChange)="setPersona($event)">
            <option value="DRILL_SERGEANT">DRILL SERGEANT (Harsh, Direct)</option>
            <option value="ANALYST">ANALYST (Cold, Logical)</option>
            <option value="MENTOR">MENTOR (Encouraging, Wise)</option>
          </select>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .settings-modal {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 400px; max-width: 90vw; z-index: 1000;
      background: rgba(10,10,20,0.95); border: 1px solid rgba(255,255,255,0.1);
      padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.8);
      border-radius: 12px;
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; }
    .head { font-size: 1.2rem; color: #fff; margin: 0; }
    .icon-btn { background: none; border: none; color: #8a8a9a; cursor: pointer; font-size: 1.2rem; }
    .icon-btn:hover { color: #fff; }

    .config-section { margin-bottom: 24px; }
    .sub { font-size: 0.9rem; color: #8a8a9a; margin-bottom: 12px; }

    .theme-grid { display: flex; flex-direction: column; gap: 8px; }
    .theme-btn {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
      color: #fff; padding: 12px; border-radius: 6px; cursor: pointer;
      display: flex; align-items: center; gap: 12px; transition: all 0.2s; font-family: 'Inter', sans-serif;
    }
    .theme-btn:hover { background: rgba(255,255,255,0.08); }
    .theme-btn.active { border-color: var(--accent-gold); box-shadow: 0 0 10px rgba(250,199,117,0.2); }
    .color-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }

    .sys-select {
      width: 100%; padding: 12px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);
      color: #fff; border-radius: 6px; font-size: 0.9rem;
    }
  `]
})
export class SettingsComponent implements OnInit {
  isOpen = signal(false);
  theme = signal('default');
  aiPersona = signal('DRILL_SERGEANT');

  ngOnInit() {
    const savedTheme = localStorage.getItem('system_theme') || 'default';
    this.theme.set(savedTheme);
    this.applyTheme(savedTheme);

    const savedPersona = localStorage.getItem('system_persona') || 'DRILL_SERGEANT';
    this.aiPersona.set(savedPersona);
  }

  open() { this.isOpen.set(true); }
  close() { this.isOpen.set(false); }

  setTheme(t: string) {
    this.theme.set(t);
    localStorage.setItem('system_theme', t);
    this.applyTheme(t);
  }

  setPersona(p: string) {
    this.aiPersona.set(p);
    localStorage.setItem('system_persona', p);
  }

  private applyTheme(t: string) {
    const root = document.documentElement;
    if (t === 'monarch') {
      root.style.setProperty('--accent-blue', '#8A2BE2');
      root.style.setProperty('--accent-teal', '#6A0DAD');
    } else if (t === 'blood') {
      root.style.setProperty('--accent-blue', '#E24B4A');
      root.style.setProperty('--accent-teal', '#8B0000');
    } else {
      root.style.setProperty('--accent-blue', '#378ADD');
      root.style.setProperty('--accent-teal', '#5DCAA5');
    }
  }
}
