import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../../environments/environment';
import { slideInRight } from '../../shared/animations';
import { PlayerService } from '../../core/services/player.service';
import { AuthService } from '../../core/services/auth.service';
import { LocalNotificationsService } from '../../core/services/local-notifications.service';
import { SystemAlarm } from '../../core/native/system-alarm.plugin';
import { LifeOsService } from '../../core/services/life-os.service';

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
            <option value="DISCIPLINE">DISCIPLINE</option>
            <option value="WEEKLY">WEEKLY</option>
            <option value="MONTHLY">MONTHLY</option>
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

    <!-- Alarm Clock -->
    <section class="section">
      <h3 class="mono sh">◈ ALARM CLOCK</h3>
      <p class="tech hint">Set a repeating alarm that rings and vibrates with your phone's default notification sound — even when the screen is locked.</p>

      <!-- Xiaomi / POCO / Redmi (HyperOS / MIUI) reliability notice -->
      <details class="alarm-help">
        <summary class="tech">⚠ POCO / Xiaomi / Redmi phone? Tap here if the alarm is silent</summary>
        <p class="tech hint">HyperOS/MIUI blocks background alarms by default. The app cannot override this — you must allow it once:</p>
        <ol class="tech hint alarm-help-list">
          <li>Settings → Apps → <b>THE SYSTEM</b> → <b>Autostart</b> → turn ON.</li>
          <li>Settings → Apps → THE SYSTEM → <b>Battery saver</b> → set to <b>No restrictions</b>.</li>
          <li>Settings → Apps → THE SYSTEM → Notifications → <b>⚡ Alarms</b> category → enable <b>Sound</b> + <b>Floating / heads-up</b>.</li>
          <li>Lock the app in <b>Recents</b> (swipe down on the app card → lock icon).</li>
        </ol>
      </details>

      <div class="alarm-form">
        <!-- Time picker -->
        <div class="alarm-time-row">
          <label class="alarm-label-text tech">WAKE TIME</label>
          <input class="alarm-time-input mono" type="time" [(ngModel)]="alarmTime" id="alarm-time-input" />
        </div>

        <!-- Label -->
        <input class="fin alarm-msg-input" type="text" placeholder="Alarm label (e.g. WAKE PROTOCOL)" [(ngModel)]="alarmLabel" maxlength="40" />

        <!-- Ringtone (native full-screen alarm) -->
        <div class="alarm-sound-row" *ngIf="isAndroid">
          <button class="alarm-sound-btn tech" (click)="chooseSound()">🎵 CHOOSE RINGTONE (MP3)</button>
          <div class="alarm-sound-picked" *ngIf="alarmSoundName">
            <span class="tech">◈ {{ alarmSoundName }}</span>
            <button class="alarm-sound-clear tech" (click)="clearSound()" aria-label="Clear ringtone">✕</button>
          </div>
          <p class="tech hint" *ngIf="!alarmSoundName">No file chosen — the default alarm sound will play.</p>
        </div>

        <!-- Days of week -->
        <div class="alarm-days-row">
          <button *ngFor="let d of weekDays; let i = index"
                  class="day-chip tech"
                  [class.active]="alarmDays[i]"
                  (click)="toggleDay(i)"
                  [attr.aria-pressed]="alarmDays[i]">{{ d }}</button>
        </div>

        <!-- Vibrate -->
        <label class="chk tech">
          <input type="checkbox" [(ngModel)]="alarmVibrate" />
          VIBRATE when alarm rings
        </label>

        <!-- Set alarm button -->
        <button class="alarm-set-btn mono" (click)="setAlarm()" id="set-alarm-btn">
          ⚡ SET ALARM
        </button>

        <!-- Cancel alarm button -->
        <button class="alarm-cancel-btn tech" *ngIf="alarmActive" (click)="cancelAlarm()" id="cancel-alarm-btn">
          ✖ CANCEL ALARM
        </button>

        <!-- Status -->
        <p class="alarm-note tech" *ngIf="alarmActive">
          ◈ ALARM ACTIVE — {{ alarmTime }} — rings + vibrates via THE SYSTEM notification
        </p>
        <p class="alarm-note tech" *ngIf="!isAndroid && !alarmActive">
          ◈ On desktop, set alarm will use browser notifications. Install the Android app for full reliability.
        </p>
      </div>
    </section>

    <!-- Focus Timer -->
    <section class="section">
      <h3 class="mono sh">◈ FOCUS TIMER</h3>
      <p class="tech hint">Set a native Android alarm that fires even when the app is closed or your screen is locked. Starting a new timer cancels the previous one.</p>
      <div class="timer-row">
        <button class="timer-btn tech" (click)="setNativeTimer(25)" id="timer-25">25 MIN</button>
        <button class="timer-btn tech" (click)="setNativeTimer(45)" id="timer-45">45 MIN</button>
        <button class="timer-btn tech" (click)="setNativeTimer(90)" id="timer-90">90 MIN</button>
      </div>
    </section>

    <!-- Data Export -->
    <section class="section">
      <h3 class="mono sh">◈ DATA EXPORT</h3>
      <p class="tech hint">Download a full personal backup of every quest, habit, stat and log. Your data, in your hands.</p>
      <div class="export-row">
        <button class="export-btn tech" (click)="exportJson()" [disabled]="exporting()">
          {{ exporting() ? 'EXPORTING…' : '⬇ EXPORT JSON' }}
        </button>
        <button class="export-btn tech" (click)="exportCsv()" [disabled]="exporting()">
          {{ exporting() ? 'EXPORTING…' : '⬇ EXPORT CSV' }}
        </button>
      </div>
      <p class="tech hint" style="margin-top:8px;">JSON is the complete backup. CSV is spreadsheet-friendly (one section per dataset).</p>
    </section>

    <!-- Danger Zone -->
    <section class="section danger-zone">
      <h3 class="mono sh danger">◈ DANGER ZONE</h3>
      <p class="tech hint">Deleting your profile is permanent. Every quest, habit, stat, streak and log is erased. There is no undo.</p>

      <button class="btn-danger mono" *ngIf="!confirmingDelete()" (click)="confirmingDelete.set(true)">
        ⚠ DELETE MY PROFILE
      </button>

      <div class="del-confirm" *ngIf="confirmingDelete()">
        <p class="tech del-note">Type <b>DELETE</b> to confirm. This cannot be reversed.</p>
        <input class="fin" placeholder="DELETE" [(ngModel)]="deleteConfirmText" aria-label="Type DELETE to confirm" />
        <div class="del-actions">
          <button class="btn-danger mono" [disabled]="deleteConfirmText.trim().toUpperCase() !== 'DELETE' || deleting()"
                  (click)="deleteProfile()">
            {{ deleting() ? 'DELETING…' : 'PERMANENTLY DELETE' }}
          </button>
          <button class="btn-ghost tech" [disabled]="deleting()" (click)="cancelDelete()">CANCEL</button>
        </div>
        <div class="err tech" *ngIf="deleteErr()">{{ deleteErr() }}</div>
      </div>
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
.qcat[data-cat="DISCIPLINE"] { background: rgba(226,75,74,0.2); color: #f09595; }
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

.danger-zone { border: 1px solid rgba(226,75,74,0.28); border-radius: 12px; padding: 18px 16px; background: rgba(226,75,74,0.04); }
.sh.danger { color: #f09595; }
.btn-danger { cursor: pointer; width: 100%; padding: 12px; border: 1px solid var(--accent-red); border-radius: 8px; background: rgba(226,75,74,0.12); color: #f09595; font-size: .74rem; letter-spacing: 2px; font-family: inherit; }
.btn-danger:hover:not(:disabled) { background: rgba(226,75,74,0.24); }
.btn-danger:disabled { opacity: .45; cursor: not-allowed; }
.del-confirm { display: flex; flex-direction: column; gap: 10px; }
.del-note { margin: 0; font-size: .74rem; color: var(--text-secondary); }
.del-note b { color: #f09595; letter-spacing: 1px; }
.del-actions { display: flex; gap: 8px; }
.del-actions .btn-danger { flex: 1; }
.btn-ghost { cursor: pointer; background: none; border: 1px solid var(--border); border-radius: 8px; color: var(--text-secondary); padding: 12px 16px; font-size: .68rem; letter-spacing: 1.5px; }
.btn-ghost:hover:not(:disabled) { color: var(--text-primary); border-color: var(--accent-purple); }
.timer-row { display: flex; gap: 10px; }
.timer-btn {
  flex: 1; padding: 12px 8px; border-radius: 10px; cursor: pointer;
  border: 1px solid rgba(250,199,117,0.45); background: rgba(250,199,117,0.06);
  color: var(--accent-gold); font-size: .74rem; letter-spacing: 2px;
  transition: all .2s;
}
.timer-btn:hover { background: rgba(250,199,117,0.16); border-color: var(--accent-gold); box-shadow: 0 0 12px rgba(250,199,117,0.2); }

/* ── Data Export ─────────────────────────────────────────── */
.export-row { display: flex; gap: 10px; }
.export-btn {
  flex: 1; cursor: pointer; padding: 12px 8px; border-radius: 10px;
  border: 1px solid rgba(31,190,142,0.45); background: rgba(31,190,142,0.06);
  color: #5dcaa5; font-size: .72rem; letter-spacing: 2px; transition: all .2s;
}
.export-btn:hover:not(:disabled) { background: rgba(31,190,142,0.16); border-color: var(--accent-teal); }
.export-btn:disabled { opacity: .5; cursor: not-allowed; }

/* ── Alarm Clock ─────────────────────────────────────────── */
.alarm-form { display: flex; flex-direction: column; gap: 12px; }
.alarm-help { margin: 6px 0 12px; border: 1px solid rgba(250,199,117,0.22); border-radius: 10px; background: rgba(250,199,117,0.04); padding: 8px 12px; }
.alarm-help > summary { cursor: pointer; font-size: .72rem; letter-spacing: 1px; color: var(--accent-gold); list-style: none; }
.alarm-help > summary::-webkit-details-marker { display: none; }
.alarm-help-list { margin: 8px 0 2px; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; }
.alarm-help-list li { line-height: 1.4; }
.alarm-time-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border-radius: 10px;
  border: 1px solid rgba(250,199,117,0.3); background: rgba(250,199,117,0.04);
}
.alarm-label-text { font-size: .7rem; letter-spacing: 2px; color: var(--accent-gold); }
.alarm-time-input {
  background: transparent; border: none; outline: none;
  color: var(--accent-gold); font-size: 1.6rem; font-weight: 700;
  font-family: 'Orbitron', monospace; letter-spacing: 2px;
  text-align: right; cursor: pointer;
  /* Style the time picker icon on mobile */
  color-scheme: dark;
}
.alarm-msg-input { margin: 0; }
.alarm-sound-row { display: flex; flex-direction: column; gap: 8px; }
.alarm-sound-btn {
  width: 100%; padding: 11px; border-radius: 10px; cursor: pointer;
  border: 1px solid rgba(108,99,255,0.5); background: rgba(108,99,255,0.08);
  color: #b3aef0; font-size: .72rem; letter-spacing: 2px; transition: all .2s;
}
.alarm-sound-btn:hover { background: rgba(108,99,255,0.18); }
.alarm-sound-picked {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 8px 12px; border-radius: 8px;
  border: 1px solid rgba(250,199,117,0.3); background: rgba(250,199,117,0.05);
}
.alarm-sound-picked span { font-size: .7rem; color: var(--accent-gold); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.alarm-sound-clear {
  background: none; border: 1px solid var(--border); border-radius: 6px;
  color: var(--text-secondary); cursor: pointer; padding: 2px 8px; font-size: .7rem; flex: 0 0 auto;
}
.alarm-sound-clear:hover { color: var(--accent-red); border-color: var(--accent-red); }
.alarm-days-row { display: flex; gap: 6px; flex-wrap: wrap; }
.day-chip {
  flex: 1; min-width: 34px; padding: 8px 4px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--border); background: none;
  color: var(--text-secondary); font-size: .6rem; letter-spacing: 1px;
  transition: all .2s;
}
.day-chip.active {
  border-color: rgba(108,99,255,0.6); background: rgba(108,99,255,0.15);
  color: #b3aef0;
}
.alarm-set-btn {
  width: 100%; padding: 14px; border-radius: 10px; cursor: pointer;
  border: 1px solid rgba(250,199,117,0.6);
  background: linear-gradient(135deg, rgba(250,199,117,0.12), rgba(250,199,117,0.04));
  color: var(--accent-gold); font-size: .8rem; letter-spacing: 3px;
  transition: all .2s;
}
.alarm-set-btn:hover { background: rgba(250,199,117,0.22); box-shadow: 0 0 16px rgba(250,199,117,0.25); }
.alarm-cancel-btn {
  width: 100%; padding: 10px; border-radius: 10px; cursor: pointer; margin-top: 8px;
  border: 1px solid rgba(226,75,74,0.5);
  background: rgba(226,75,74,0.08);
  color: #f09595; font-size: .74rem; letter-spacing: 2px; transition: all .2s;
}
.alarm-cancel-btn:hover { background: rgba(226,75,74,0.18); }
.alarm-note {
  margin: 8px 0 0; font-size: .64rem; letter-spacing: .5px;
  color: rgba(108,99,255,0.8); text-align: center; line-height: 1.5;
}

  `],
})
export class SettingsPanelComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  quests = signal<QuestItem[]>([]);
  pressureLevel = signal<string>(localStorage.getItem('sys_pressure') ?? 'STANDARD');
  addErr = signal<string | null>(null);

  newQuest: Partial<QuestItem> = { category: 'DAILY', xpReward: 60 };
  boostsRaw = '';

  // Danger zone — account deletion state.
  confirmingDelete = signal(false);
  deleting = signal(false);
  deleteErr = signal<string | null>(null);
  deleteConfirmText = '';

  private readonly players = inject(PlayerService);
  private readonly auth = inject(AuthService);
  private readonly localNotifs = inject(LocalNotificationsService);
  private readonly snack = inject(MatSnackBar);
  private readonly lifeOs = inject(LifeOsService);
  exporting = signal(false);

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

  // Alarm clock state
  alarmTime    = localStorage.getItem('sys_alarm_time') ?? '06:00';
  alarmLabel   = localStorage.getItem('sys_alarm_label') ?? 'WAKE PROTOCOL — THE SYSTEM';
  alarmVibrate = localStorage.getItem('sys_alarm_vibrate') !== '0';
  alarmDays    = JSON.parse(localStorage.getItem('sys_alarm_days') ?? '[false,true,true,true,true,true,false]') as boolean[];
  alarmActive  = localStorage.getItem('sys_alarm_active') === '1';
  // Chosen local ringtone (native full-screen alarm only)
  alarmSoundUri  = localStorage.getItem('sys_alarm_sound_uri') ?? '';
  alarmSoundName = localStorage.getItem('sys_alarm_sound_name') ?? '';
  readonly weekDays  = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  readonly isAndroid = Capacitor.getPlatform() === 'android';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const token = localStorage.getItem('system_access_token');
    if (!token) return;
    this.http.get<QuestItem[]>(`${environment.apiUrl}/quests/today`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe((list: QuestItem[]) => this.quests.set(list));
  }

  addQuest(): void {
    if (!this.newQuest.label?.trim()) { this.addErr.set('QUEST LABEL REQUIRED.'); return; }
    const token = localStorage.getItem('system_access_token');
    if (!token) return;
    const key = this.newQuest.label!.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase().slice(0, 30);
    const boosts = this.boostsRaw.trim() ? this.parseBoosts(this.boostsRaw) : null;
    const body = { questKey: key, label: this.newQuest.label, category: this.newQuest.category, xpReward: this.newQuest.xpReward, statBoosts: boosts, active: true };
    this.http.post<QuestItem>(`${environment.apiUrl}/quests/custom`, body, { headers: { Authorization: `Bearer ${token}` }})
      .subscribe({ next: (q: QuestItem) => { this.quests.update((list: QuestItem[]) => [q, ...list]); this.newQuest = { category: 'DAILY', xpReward: 60 }; this.boostsRaw = ''; this.addErr.set(null); },
        error: () => this.addErr.set('Failed to save quest.') });
  }

  toggleQuest(q: QuestItem): void {
    const token = localStorage.getItem('system_access_token');
    if (!token || !q.id) return;
    this.http.patch<QuestItem>(`${environment.apiUrl}/quests/${q.id}/toggle`, {}, { headers: { Authorization: `Bearer ${token}` }})
      .subscribe((updated: QuestItem) => this.quests.update((list: QuestItem[]) => list.map((x: QuestItem) => x.id === updated.id ? updated : x)));
  }

  setPressure(key: string): void {
    this.pressureLevel.set(key);
    localStorage.setItem('sys_pressure', key);
  }

  currentPressureDesc(): string {
    return this.pressures.find(p => p.key === this.pressureLevel())?.desc ?? '';
  }

  toggleDay(index: number): void {
    this.alarmDays[index] = !this.alarmDays[index];
  }

  setAlarm(): void {
    const time = this.alarmTime;
    if (!time) { this.snack.open('Set a time first.', '✕', { duration: 2500, panelClass: 'system-snack' }); return; }

    const [hourStr, minStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);
    const label = this.alarmLabel.trim() || 'THE SYSTEM ALARM';

    // Persist preference
    localStorage.setItem('sys_alarm_time',  time);
    localStorage.setItem('sys_alarm_label', label);
    localStorage.setItem('sys_alarm_days',  JSON.stringify(this.alarmDays));
    localStorage.setItem('sys_alarm_vibrate', this.alarmVibrate ? '1' : '0');
    localStorage.setItem('sys_alarm_sound_uri', this.alarmSoundUri);
    localStorage.setItem('sys_alarm_sound_name', this.alarmSoundName);
    localStorage.setItem('sys_alarm_active', '1');
    this.alarmActive = true;

    if (this.isAndroid) {
      // Always cancel fallback alarms to avoid duplicates if the user previously used the fallback
      this.localNotifs.cancelAlarm();

      // Native full-screen alarm: plays the chosen local MP3 at alarm volume,
      // vibrates and rings over the lock screen even when the app is closed.
      SystemAlarm.setAlarm({
        hour, minute,
        days: this.alarmDays,
        label,
        soundUri: this.alarmSoundUri,
        soundName: this.alarmSoundName,
        vibrate: this.alarmVibrate,
        snoozeMinutes: 9,
      }).then(() => this.checkFullScreenPermission())
        .catch(() => {
          // Fallback to the notification-based alarm if the native plugin is missing.
          this.localNotifs.scheduleAlarm(hour, minute, label, this.alarmDays);
        });
      const soundMsg = this.alarmSoundName ? ` — ${this.alarmSoundName}` : '';
      this.snack.open(
        `◈ ALARM SET — ${time}${soundMsg} — rings + vibrates full-screen`,
        '✕',
        { duration: 4000, panelClass: 'system-snack' }
      );
    } else {
      // Web fallback: one-time notification via LocalNotifications
      const now = new Date();
      const fire = new Date();
      fire.setHours(hour, minute, 0, 0);
      if (fire <= now) fire.setDate(fire.getDate() + 1);
      this.localNotifs.scheduleTimer(Math.round((fire.getTime() - now.getTime()) / 60000));
      this.snack.open(`◈ ALARM SET FOR ${time} — ${label}`, '✕', { duration: 4000, panelClass: 'system-snack' });
    }
  }

  /** Let the Hunter pick any local audio file as the alarm ringtone. */
  chooseSound(): void {
    if (!this.isAndroid) {
      this.snack.open('Custom ringtones need the Android app.', '✕', { duration: 3000, panelClass: 'system-snack' });
      return;
    }
    SystemAlarm.pickSound().then(res => {
      this.alarmSoundUri  = res.uri;
      this.alarmSoundName = res.name;
      localStorage.setItem('sys_alarm_sound_uri', res.uri);
      localStorage.setItem('sys_alarm_sound_name', res.name);
      this.snack.open(`◈ RINGTONE SET — ${res.name}`, '✕', { duration: 3000, panelClass: 'system-snack' });
      // If an alarm is already active, re-schedule so the new sound takes effect.
      if (this.alarmActive) this.setAlarm();
    }).catch(() => { /* user cancelled the picker — ignore */ });
  }

  /** Clear the custom ringtone → fall back to the default alarm sound. */
  clearSound(): void {
    this.alarmSoundUri = '';
    this.alarmSoundName = '';
    localStorage.removeItem('sys_alarm_sound_uri');
    localStorage.removeItem('sys_alarm_sound_name');
    if (this.alarmActive && this.isAndroid) this.setAlarm();
  }

  /** Android 14+ may block the full-screen ringing screen until allowed once. */
  private checkFullScreenPermission(): void {
    if (!this.isAndroid) return;
    SystemAlarm.canUseFullScreenIntent().then(({ allowed }) => {
      if (!allowed) {
        this.snack.open('Allow "full-screen alarms" so it rings over the lock screen.', 'ALLOW', {
          duration: 8000, panelClass: 'system-snack'
        }).onAction().subscribe(() => SystemAlarm.openFullScreenIntentSettings());
      }
    }).catch(() => {});
  }

  cancelAlarm(): void {
    if (this.isAndroid) {
      SystemAlarm.cancelAlarm().catch(() => {});
    }
    this.localNotifs.cancelAlarm();
    localStorage.removeItem('sys_alarm_active');
    this.alarmActive = false;
    this.snack.open('◈ ALARM CANCELLED', '✕', { duration: 2500, panelClass: 'system-snack' });
  }

  setNativeTimer(minutes: number): void {
    this.localNotifs.scheduleTimer(minutes);
    this.snack.open(`◈ FOCUS TIMER SET: ${minutes} MIN`, '✕', { duration: 3000, panelClass: 'system-snack' });
  }

  saveSettings(): void {
    localStorage.setItem('sys_noskip', this.settings.noSkipMode ? '1' : '0');
    localStorage.setItem('sys_hpwarn', this.settings.hpWarnings ? '1' : '0');
    localStorage.setItem('sys_reminder', this.settings.dailyReminder ? '1' : '0');
  }

  cancelDelete(): void {
    this.confirmingDelete.set(false);
    this.deleteConfirmText = '';
    this.deleteErr.set(null);
  }

  deleteProfile(): void {
    if (this.deleteConfirmText.trim().toUpperCase() !== 'DELETE' || this.deleting()) return;
    this.deleting.set(true);
    this.deleteErr.set(null);
    this.players.deleteAccount().subscribe({
      next: () => {
        this.deleting.set(false);
        this.auth.purgeLocalAndLogout();
      },
      error: () => {
        this.deleting.set(false);
        this.deleteErr.set('Deletion failed. Check your connection and try again.');
      },
    });
  }

  /* ===== Phase 4 — Data Export ===== */
  exportJson(): void {
    this.exporting.set(true);
    this.lifeOs.exportData().subscribe({
      next: (data) => {
        this.exporting.set(false);
        this.download(JSON.stringify(data, null, 2), 'the-system-backup.json', 'application/json');
      },
      error: () => { this.exporting.set(false); this.snack.open('⚠ Export failed.', '✕', { duration: 2800, panelClass: 'system-snack-warn' }); },
    });
  }

  exportCsv(): void {
    this.exporting.set(true);
    this.lifeOs.exportData().subscribe({
      next: (data) => {
        this.exporting.set(false);
        const parts: string[] = [];
        for (const [key, val] of Object.entries(data)) {
          if (Array.isArray(val) && val.length) {
            parts.push(`## ${key}`);
            parts.push(this.arrayToCsv(val as Record<string, unknown>[]));
            parts.push('');
          }
        }
        this.download(parts.join('\n'), 'the-system-backup.csv', 'text/csv');
      },
      error: () => { this.exporting.set(false); this.snack.open('⚠ Export failed.', '✕', { duration: 2800, panelClass: 'system-snack-warn' }); },
    });
  }

  private arrayToCsv(rows: Record<string, unknown>[]): string {
    const cols = Array.from(rows.reduce((set: Set<string>, r) => {
      Object.keys(r).forEach(k => set.add(k)); return set;
    }, new Set<string>()));
    const esc = (v: unknown): string => {
      if (v === null || v === undefined) return '';
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = rows.map(r => cols.map(c => esc(r[c])).join(','));
    return [cols.join(','), ...lines].join('\n');
  }

  private download(content: string, filename: string, mime: string): void {
    try {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.snack.open(`◈ EXPORTED — ${filename}`, '✕', { duration: 3000, panelClass: 'system-snack' });
    } catch {
      this.snack.open('⚠ Could not save. Try the web/PWA version.', '✕', { duration: 4000, panelClass: 'system-snack-warn' });
    }
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

