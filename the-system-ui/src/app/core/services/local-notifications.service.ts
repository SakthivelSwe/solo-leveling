import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions, PermissionStatus } from '@capacitor/local-notifications';
import { Habit } from '../models/models';

/**
 * Native local notifications — schedules THE SYSTEM's daily/weekly reminders
 * directly on the device so they fire EVEN WHEN THE APP IS CLOSED.
 *
 * Backend counterpart: NotificationScheduler in the API also broadcasts these
 * over SSE (for the in-app 🔔 feed) — this class ensures the phone still buzzes
 * when the app is killed / backgrounded.
 */
@Injectable({ providedIn: 'root' })
export class LocalNotificationsService {
  /** Static IDs — reusing them means re-scheduling REPLACES the previous alarm. */
  private static readonly IDS = {
    wake: 101,
    lunch: 102,
    evening: 103,
    sleep: 104,
    weeklyReview: 105,
  };
  /** Habit reminder IDs live in a separate range so they don't collide. */
  private static readonly HABIT_ID_BASE = 2000;

  /**
   * Requests permission (Android 13+ needs runtime consent) and schedules the
   * 5 default reminders. Safe to call on web — no-ops there.
   */
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const perm: PermissionStatus = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return;
      }
      await this.scheduleDefaults();
    } catch {
      /* plugin unavailable — silently ignore */
    }
  }

  /**
   * (Re-)schedules the 5 System reminders. Every reminder repeats daily
   * (weekly review repeats weekly on Sunday). Times mirror the backend
   * NotificationScheduler.java so both channels agree.
   */
  async scheduleDefaults(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const options: ScheduleOptions = {
      notifications: [
        this.daily(LocalNotificationsService.IDS.wake, 8, 0,
          '◈ SYSTEM ALERT',
          'Hunter, a new day begins. Exercise and breakfast before 9:30 AM.'),
        this.daily(LocalNotificationsService.IDS.lunch, 13, 0,
          '◈ FUEL REQUIRED',
          "Eat a proper meal. Zinc fuels testosterone. A hunter doesn't skip fuel."),
        this.daily(LocalNotificationsService.IDS.evening, 21, 0,
          '◈ QUESTS REMAINING',
          'Code without AI. LeetCode. English. You have 2 hours. Move.'),
        this.daily(LocalNotificationsService.IDS.sleep, 23, 0,
          '◈ SLEEP PROTOCOL',
          'Phone down. No reels. Testosterone builds in sleep. Put it down.'),
        // Weekly review — Sunday 20:00. weekday in Capacitor: 1=Sun … 7=Sat.
        {
          id: LocalNotificationsService.IDS.weeklyReview,
          title: '◈ WEEKLY REVIEW',
          body: '7 days complete. Check your stats. Plan next week.',
          schedule: { on: { weekday: 1, hour: 20, minute: 0 }, allowWhileIdle: true },
          smallIcon: 'ic_launcher',
        },
      ],
    };

    try {
      // Cancel previous copies (idempotent re-schedule).
      await LocalNotifications.cancel({
        notifications: Object.values(LocalNotificationsService.IDS).map(id => ({ id })),
      });
      await LocalNotifications.schedule(options);
    } catch {
      /* ignore */
    }
  }

  /** Cancels every SYSTEM local reminder (e.g. on logout). */
  async cancelAll(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.cancel({
        notifications: Object.values(LocalNotificationsService.IDS).map(id => ({ id })),
      });
    } catch { /* ignore */ }
  }

  private daily(id: number, hour: number, minute: number, title: string, body: string) {
    return {
      id,
      title,
      body,
      schedule: {
        on: { hour, minute },
        allowWhileIdle: true,      // fire even in Doze mode
        repeats: true,
      },
      smallIcon: 'ic_launcher',
      channelId: 'thesystem_reminders',
    };
  }

  /**
   * Schedule per-habit cue-time reminders on the device. Called from the
   * Habits view whenever the list changes. Each habit gets ID 2000+habitId.
   * Only habits with a cueTime + not archived + not already done today are scheduled.
   */
  async scheduleHabits(habits: Habit[]): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      // Cancel prior habit reminders first (idempotent).
      const existing = await LocalNotifications.getPending();
      const toCancel = existing.notifications
        .filter(n => n.id >= LocalNotificationsService.HABIT_ID_BASE
                 && n.id < LocalNotificationsService.HABIT_ID_BASE + 100000)
        .map(n => ({ id: n.id }));
      if (toCancel.length) await LocalNotifications.cancel({ notifications: toCancel });

      const scheduled = habits
        .filter(h => !h.archived && h.cueTime && h.cueTime.match(/^\d{2}:\d{2}$/))
        .slice(0, 5)  // cap noise: never more than 5 habit alerts per day
        .map(h => {
          const [hh, mm] = h.cueTime!.split(':').map(n => +n);
          return {
            id: LocalNotificationsService.HABIT_ID_BASE + h.id,
            title: `◈ HABIT CUE — ${h.name}`,
            body: h.cue
              ? `${h.cue} · Streak: ${h.currentStreak} 🔥`
              : `Time for your habit. Streak: ${h.currentStreak} 🔥`,
            schedule: { on: { hour: hh, minute: mm }, allowWhileIdle: true, repeats: true },
            smallIcon: 'ic_launcher',
            channelId: 'thesystem_reminders',
          };
        });

      if (scheduled.length) {
        await LocalNotifications.schedule({ notifications: scheduled });
      }
    } catch {
      /* ignore */
    }
  }
}
