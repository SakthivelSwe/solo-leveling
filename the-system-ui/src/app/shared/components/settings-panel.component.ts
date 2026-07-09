import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { slideInRight } from '../../shared/animations';

interface QuestItem {
  id?: number;
  questKey: string;
  label: string;
  category: string;
  xpReward: number;
  statBoosts: string | null;
  active: boolean;
}

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [slideInRight],
  template: `
<div class="overlay" (click)="close.emit()" @slideInRight>
  <div class="panel system-card" (click)="$event.stopPropagation()">
    <div class="panel-head">
      <h2 class="mono">⚙ SYSTEM SETTINGS</h2>
      <button class="cls mono" (click)="close.emit()">✕</button>
    </div>

    <!-- Quest Manager -->
    <section class="section">
      <h3 class="mono sh">◈ QUEST MANAGER</h3>
      <p class="tech hint">Add your own quests. Remove what doesn't fit your life. The System adapts.</p>

      <!-- Add new quest -->
      <div class="add-form">
        <input class="fin" placeholder="Quest label e.g. [DAILY] Meditate 10 min" [(ngModel)]="newQuest.label" />
        <div class="row2">
          <select class="fin" [(ngModel)]="newQuest.category">
            <option value="DAILY">DAILY</option>
            <option value="SKILL">SKILL</option>
            <option value="TESTOSTERONE">TESTOSTERONE</option>
            <option value="SIDE">SIDE</option>
          </select>
          <input class="fin sm" type="number" placeholder="XP" [(ngModel)]="newQuest.xpReward" min="10" max="500" />
          <input class="fin sm" placeholder="Stat boosts e.g. STR:3,VIT:2" [(ngModel)]="boostsRaw" />
          <button class="btn-add mono" (click)="addQuest()">+ ADD</button>
        </div>
        <div class="err tech" *ngIf="addErr()">{{ addErr() }}</div>
      </div>

      <!-- Quest list -->
      <div class="quest-rows">
        <div *ngFor="let q of quests()" class="qrow" [class.inactive]="!q.active">
          <div class="qinfo">
            <span class="qcat mono" [attr.data-cat]="q.category">{{ q.category }}</span>
            <span class="qlabel tech">{{ q.label }}</span>
          </div>
          <div class="qactions">
            <span class="xp mono">+{{ q.xpReward }} XP</span>
            <button class="tog tech" (click)="toggleQuest(q)">{{ q.active ? 'DEACTIVATE' : 'ACTIVATE' }}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Motivation Level -->
    <section class="section">
      <h3 class="mono sh">◈ SYSTEM PRESSURE LEVEL</h3>
      <p class="tech hint">How harsh should THE SYSTEM be with you?</p>
      <div class="pressure-row">
        <button *ngFor="let p of pressures" class="prs tech"
                [class.active]="pressureLevel() === p.key"
                [attr.data-p]="p.key"
                (click)="setPressure(p.key)">
          {{ p.label }}
        </button>
      </div>
      <p class="pressure-desc tech">{{ currentPressureDesc() }}</p>
    </section>

    <!-- Accountability -->
    <section class="section">
      <h3 class="mono sh">◈ ACCOUNTABILITY</h3>
      <label class="chk tech"><input type="checkbox" [(ngModel)]="settings.noSkipMode" (change)="saveSettings()" />
        NO-SKIP MODE — Quest skips are flagged and shown in the dashboard</label>
      <label class="chk tech"><input type="checkbox" [(ngModel)]="settings.hpWarnings" (change)="saveSettings()" />
        HP WARNINGS — Show brutal warning when HP drops below 40</label>
      <label class="chk tech"><input type="checkbox" [(ngModel)]="settings.dailyReminder" (change)="saveSettings()" />
        EVENING DIRECTIVE — Show "You haven't done X yet" reminder after 9 PM</label>
    </section>

    <button class="btn-close mono" (click)="close.emit()">◈ CLOSE SETTINGS</button>
  </div>
</div>
  `,
  styles: [`
:host { display: block; }
.overlay {
  position: fixed; inset: 0; z-index: 999; background: rgba(3,3,10,0.75);
  backdrop-filter: blur(5px); display: flex; justify-content: flex-end;
}
.panel {
  width: min(94vw, 520px); height: 100vh; overflow-y: auto;
  padding: 28px 24px 48px; border-radius: 0; border-right: none;
  border-top: none; border-bottom: none; border-left: 2px solid var(--accent-purple);
}
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.panel-head h2 { margin: 0; font-size: .9rem; letter-spacing: 4px; }
.cls { background: none; border: 1px solid var(--border); border-radius: 6px; color: var(--text-secondary); cursor: pointer; padding: 4px 10px; font-size: .8rem; }
.cls:hover { color: var(--accent-red); border-color: var(--accent-red); }

.section { margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
.sh { margin: 0 0 6px; font-size: .78rem; letter-spacing: 3px; color: var(--accent-gold); }
.hint { margin: 0 0 14px; font-size: .72rem; color: var(--text-secondary); letter-spacing: .5px; }

.add-form { margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px; }
.row2 { display: flex; gap: 8px; flex-wrap: wrap; }
.fin { background: rgba(6,6,16,0.9); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); padding: 9px 12px; font-family: inherit; font-size: .8rem; flex: 1; min-width: 100px; }
.fin.sm { max-width: 100px; flex: 0 0 auto; }
.fin:focus { outline: none; border-color: var(--accent-purple); }
.btn-add { cursor: pointer; border: 1px solid var(--accent-teal); border-radius: 8px; background: rgba(29,158,117,0.15); color: #5dcaa5; padding: 9px 14px; font-size: .72rem; letter-spacing: 2px; font-family: inherit; white-space: nowrap; }
.btn-add:hover { background: rgba(29,158,117,0.28); }
.err { color: #f09595; font-size: .68rem; letter-spacing: 1px; }

.quest-rows { display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; }
.qrow { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; }
.qrow.inactive { opacity: .4; }
.qinfo { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.qcat { font-size: .54rem; letter-spacing: 1px; padding: 2px 7px; border-radius: 5px; background: rgba(83,74,183,0.2); color: #b3aef0; white-space: nowrap; }
.qcat[data-cat="DAILY"] { background: rgba(29,158,117,0.2); color: #5dcaa5; }
.qcat[data-cat="TESTOSTERONE"] { background: rgba(226,75,74,0.2); color: #f09595; }
.qcat[data-cat="SIDE"] { background: rgba(250,199,117,0.2); color: #fac775; }
.qlabel { font-size: .74rem; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qactions { display: flex; align-items: center; gap: 8px; }
.xp { font-size: .64rem; color: var(--accent-gold); }
.tog { cursor: pointer; background: none; border: 1px solid var(--border); border-radius: 6px; color: var(--text-secondary); padding: 4px 8px; font-size: .6rem; letter-spacing: 1px; }
.tog:hover { border-color: var(--accent-purple); color: var(--text-primary); }

.pressure-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.prs { cursor: pointer; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border); background: none; color: var(--text-secondary); font-size: .68rem; letter-spacing: 1.5px; transition: all .2s; }
.prs:hover { color: var(--text-primary); }
.prs.active[data-p="MILD"] { border-color: var(--accent-teal); color: #5dcaa5; background: rgba(29,158,117,0.12); }
.prs.active[data-p="STANDARD"] { border-color: var(--accent-purple); color: #b3aef0; background: rgba(83,74,183,0.12); }
.prs.active[data-p="BRUTAL"] { border-color: var(--accent-red); color: #f09595; background: rgba(226,75,74,0.12); }
.pressure-desc { font-size: .7rem; color: var(--text-secondary); letter-spacing: .5px; margin: 0; min-height: 40px; }

.chk { display: flex; align-items: flex-start; gap: 10px; font-size: .74rem; margin-bottom: 10px; cursor: pointer; line-height: 1.5; }
.chk input { margin-top: 2px; accent-color: var(--accent-purple); }

.btn-close { width: 100%; margin-top: 12px; padding: 14px; border: 1px solid var(--accent-purple); border-radius: 10px; background: rgba(83,74,183,0.18); color: #b3aef0; font-size: .8rem; letter-spacing: 3px; cursor: pointer; }
.btn-close:hover { background: rgba(83,74,183,0.30); }
  `],
})
export class SettingsPanelComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  quests = signal<QuestItem[]>([]);
  pressureLevel = signal<string>(localStorage.getItem('sys_pressure') ?? 'STANDARD');
  addErr = signal<string | null>(null);

  newQuest: Partial<QuestItem> = { category: 'DAILY', xpReward: 60 };
  boostsRaw = '';

  settings = {
    noSkipMode: localStorage.getItem('sys_noskip') === '1',
    hpWarnings: localStorage.getItem('sys_hpwarn') !== '0',
    dailyReminder: localStorage.getItem('sys_reminder') === '1',
  };

  readonly pressures = [
    { key: 'MILD', label: 'MILD', desc: '"You are doing well. Keep it up." — Gentle. Good for beginners.' },
    { key: 'STANDARD', label: 'STANDARD', desc: '"Hunter, your stats are weak in this area. Improve today." — Balanced.' },
    { key: 'BRUTAL', label: 'BRUTAL', desc: '"You skipped AGAIN. Sung Jin-Woo would have finished his dungeon by now. No excuses." — Merciless. For maximum accountability.' },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const token = localStorage.getItem('system_access_token');
    if (!token) return;
    this.http.get<any[]>(`${environment.apiUrl}/quests/today`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe(list => this.quests.set(list as QuestItem[]));
  }

  addQuest(): void {
    if (!this.newQuest.label?.trim()) { this.addErr.set('QUEST LABEL REQUIRED.'); return; }
    const token = localStorage.getItem('system_access_token');
    if (!token) return;
    const key = this.newQuest.label!.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase().slice(0, 30);
    const boosts = this.boostsRaw.trim() ? this.parseBoosts(this.boostsRaw) : null;
    const body = { questKey: key, label: this.newQuest.label, category: this.newQuest.category, xpReward: this.newQuest.xpReward, statBoosts: boosts, active: true };
    this.http.post<QuestItem>(`${environment.apiUrl}/quests/custom`, body, { headers: { Authorization: `Bearer ${token}` }})
      .subscribe({ next: q => { this.quests.update(list => [q, ...list]); this.newQuest = { category: 'DAILY', xpReward: 60 }; this.boostsRaw = ''; this.addErr.set(null); },
        error: () => this.addErr.set('Failed to save quest.') });
  }

  toggleQuest(q: QuestItem): void {
    const token = localStorage.getItem('system_access_token');
    if (!token || !q.id) return;
    this.http.patch<QuestItem>(`${environment.apiUrl}/quests/${q.id}/toggle`, {}, { headers: { Authorization: `Bearer ${token}` }})
      .subscribe(updated => this.quests.update(list => list.map(x => x.id === updated.id ? updated : x)));
  }

  setPressure(key: string): void {
    this.pressureLevel.set(key);
    localStorage.setItem('sys_pressure', key);
  }

  currentPressureDesc(): string {
    return this.pressures.find(p => p.key === this.pressureLevel())?.desc ?? '';
  }

  saveSettings(): void {
    localStorage.setItem('sys_noskip', this.settings.noSkipMode ? '1' : '0');
    localStorage.setItem('sys_hpwarn', this.settings.hpWarnings ? '1' : '0');
    localStorage.setItem('sys_reminder', this.settings.dailyReminder ? '1' : '0');
  }

  private parseBoosts(raw: string): string {
    const obj: Record<string, number> = {};
    raw.split(',').forEach(part => {
      const [k, v] = part.split(':');
      if (k && v) obj[k.trim().toUpperCase()] = Number(v.trim());
    });
    return JSON.stringify(obj);
  }
}

