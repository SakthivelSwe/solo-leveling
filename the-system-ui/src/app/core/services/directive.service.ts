import { Injectable, computed, signal } from '@angular/core';

// ── Types ─────────────────────────────────────────────────────────────────────
export type DirectiveCategory = 'TESTOSTERONE' | 'DAILY' | 'SKILL' | 'REST';
export type DirectiveBlock     = 'MORNING' | 'WORK' | 'EVENING' | 'NIGHT';
export type DirectiveAnchorKey = 'WAKE' | 'OFFICE_START' | 'OFFICE_END' | 'SLEEP';

export interface DirectiveConfig {
  wakeTime:    string; // "HH:mm"
  officeStart: string;
  officeEnd:   string;
  sleepTime:   string;
}

/**
 * Stored in localStorage — no computed fields.
 * offsetMins is relative to the block anchor:
 *   MORNING → wakeTime  |  WORK → officeStart  |  EVENING → officeEnd
 * Anchor items (anchorKey set) always display the anchor time directly.
 */
export interface RawDirectiveItem {
  id:         string;
  action:     string;
  tags:       string[];
  category:   DirectiveCategory;
  block:      DirectiveBlock;
  offsetMins: number;
  anchorKey?: DirectiveAnchorKey; // marks this as an un-deletable anchor point
}

/** Served to the template — includes the computed absolute time */
export interface DirectiveItem extends RawDirectiveItem {
  time: string; // HH:mm, derived from config + block + offsetMins
}

// ── Storage keys ───────────────────────────────────────────────────────────────
const CFG_KEY   = 'sys_dir_cfg_v4';
const ITEMS_KEY = 'sys_dir_items_v4';

// ── Helpers (exported so component can use them) ───────────────────────────────
export function toMins(hhmm: string): number {
  const [h = 0, m = 0] = (hhmm || '00:00').split(':').map(Number);
  return h * 60 + m;
}
export function fromMins(total: number): string {
  const t = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2,'0')}:${String(t % 60).padStart(2,'0')}`;
}
export function logicalMins(hhmm: string, dayStart: string = '04:00'): number {
  const m = toMins(hhmm);
  const start = toMins(dayStart);
  return m < start ? m + 1440 : m;
}

// ── Defaults ───────────────────────────────────────────────────────────────────
export const DEFAULT_CONFIG: DirectiveConfig = {
  wakeTime:    '08:00',
  officeStart: '09:00',
  officeEnd:   '20:30',
  sleepTime:   '23:30',
};

/**
 * Default items with block-relative offsets.
 * MORNING offsets are from wakeTime (08:00 default).
 * WORK offsets from officeStart (09:00).
 * EVENING offsets from officeEnd (20:30).
 * NIGHT offsets from sleepTime (23:30) (negative offsets for leading up to sleep).
 */
export const DEFAULT_RAW: RawDirectiveItem[] = [
  // ── MORNING (anchor = wakeTime) ────────────────────────────────────────────
  { id:'wake',     block:'MORNING', offsetMins:0,   anchorKey:'WAKE',
    action:'Wake up — no snooze',                              tags:[],                           category:'REST'         },
  { id:'shower',   block:'MORNING', offsetMins:5,
    action:'Cold shower — last 30s cold',                      tags:['COLD_SHOWER'],              category:'TESTOSTERONE' },
  { id:'move',     block:'MORNING', offsetMins:15,
    action:'20-min exercise: squats + pushups + jacks',        tags:['EXERCISE'],                 category:'TESTOSTERONE' },
  { id:'fuel',     block:'MORNING', offsetMins:35,
    action:'Sunlight + breakfast (eggs + banana + nuts)',      tags:['MORNING_SUN','BREAKFAST'],  category:'TESTOSTERONE' },
  // ── WORK (anchor = officeStart) ────────────────────────────────────────────
  { id:'office',   block:'WORK',    offsetMins:0,   anchorKey:'OFFICE_START',
    action:'Office login — deep work block',                   tags:[],                           category:'REST'         },
  { id:'water1',   block:'WORK',    offsetMins:120,
    action:'Drink first water bottle',                         tags:['WATER'],                    category:'DAILY'        },
  { id:'lunch',    block:'WORK',    offsetMins:240,
    action:'Proper lunch — zero soft drinks',                  tags:['NO_SODA'],                  category:'DAILY'        },
  { id:'breathe',  block:'WORK',    offsetMins:260,
    action:'5-min deep breathing — cortisol reset',            tags:['BREATHING'],                category:'TESTOSTERONE' },
  { id:'water2',   block:'WORK',    offsetMins:480,
    action:'Drink second water bottle',                        tags:['WATER'],                    category:'DAILY'        },
  // ── EVENING (anchor = officeEnd) ───────────────────────────────────────────
  { id:'logoff',   block:'EVENING', offsetMins:0,   anchorKey:'OFFICE_END',
    action:'Office logoff — your grind begins',                tags:[],                           category:'REST'         },
  { id:'code',     block:'EVENING', offsetMins:30,
    action:'1 hr coding — use AI only if needed',              tags:['DEEP_WORK'],                category:'SKILL'        },
  { id:'leet',     block:'EVENING', offsetMins:90,
    action:'Solve 1 LeetCode problem',                         tags:['LEETCODE'],                 category:'SKILL'        },
  // ── NIGHT (anchor = sleepTime) ─────────────────────────────────────────────
  { id:'english',  block:'NIGHT',   offsetMins:-60,
    action:'20-min English speaking practice',                 tags:['ENGLISH'],                  category:'SKILL'        },
  { id:'winddown', block:'NIGHT',   offsetMins:-35,
    action:'Reflect + message someone who matters',            tags:[],                           category:'REST'         },
  { id:'noreels',  block:'NIGHT',   offsetMins:-30,
    action:'Phone down — no reels, no porn',                   tags:['NO_REELS','NO_PORN'],       category:'TESTOSTERONE' },
  { id:'sleep',    block:'NIGHT',   offsetMins:0,   anchorKey:'SLEEP',
    action:'Sleep — recovery is where you level up',           tags:['SLEEP'],                    category:'DAILY'        },
];

// ── Service ────────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class DirectiveService {
  /** The 4 key anchor times — any change auto-shifts all items in that block. */
  readonly config = signal<DirectiveConfig>(this.loadConfig());

  /** Raw items stored in localStorage (with block + offsetMins) */
  private readonly _raw = signal<RawDirectiveItem[]>(this.loadRaw());

  /**
   * Computed timeline: absolute times derived from (config + block + offsetMins).
   * Sorted chronologically. Fully reactive — updates instantly when config changes.
   *
   * EXAMPLE: change wakeTime 08:00 → 06:00
   *   shower  offsetMins=5  → 06:05 (was 08:05)
   *   exercise offsetMins=15 → 06:15 (was 08:15)
   *   breakfast offsetMins=35 → 06:35 (was 08:35)
   *   Office login (WORK block) → unchanged at 09:00
   */
  readonly items = computed<DirectiveItem[]>(() => {
    const cfg = this.config();
    return this._raw()
      .map(it => ({ ...it, time: this.calcTime(it, cfg) }))
      .sort((a, b) => logicalMins(a.time) - logicalMins(b.time));
  });

  // ── Anchor mutations ────────────────────────────────────────────────────────
  setAnchor(key: DirectiveAnchorKey, hhmm: string): void {
    this.config.update(c => {
      const n = { ...c };
      if (key === 'WAKE')         n.wakeTime    = hhmm;
      if (key === 'OFFICE_START') n.officeStart = hhmm;
      if (key === 'OFFICE_END')   n.officeEnd   = hhmm;
      if (key === 'SLEEP')        n.sleepTime   = hhmm;
      localStorage.setItem(CFG_KEY, JSON.stringify(n));
      return n;
    });
  }

  // ── Item CRUD ───────────────────────────────────────────────────────────────
  add(item: Omit<RawDirectiveItem, 'id'>): void {
    this.persist([...this._raw(), { ...item, id: this.uid() }]);
  }

  update(id: string, patch: Partial<Omit<RawDirectiveItem, 'id'>>): void {
    this.persist(this._raw().map((it: RawDirectiveItem) =>
      it.id === id ? { ...it, ...patch } : it));
  }

  remove(id: string): void {
    this.persist(this._raw().filter((it: RawDirectiveItem) => it.id !== id));
  }

  setRawItems(items: RawDirectiveItem[]): void {
    this.persist(items);
  }

  reset(): void {
    const cfg = { ...DEFAULT_CONFIG };
    this.config.set(cfg);
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
    this.persist(structuredClone(DEFAULT_RAW));
  }

  // ── Public helpers ──────────────────────────────────────────────────────────
  /** Compute absolute HH:mm for an item given a config snapshot */
  calcTime(item: RawDirectiveItem, cfg: DirectiveConfig): string {
    switch (item.anchorKey) {
      case 'WAKE':         return cfg.wakeTime;
      case 'OFFICE_START': return cfg.officeStart;
      case 'OFFICE_END':   return cfg.officeEnd;
      case 'SLEEP':        return cfg.sleepTime;
    }
    const base =
      item.block === 'MORNING' ? toMins(cfg.wakeTime) :
      item.block === 'WORK'    ? toMins(cfg.officeStart) :
      item.block === 'NIGHT'   ? toMins(cfg.sleepTime) :
                                 toMins(cfg.officeEnd);
    return fromMins(base + item.offsetMins);
  }

  /**
   * Given an absolute HH:mm, determine which block it belongs to
   * and compute its offset from that block's anchor.
   * Used when saving a new/edited item.
   */
  resolveBlock(hhmm: string): { block: DirectiveBlock; offsetMins: number } {
    const cfg = this.config();
    const m   = logicalMins(hhmm);
    
    const sleepM = logicalMins(cfg.sleepTime);
    const endM   = logicalMins(cfg.officeEnd);
    const startM = logicalMins(cfg.officeStart);
    const wakeM  = logicalMins(cfg.wakeTime);

    if (m >= sleepM - 180 && m <= sleepM + 120) return { block:'NIGHT',   offsetMins: m - sleepM };
    if (m >= endM)                              return { block:'EVENING', offsetMins: m - endM };
    if (m >= startM)                            return { block:'WORK',    offsetMins: m - startM };
    return                                             { block:'MORNING', offsetMins: m - wakeM };
  }

  // ── Private ─────────────────────────────────────────────────────────────────
  private persist(list: RawDirectiveItem[]): void {
    this._raw.set(list);
    localStorage.setItem(ITEMS_KEY, JSON.stringify(list));
  }

  private loadConfig(): DirectiveConfig {
    try {
      const s = localStorage.getItem(CFG_KEY);
      if (s) return { ...DEFAULT_CONFIG, ...JSON.parse(s) };
    } catch { /* use default */ }
    return { ...DEFAULT_CONFIG };
  }

  private loadRaw(): RawDirectiveItem[] {
    try {
      const s = localStorage.getItem(ITEMS_KEY);
      if (s) {
        const p = JSON.parse(s) as RawDirectiveItem[];
        if (Array.isArray(p) && p.length) return p;
      }
    } catch { /* use default */ }
    return structuredClone(DEFAULT_RAW);
  }

  private uid(): string {
    return 'd_' + Math.random().toString(36).slice(2, 9);
  }
}

