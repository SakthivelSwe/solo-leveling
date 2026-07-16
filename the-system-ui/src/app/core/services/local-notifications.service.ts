import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions, PermissionStatus, Channel } from '@capacitor/local-notifications';
import { Habit } from '../models/models';

/** The monochrome notification icon used in the Android status bar.
 *  Must match the filename in android/app/src/main/res/drawable/ */
const SMALL_ICON = 'ic_stat_notify';
/** The full-colour app icon shown in the notification drawer (large icon). */
const LARGE_ICON = 'ic_launcher';

@Injectable({ providedIn: 'root' })
export class LocalNotificationsService {
  private router = inject(Router);

  /**
   * ─── Notification channel IDs ───────────────────────────────────────────
   * Android notification channels are IMMUTABLE once created — their sound,
   * importance and vibration can NEVER be changed programmatically afterwards.
   * If we ever need to change a channel's settings we MUST bump its version
   * suffix (v2 → v3 …) so Android treats it as a brand-new channel. Deleting
   * and recreating a channel with the SAME id does NOT reliably reset it
   * (Android may resurrect the old settings), hence the version bump.
   *
   * v3 fixes the "notification shows but is silent" bug: the previous channels
   * were created with `sound: 'default'`, which the Capacitor plugin resolves
   * to `android.resource://<pkg>/raw/default`. That raw resource does not
   * exist, so the channel was created pointing at a missing sound file → total
   * silence. Omitting `sound` lets Android use the real system default sound.
   */
  private static readonly CH = {
    alarms: 'system-alarms-v3',   // URGENT — rings + vibrates (alarms, sleep, midnight)
    game: 'game-events-v3',       // HIGH   — rings + vibrates (HP warnings, level ups)
    reminders: 'reminders-v3',    // DEFAULT — soft nudges (lunch, evening, weekly, habits)
  };

  /** Static IDs */
  private static readonly IDS = {
    midnight: 1,
    wake: 10,
    lunch: 11,
    evening: 12,
    sleep: 13,
    weeklyReview: 14,
    alarm: 500,  // User-set wake alarm (cancelable) — uses 7 slots: 500..506
  };
  private static readonly HABIT_ID_BASE = 2000;
  private static readonly HABIT_ACTION_TYPE = 'HABIT_ACTION';
  private static readonly ACTION_START_NOW = 'start_now';

  private activeTimerId: number | null = null;
  private hpWarningCooldown = false;

  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await this.registerActionTypes();
      this.listenForActions();
    } catch { /* ignore */ }
  }

  async createChannels(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      // Remove every previous channel version so the device stops using the
      // old, broken (silent) channels. New settings only take effect on a
      // freshly-versioned channel id (see the CH doc comment above).
      for (const stale of [
        'system-alarms', 'game-events', 'reminders',            // v1
        'system-alarms-v2', 'game-events-v2', 'reminders-v2',   // v2 (silent bug)
      ]) {
        await LocalNotifications.deleteChannel({ id: stale }).catch(() => {});
      }

      // alarms (v3): URGENT — heads-up + SYSTEM DEFAULT sound + vibration.
      // NOTE: `sound` is intentionally omitted → Android uses the real system
      // default notification sound. Passing a name here would require a matching
      // file in android/app/src/main/res/raw/ or the channel goes SILENT.
      await LocalNotifications.createChannel({
        id: LocalNotificationsService.CH.alarms,
        name: '⚡ THE SYSTEM — Alarms',
        description: 'Wake alarm, sleep reminder and midnight reset notifications',
        importance: 5,       // IMPORTANCE_HIGH → heads-up + sound
        visibility: 1,       // VISIBILITY_PUBLIC → show on lock screen
        vibration: true,
        lights: true,
        lightColor: '#6C63FF',
      });

      // game-events (v3): HIGH — sound + vibration for HP warnings / level ups
      await LocalNotifications.createChannel({
        id: LocalNotificationsService.CH.game,
        name: '◈ THE SYSTEM — Game Events',
        description: 'HP warnings, level ups, dungeon alerts',
        importance: 4,
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: '#FAC775',
      });

      // reminders (v3): DEFAULT — daily nudges with sound + vibration
      await LocalNotifications.createChannel({
        id: LocalNotificationsService.CH.reminders,
        name: '◈ THE SYSTEM — Reminders',
        description: 'Lunch, evening and weekly review reminders',
        importance: 3,
        visibility: 1,
        vibration: true,
      });
    } catch { /* ignore */ }
  }

  private async registerActionTypes(): Promise<void> {
    try {
      await LocalNotifications.registerActionTypes({
        types: [{
          id: LocalNotificationsService.HABIT_ACTION_TYPE,
          actions: [{ id: LocalNotificationsService.ACTION_START_NOW, title: 'Start Now ⚡', foreground: true }]
        }]
      });
    } catch {}
  }

  private listenForActions(): void {
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      if (action.actionId === LocalNotificationsService.ACTION_START_NOW) {
        this.router.navigate(['/habits']);
      }
    });
  }

  async scheduleAlarms(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.cancel({
        notifications: [
          { id: LocalNotificationsService.IDS.midnight },
          { id: LocalNotificationsService.IDS.wake },
          { id: LocalNotificationsService.IDS.sleep }
        ]
      });
      await LocalNotifications.schedule({
        notifications: [
          {
            id: LocalNotificationsService.IDS.midnight,
            channelId: LocalNotificationsService.CH.alarms,
            title: '⚡ SYSTEM ALERT: Midnight Reset',
            body: 'A new day begins. Quests reset. Arise, Hunter.',
            largeBody: '◈ THE SYSTEM HAS RESET ◈\n\nA new day has dawned. All daily quests and routines have been reset.\n\n"The system is not your master, it is your tool. Use it to level up."\n\nPrepare your directives for today.',
            largeIcon: LARGE_ICON,
            schedule: { on: { hour: 0, minute: 0 }, allowWhileIdle: true, repeats: true },
            smallIcon: SMALL_ICON
          },
          {
            id: LocalNotificationsService.IDS.wake,
            channelId: LocalNotificationsService.CH.alarms,
            title: '⚡ WAKE PROTOCOL INITIATED',
            body: 'Cold shower. Sunlight. Eggs. Begin.',
            largeBody: '◈ WAKE PROTOCOL ◈\n\n1. Get out of bed immediately.\n2. Expose your eyes to sunlight.\n3. Take a cold shower.\n4. Consume a high-protein breakfast.\n\nDo not let the system dictate your weakness. Level up today.',
            largeIcon: LARGE_ICON,
            schedule: { on: { hour: 8, minute: 0 }, allowWhileIdle: true, repeats: true },
            smallIcon: SMALL_ICON
          },
          {
            id: LocalNotificationsService.IDS.sleep,
            channelId: LocalNotificationsService.CH.alarms,
            title: '⚡ SLEEP PROTOCOL',
            body: 'Phone down. Sleep before 11:30. System watching.',
            largeBody: '◈ SLEEP PROTOCOL ◈\n\nYour body requires recovery to grow stronger.\n\n1. Put all screens away.\n2. Prepare for sleep.\n3. Sleep before 11:30 PM.\n\nFailure to recover is failure to level up.',
            largeIcon: LARGE_ICON,
            schedule: { on: { hour: 23, minute: 0 }, allowWhileIdle: true, repeats: true },
            smallIcon: SMALL_ICON
          }
        ]
      });
    } catch {}
  }

  async scheduleReminders(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: LocalNotificationsService.IDS.lunch }, { id: LocalNotificationsService.IDS.evening }, { id: LocalNotificationsService.IDS.weeklyReview }]
      });
      await LocalNotifications.schedule({
        notifications: [
          {
            id: LocalNotificationsService.IDS.lunch,
            channelId: LocalNotificationsService.CH.reminders,
            title: 'FUEL REQUIRED',
            body: 'Proper lunch. No junk. Zinc included.',
            largeBody: '◈ MIDDAY FUEL CHECK ◈\n\nYour body requires clean fuel to maintain peak performance.\n\n◈ No sugar. No processed junk.\n◈ Ensure adequate protein and zinc.\n◈ Hydrate immediately.\n\nDo not poison your avatar.',
            largeIcon: LARGE_ICON,
            schedule: { on: { hour: 13, minute: 0 }, repeats: true },
            smallIcon: SMALL_ICON
          },
          {
            id: LocalNotificationsService.IDS.evening,
            channelId: LocalNotificationsService.CH.reminders,
            title: 'QUESTS REMAINING',
            body: 'Check your incomplete quests. Evening window closing.',
            largeBody: '◈ EVENING DIRECTIVE ◈\n\nThe day is ending, but your tasks are not finished.\n\nCheck the system for incomplete daily quests. Leaving them unfinished will result in penalties.\n\nPush through the fatigue. That is how you level up.',
            largeIcon: LARGE_ICON,
            schedule: { on: { hour: 21, minute: 0 }, repeats: true },
            smallIcon: SMALL_ICON
          },
          {
            id: LocalNotificationsService.IDS.weeklyReview,
            channelId: LocalNotificationsService.CH.reminders,
            title: '📊 WEEKLY REVIEW',
            body: 'Open the system. Review your week. Set next target.',
            largeBody: '◈ SYSTEM WEEKLY REVIEW ◈\n\nIt is time to assess your growth.\n\n1. Review your completed quests.\n2. Analyze your failed habits.\n3. Adjust your stats allocation.\n4. Set a primary objective for the coming week.\n\nGrowth requires reflection. Open the app now.',
            largeIcon: LARGE_ICON,
            schedule: { on: { weekday: 1, hour: 20, minute: 0 }, repeats: true },
            smallIcon: SMALL_ICON
          }
        ]
      });
    } catch {}
  }

  async cancelAll(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.cancel({
        notifications: Object.values(LocalNotificationsService.IDS).map(id => ({ id }))
      });
    } catch {}
  }

  async scheduleAlarm(hour: number, minute: number, label: string, days: boolean[]): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      // Cancel ALL 7 existing user-alarm slots first (previously only slot 0 was
      // cancelled, leaving stale alarms scheduled on days the user de-selected).
      await this.cancelAlarm();

      // We schedule 7 separate daily notifications, one per active day of the week.
      // Weekday: 1=Sunday, 2=Monday, ..., 7=Saturday (Capacitor convention)
      for (let i = 0; i < 7; i++) {
        if (!days[i]) continue;
        const id = LocalNotificationsService.IDS.alarm + i;
        await LocalNotifications.schedule({
          notifications: [{
            id,
            channelId: LocalNotificationsService.CH.alarms,
            title: `⚡ ${label}`,
            body: 'Hunter, your wake alarm is ringing. Arise.',
            largeBody: `◈ ALARM — ${label} ◈\n\nIt is time. The system is watching.\n\n1. Get out of bed immediately.\n2. Execute your morning protocol.\n3. Do not waste this moment.`,
            largeIcon: LARGE_ICON,
            smallIcon: SMALL_ICON,
            schedule: {
              on: { weekday: i + 1, hour, minute },
              allowWhileIdle: true,
              repeats: true,
            },
          }],
        });
      }
    } catch (e) {
      console.error('scheduleAlarm error', e);
    }
  }

  async cancelAlarm(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const ids = Array.from({ length: 7 }, (_, i) => ({ id: LocalNotificationsService.IDS.alarm + i }));
      await LocalNotifications.cancel({ notifications: ids });
    } catch {}
  }

  async scheduleTimer(minutes: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const id = 300 + minutes;
      if (this.activeTimerId !== null) {
        await LocalNotifications.cancel({ notifications: [{ id: this.activeTimerId }] });
      }
      this.activeTimerId = id;
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            channelId: LocalNotificationsService.CH.alarms,
            title: '✅ FOCUS BLOCK COMPLETE',
            body: `${minutes}-minute session done. Take a break.`,
            largeBody: `Hunter,\n\nYou have successfully completed a ${minutes}-minute focus block.\n\n◈ Consistency is the key to leveling up.\n◈ Your mental stamina has increased.\n\nTake a moment to recover before your next quest.`,
            largeIcon: LARGE_ICON,
            smallIcon: SMALL_ICON,
            schedule: { at: new Date(Date.now() + minutes * 60000), allowWhileIdle: true },
          }
        ]
      });
    } catch {}
  }

  async triggerHpWarning(currentHp: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    if (this.hpWarningCooldown) return;
    this.hpWarningCooldown = true;
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: 2,
          channelId: LocalNotificationsService.CH.game,
          title: '⚠ CRITICAL: HP BELOW 40',
          body: `HP is at ${currentHp}. Complete quests now or face demotion.`,
          largeBody: `◈ CRITICAL WARNING ◈\n\nYour HP has dropped to a dangerous level (${currentHp} HP).\n\nIf your HP reaches 0, you will face severe penalties and stat reduction.\n\nImmediate Action Required:\n1. Open the system.\n2. Complete pending daily quests.\n3. Restore your health before midnight.\n\nDo not fail.`,
          largeIcon: LARGE_ICON,
          schedule: { at: new Date(Date.now() + 500) },
          smallIcon: SMALL_ICON
        }]
      });
      setTimeout(() => { this.hpWarningCooldown = false; }, 3600000);
    } catch {}
  }

  async triggerGameEvent(title: string, body: string, id: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id,
          channelId: LocalNotificationsService.CH.game,
          title,
          body,
          schedule: { at: new Date(Date.now() + 500) },
          smallIcon: SMALL_ICON
        }]
      });
    } catch {}
  }

  async scheduleHabits(habits: Habit[]): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const existing = await LocalNotifications.getPending();
      const toCancel = existing.notifications
        .filter(n => n.id >= LocalNotificationsService.HABIT_ID_BASE && n.id < LocalNotificationsService.HABIT_ID_BASE + 100000)
        .map(n => ({ id: n.id }));
      if (toCancel.length) await LocalNotifications.cancel({ notifications: toCancel });

      const scheduled = habits
        .filter(h => !h.archived && h.cueTime && h.cueTime.match(/^\d{2}:\d{2}$/))
        .slice(0, 5)
        .map(h => {
          const [hh, mm] = h.cueTime!.split(':').map(n => +n);
          return {
            id: LocalNotificationsService.HABIT_ID_BASE + h.id,
            title: `◈ HABIT CUE — ${h.name}`,
            body: h.cue ? `${h.cue} · Streak: ${h.currentStreak} 🔥` : `Time for your habit. Streak: ${h.currentStreak} 🔥`,
            schedule: { on: { hour: hh, minute: mm }, allowWhileIdle: true, repeats: true },
            smallIcon: SMALL_ICON,
            largeIcon: LARGE_ICON,
            channelId: LocalNotificationsService.CH.reminders,
            actionTypeId: LocalNotificationsService.HABIT_ACTION_TYPE,
          };
        });
      if (scheduled.length) await LocalNotifications.schedule({ notifications: scheduled });
    } catch {}
  }
}
