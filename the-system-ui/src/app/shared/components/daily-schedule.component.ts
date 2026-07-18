import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DirectiveService, DirectiveItem, DirectiveBlock,
  DirectiveAnchorKey, DirectiveCategory, toMins
} from '../../core/services/directive.service';

interface DraftForm {
  time: string;
  action: string;
  category: DirectiveCategory;
  tagsRaw: string;
}

import { LocalNotificationsService } from '../../core/services/local-notifications.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-daily-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="sched system-card">

  <!-- ── Header ─────────────────────────────────────────── -->
  <div class="sched-head">
    <span class="mono diam">◈</span>
    <div class="head-text">
      <h3 class="mono title">TODAY'S DIRECTIVE</h3>
      <p class="sub tech">{{ editMode() ? 'CONFIGURING YOUR DAY' : currentDate() }}</p>
    </div>
    <button class="edit-btn tech" (click)="toggleEdit()" [attr.aria-pressed]="editMode()">
      {{ editMode() ? '✓ DONE' : '✎ EDIT' }}
    </button>
  </div>

  <!-- ── Anchor config strip ────────────────────────────── -->
  <div class="anchors">
    <div class="anc-chip" *ngFor="let a of anchorDefs" [class.editable]="editMode()">
      <span class="anc-icon">{{ a.icon }}</span>
      <input *ngIf="editMode()"
             type="time" class="anc-input"
             [id]="'anc-' + a.key"
             [value]="configVal(a.key)"
             (change)="onAnchorChange(a.key, $event)" />
      <span *ngIf="!editMode()" class="anc-time mono">{{ configVal(a.key) }}</span>
      <span class="anc-label tech">{{ a.label }}</span>
    </div>
  </div>

  <!-- ── Conflict warning ───────────────────────────────── -->
  <div class="conflict-warn tech" *ngIf="conflicts().length > 0">
    ⚠ {{ conflicts().length }} step{{ conflicts().length > 1 ? 's' : '' }} may overlap — check and adjust.
  </div>

  <!-- ── Timeline ──────────────────────────────────────── -->
  <div class="items">
    <div *ngFor="let item of schedule(); let i = index"
         class="item"
         [class.past]="!editMode() && isPastOnly(item.time, i)"
         [class.now]="!editMode() && isNow(i)"
         [class.nextup]="!editMode() && nextUpIdx() === i && !isNow(i)"
         [class.is-anchor]="!!item.anchorKey"
         [attr.data-block]="item.block"
         [attr.data-cat]="item.category">

      <div class="time-col">
        <span class="t mono">{{ item.time }}</span>
        <span class="line" *ngIf="i < schedule().length - 1"></span>
      </div>

      <!-- Block dot (visual block indicator) -->
      <div class="bdot" [attr.data-block]="item.block" title="{{ item.block }}"></div>

      <div class="content">
        <span class="action tech"
              [class.done-text]="!editMode() && isPastOnly(item.time, i)">{{ item.action }}</span>
        <div class="tags" *ngIf="item.tags.length > 0">
          <span *ngFor="let q of item.tags" class="qtag mono">{{ q }}</span>
        </div>
      </div>

      <!-- Status badges (view mode) -->
      <ng-container *ngIf="!editMode()">
        <span class="now-tag mono" *ngIf="isNow(i)">▸ NOW</span>
        <span class="next-tag mono" *ngIf="nextUpIdx() === i && !isNow(i)">⏱ NEXT</span>
        <span class="done-icon" *ngIf="isPastOnly(item.time, i)">✓</span>
      </ng-container>

      <!-- Row controls (edit mode) -->
      <div class="row-actions" *ngIf="editMode()">
        <!-- Anchor items → tap ⏰ to jump to anchor input above -->
        <button class="mini anc-goto" *ngIf="item.anchorKey"
                (click)="focusAnchor(item.anchorKey!)" title="Change time above">⏰</button>
        <!-- Non-anchor items → edit or delete -->
        <button class="mini" *ngIf="!item.anchorKey"
                (click)="startEdit(item)" title="Edit">✎</button>
        <button class="mini danger" *ngIf="!item.anchorKey"
                (click)="remove(item.id)" title="Delete">🗑</button>
      </div>
    </div>

    <div class="empty-day tech" *ngIf="schedule().length === 0">
      No steps yet. Add your first one below.
    </div>
  </div>

  <!-- ── Add / edit form (edit mode) ───────────────────── -->
  <div class="editor" *ngIf="editMode()">
    <h4 class="mono ed-title">{{ draftId() ? '✎ EDIT STEP' : '＋ ADD STEP' }}</h4>

    <!-- Live block hint as user types a time -->
    <div class="ed-hint tech" *ngIf="draftBlock()">
      Block detected: <span class="blk-pill" [attr.data-block]="draftBlock()">{{ draftBlock() }}</span>
      <span class="blk-note"> — shifts with your {{ blockAnchorLabel() }} time</span>
    </div>

    <div class="ed-row">
      <input class="fin fin-time" type="time"
             [(ngModel)]="draft.time" (ngModelChange)="onDraftTimeChange()"
             aria-label="Time" />
      <select class="fin fin-cat" [(ngModel)]="draft.category" aria-label="Category">
        <option value="REST">REST</option>
        <option value="DAILY">DAILY</option>
        <option value="SKILL">SKILL</option>
        <option value="DISCIPLINE">DISCIPLINE</option>
      </select>
    </div>
    <input class="fin" placeholder="What to do e.g. 5-min meditation"
           [(ngModel)]="draft.action" aria-label="Action" />
    <input class="fin" placeholder="Quest tags (optional) e.g. WATER, SLEEP"
           [(ngModel)]="draft.tagsRaw" aria-label="Tags" />

    <div class="ed-actions">
      <button class="btn-save mono" (click)="save()">
        {{ draftId() ? 'SAVE CHANGES' : '＋ ADD TO SCHEDULE' }}
      </button>
      <button class="btn-ghost tech" *ngIf="draftId()" (click)="clearDraft()">CANCEL</button>
      <button class="btn-reset tech" (click)="resetDefault()">↺ RESET ALL</button>
    </div>
    <p class="err tech" *ngIf="err()">{{ err() }}</p>
  </div>

  <div class="mandate tech" *ngIf="!editMode() && schedule().length > 0">
    ◈ Build the day you want — then execute it. Skipping costs HP.
  </div>



</div>
  `,
  styles: [`
:host { display: block; }
.sched { padding: 16px 14px 14px; }

/* ── Header ──────────────────────────────────────────────── */
.sched-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.head-text  { flex: 1; min-width: 0; }
.diam  { font-size: 1.3rem; color: var(--accent-gold); text-shadow: 0 0 14px var(--accent-gold); flex-shrink: 0; }
.title { margin: 0; font-size: .82rem; letter-spacing: 3px; }
.sub   { margin: 2px 0 0; font-size: .64rem; letter-spacing: 2px; color: var(--accent-gold); font-family: 'Orbitron',monospace; }
.edit-btn {
  flex-shrink: 0; background: none; border: 1px solid var(--border); border-radius: 6px;
  color: var(--text-secondary); cursor: pointer; padding: 5px 10px; font-size: .6rem;
  letter-spacing: 1.5px; white-space: nowrap; transition: all .2s;
  min-height: unset; min-width: unset;
}
.edit-btn:hover                { color: var(--text-primary); border-color: var(--accent-purple); }
.edit-btn[aria-pressed="true"] { color: #5dcaa5; border-color: var(--accent-teal); background: rgba(29,158,117,0.12); }

/* ── Anchor strip — CSS grid so all 4 chips are always equal width ── */
.anchors {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 14px;
}
.anc-chip {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 5px; padding: 10px 4px 8px;
  border-radius: 10px; border: 1px solid var(--border);
  background: rgba(6,6,16,0.70);
  text-align: center; transition: border-color .2s, background .2s;
}
.anc-chip.editable { border-color: rgba(83,74,183,0.4); background: rgba(83,74,183,0.06); }
.anc-icon  { font-size: 1.1rem; line-height: 1; }
.anc-time  {
  font-size: .7rem; color: var(--accent-gold); letter-spacing: .5px;
  white-space: nowrap; /* ← critical fix: never wrap the time */
}
.anc-label {
  font-size: .48rem; letter-spacing: 1.5px; color: var(--text-secondary);
  white-space: nowrap; /* ← critical fix: never wrap the label */
}
.anc-input {
  background: transparent; border: none;
  border-bottom: 1.5px solid rgba(108,99,255,0.55);
  color: var(--accent-gold); font-family: 'Orbitron',monospace;
  font-size: .68rem; letter-spacing: .5px;
  width: 100%; max-width: 72px;
  text-align: center; outline: none; padding: 2px 0;
}
.anc-input:focus { border-bottom-color: var(--accent-purple); }

/* ── Conflict warning ─────────────────────────────────────── */
.conflict-warn {
  margin-bottom: 10px; padding: 8px 12px; border-radius: 8px;
  background: rgba(250,199,117,0.07); border: 1px solid rgba(250,199,117,0.25);
  font-size: .68rem; letter-spacing: 1px; color: #fac775;
}

/* ── Timeline items ───────────────────────────────────────── */
.items { display: flex; flex-direction: column; }
.item {
  display: flex; gap: 8px; align-items: flex-start;
  padding: 7px 4px; border-radius: 8px; transition: background .2s;
  border-left: 2px solid transparent;
}
.item.now    { background: rgba(83,74,183,0.10); border-left-color: var(--accent-purple); padding-left: 8px; }
.item.nextup { background: rgba(250,199,117,0.05); border-left-color: var(--accent-gold); padding-left: 8px; }
.item.past   { opacity: 0.42; }
.item.is-anchor .t { font-weight: 700; }

.time-col { display: flex; flex-direction: column; align-items: center; min-width: 44px; flex-shrink: 0; }
.t { font-size: .62rem; letter-spacing: 1px; color: var(--text-secondary); white-space: nowrap; }
.line { flex: 1; width: 1px; background: var(--border); min-height: 14px; margin: 3px 0; }

.item[data-block="MORNING"] .t { color: rgba(250,199,117,0.55); }
.item[data-block="EVENING"] .t { color: rgba(83,74,183,0.75); }
.item[data-cat="DISCIPLINE"][data-block="MORNING"] .t { color: rgba(226,75,74,0.55); }

.bdot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; margin-top: 9px; background: rgba(255,255,255,0.1); }
.bdot[data-block="MORNING"] { background: rgba(250,199,117,0.7); }
.bdot[data-block="WORK"]    { background: rgba(59,155,255,0.6); }
.bdot[data-block="EVENING"] { background: rgba(83,74,183,0.8); }

.content { flex: 1; min-width: 0; }
.action   { font-size: .8rem; letter-spacing: .4px; color: var(--text-primary); display: block; line-height: 1.45; }
.done-text { text-decoration: line-through; color: var(--text-secondary); }

/* ── Tags — fully visible, NO truncation ──────────────────── */
.tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
.qtag {
  font-size: .52rem; letter-spacing: .6px; padding: 2px 7px; border-radius: 4px;
  background: rgba(83,74,183,0.18); color: #b3aef0;
  /* prevent mid-word break but allow the full tag text to show */
  white-space: nowrap; word-break: normal; overflow-wrap: normal;
}
.item[data-cat="DISCIPLINE"] .qtag { background: rgba(226,75,74,0.14); color: #f09595; }
.item[data-cat="SKILL"]        .qtag { background: rgba(83,74,183,0.22); color: #b3aef0; }
.item[data-cat="DAILY"]        .qtag { background: rgba(29,158,117,0.16); color: #5dcaa5; }

/* ── Status badges ─────────────────────────────────────────── */
.now-tag {
  font-size: .56rem; letter-spacing: 1px; color: var(--accent-purple); font-weight: 700;
  margin-top: 3px; white-space: nowrap; flex-shrink: 0;
  animation: blink 1.1s step-end infinite;
}
.next-tag  { font-size: .56rem; letter-spacing: 1px; color: var(--accent-gold); font-weight: 700; margin-top: 3px; white-space: nowrap; flex-shrink: 0; }
.done-icon { color: var(--accent-teal); font-size: .85rem; margin-top: 3px; flex-shrink: 0; }
@keyframes blink { 50% { opacity: 0; } }

/* ── Row edit controls ─────────────────────────────────────── */
.row-actions { display: flex; gap: 5px; align-items: center; flex-shrink: 0; }
.mini {
  background: rgba(6,6,16,0.6); border: 1px solid var(--border); border-radius: 6px;
  color: var(--text-secondary); cursor: pointer; width: 28px; height: 28px;
  font-size: .78rem; display: grid; place-items: center; transition: all .15s;
  min-height: unset; min-width: unset; padding: 0;
}
.mini:hover          { color: var(--text-primary);  border-color: var(--accent-purple); }
.mini.danger:hover   { color: #f09595;               border-color: var(--accent-red);    }
.mini.anc-goto:hover { color: var(--accent-gold);    border-color: var(--accent-gold);   }

/* ── Add / edit form ───────────────────────────────────────── */
.editor {
  margin-top: 14px; padding: 14px; border: 1px solid var(--border); border-radius: 10px;
  background: rgba(6,6,16,0.5); display: flex; flex-direction: column; gap: 8px;
}
.ed-title { margin: 0 0 2px; font-size: .64rem; letter-spacing: 2px; color: var(--accent-gold); }
.ed-hint  { font-size: .64rem; letter-spacing: .5px; color: var(--text-secondary); }
.blk-pill {
  font-weight: 700; font-size: .64rem; letter-spacing: 1.5px; padding: 1px 7px; border-radius: 4px;
  border: 1px solid transparent;
}
.blk-pill[data-block="MORNING"] { color: #FAC775; border-color: rgba(250,199,117,0.3); background: rgba(250,199,117,0.08); }
.blk-pill[data-block="WORK"]    { color: #3B9BFF; border-color: rgba(59,155,255,0.3);  background: rgba(59,155,255,0.08); }
.blk-pill[data-block="EVENING"] { color: #b3aef0; border-color: rgba(83,74,183,0.3);   background: rgba(83,74,183,0.08); }
.blk-note { color: var(--text-dim); font-size: .6rem; }
.ed-row { display: flex; gap: 7px; }
.fin {
  background: rgba(6,6,16,0.9); border: 1px solid var(--border); border-radius: 8px;
  color: var(--text-primary); padding: 9px 12px; font-family: inherit; font-size: .8rem; flex: 1;
}
.fin:focus { outline: none; border-color: var(--accent-purple); box-shadow: 0 0 0 2px rgba(108,99,255,0.15); }
.fin-time { flex: 0 0 110px; }
.fin-cat  { flex: 1; }
.ed-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-save {
  cursor: pointer; border: 1px solid var(--accent-teal); border-radius: 8px;
  background: rgba(29,158,117,0.14); color: #5dcaa5; padding: 9px 16px;
  font-size: .7rem; letter-spacing: 1.5px; font-family: inherit; transition: background .2s;
  min-height: unset; white-space: nowrap;
}
.btn-save:hover { background: rgba(29,158,117,0.26); }
.btn-ghost, .btn-reset {
  cursor: pointer; background: none; border: 1px solid var(--border); border-radius: 8px;
  color: var(--text-secondary); padding: 9px 12px; font-size: .64rem; letter-spacing: 1px;
  transition: all .2s; min-height: unset;
}
.btn-ghost:hover { color: var(--text-primary); border-color: var(--accent-purple); }
.btn-reset { margin-left: auto; }
.btn-reset:hover { color: #f09595; border-color: var(--accent-red); }
.err { color: #f09595; font-size: .66rem; letter-spacing: 1px; margin: 0; }
.empty-day { text-align: center; padding: 20px; color: var(--text-secondary); font-size: .7rem; letter-spacing: 2px; }

.mandate {
  margin-top: 14px; padding: 9px 12px; border-radius: 8px;
  background: rgba(226,75,74,0.05); border: 1px solid rgba(226,75,74,0.16);
  font-size: .62rem; letter-spacing: 1px; color: rgba(240,149,149,0.65); line-height: 1.6;
}

/* ── Container queries — layout adapts to the card's width ── */
/* When the card is very narrow (<300px), switch anchor strip to 2×2 grid */
@container card (max-width: 299px) {
  .anchors { grid-template-columns: repeat(2, 1fr); }
  .anc-chip { padding: 8px 4px; }
  .anc-time, .anc-input { font-size: .66rem; }
}
/* When card is wide (≥420px), show larger anchor chips */
@container card (min-width: 420px) {
  .anc-chip { padding: 12px 8px; }
  .anc-icon { font-size: 1.25rem; }
  .anc-time { font-size: .78rem; }
  .anc-label { font-size: .52rem; }
  .action { font-size: .86rem; }
}
  `],
})
export class DailyScheduleComponent implements OnInit, OnDestroy {
  private readonly svc = inject(DirectiveService);
  private readonly notificationsSvc = inject(LocalNotificationsService);
  private readonly snack = inject(MatSnackBar);
  readonly schedule   = this.svc.items;
  readonly config     = this.svc.config;

  setNativeTimer(minutes: number) {
    this.notificationsSvc.scheduleTimer(minutes);
    this.snack.open(`◈ NATIVE TIMER SET: ${minutes} MINS`, '✕', { duration: 3000, panelClass: 'system-snack' });
  }

  // ── Clock ────────────────────────────────────────────────────────────────
  readonly currentTime = signal('');
  readonly currentDate = signal('');
  private timer: any;

  private readonly _nowMins = computed(() => {
    const t = this.currentTime();
    return t ? toMins(t) : (() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); })();
  });

  /** Index of the first upcoming item (not yet started). -1 = all done. */
  readonly nextUpIdx = computed(() => {
    const list = this.schedule();
    const nm = this._nowMins();
    for (let i = 0; i < list.length; i++) {
      if (toMins(list[i].time) > nm) return i;
    }
    return -1;
  });

  /** Items whose computed time overflows into the next block's anchor time */
  readonly conflicts = computed<DirectiveItem[]>(() => {
    const cfg  = this.config();
    const list = this.schedule();
    const warns: DirectiveItem[] = [];
    for (const it of list) {
      if (it.anchorKey) continue;
      const tm = toMins(it.time);
      if (it.block === 'MORNING' && tm >= toMins(cfg.officeStart)) warns.push(it);
      if (it.block === 'WORK'    && tm >= toMins(cfg.officeEnd))   warns.push(it);
      if (it.block === 'EVENING' && tm >= toMins(cfg.sleepTime))   warns.push(it);
    }
    return warns;
  });

  // ── Anchor strip definitions ─────────────────────────────────────────────
  readonly anchorDefs: Array<{ key: DirectiveAnchorKey; label: string; icon: string }> = [
    { key: 'WAKE',         label: 'WAKE',   icon: '🌅' },
    { key: 'OFFICE_START', label: 'IN',     icon: '🏢' },
    { key: 'OFFICE_END',   label: 'OUT',    icon: '🔓' },
    { key: 'SLEEP',        label: 'SLEEP',  icon: '🌙' },
  ];

  // ── Edit state ───────────────────────────────────────────────────────────
  editMode  = signal(false);
  draftId   = signal<string | null>(null);
  draftBlock = signal<DirectiveBlock | null>(null);
  err       = signal<string | null>(null);
  draft: DraftForm = this.emptyDraft();

  ngOnInit():  void { this.tick(); this.timer = setInterval(() => this.tick(), 30_000); }
  ngOnDestroy(): void { clearInterval(this.timer); }

  private tick(): void {
    const d = new Date();
    this.currentTime.set(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    const opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
    this.currentDate.set(d.toLocaleDateString('en-GB', opts).toUpperCase());
  }

  // ── Anchor helpers ───────────────────────────────────────────────────────
  configVal(key: DirectiveAnchorKey): string {
    const c = this.config();
    return key === 'WAKE' ? c.wakeTime : key === 'OFFICE_START' ? c.officeStart
         : key === 'OFFICE_END' ? c.officeEnd : c.sleepTime;
  }

  onAnchorChange(key: DirectiveAnchorKey, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (/^\d{2}:\d{2}$/.test(val)) this.svc.setAnchor(key, val);
  }

  focusAnchor(key: DirectiveAnchorKey): void {
    const el = document.getElementById('anc-' + key) as HTMLInputElement | null;
    if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  }

  blockAnchorLabel(): string {
    switch (this.draftBlock()) {
      case 'MORNING': return 'WAKE';
      case 'WORK':    return 'OFFICE IN';
      case 'EVENING': return 'OFFICE OUT';
      default:        return '';
    }
  }

  // ── Now / next helpers ───────────────────────────────────────────────────
  isPastOnly(time: string, idx: number): boolean {
    return toMins(time) < this._nowMins() && !this.isNow(idx);
  }

  isNow(idx: number): boolean {
    const list = this.schedule();
    const curr = list[idx];
    if (!curr) return false;
    const nm = this._nowMins();
    if (toMins(curr.time) > nm) return false;
    const next = list[idx + 1];
    return !next || toMins(next.time) > nm;
  }

  // ── Edit actions ─────────────────────────────────────────────────────────
  toggleEdit(): void { this.editMode.update(v => !v); this.clearDraft(); }

  startEdit(item: DirectiveItem): void {
    this.draftId.set(item.id);
    this.draft = { time: item.time, action: item.action, category: item.category, tagsRaw: item.tags.join(', ') };
    this.draftBlock.set(item.block);
    this.err.set(null);
  }

  onDraftTimeChange(): void {
    if (/^\d{2}:\d{2}$/.test(this.draft.time)) {
      const { block } = this.svc.resolveBlock(this.draft.time);
      this.draftBlock.set(block);
    }
  }

  clearDraft(): void {
    this.draftId.set(null);
    this.draft = this.emptyDraft();
    this.draftBlock.set(null);
    this.err.set(null);
  }

  save(): void {
    const time   = (this.draft.time   || '').trim();
    const action = (this.draft.action || '').trim();
    if (!/^\d{2}:\d{2}$/.test(time)) { this.err.set('Pick a valid time.'); return; }
    if (!action)                      { this.err.set('Describe the step.'); return; }
    const tags = (this.draft.tagsRaw || '')
      .split(',').map((t: string) => t.trim().toUpperCase().replace(/\s+/g,'_')).filter(Boolean).slice(0, 5);
    const { block, offsetMins } = this.svc.resolveBlock(time);
    if (this.draftId()) {
      this.svc.update(this.draftId()!, { action, category: this.draft.category, tags, block, offsetMins });
    } else {
      this.svc.add({ action, category: this.draft.category, tags, block, offsetMins });
    }
    this.clearDraft();
  }

  remove(id: string): void { this.svc.remove(id); if (this.draftId() === id) this.clearDraft(); }

  resetDefault(): void {
    if (confirm('Restore the full default directive and reset all anchor times?')) {
      this.svc.reset(); this.clearDraft();
    }
  }

  private emptyDraft(): DraftForm {
    return { time: '', action: '', category: 'DAILY', tagsRaw: '' };
  }
}

