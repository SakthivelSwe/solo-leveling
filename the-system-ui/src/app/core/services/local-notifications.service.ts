import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions, PermissionStatus, Channel } from '@capacitor/local-notifications';
import { Habit } from '../models/models';

@Injectable({ providedIn: 'root' })
export class LocalNotificationsService {
  private router = inject(Router);

  /** Static IDs */
  private static readonly IDS = {
    midnight: 1,
    wake: 10,
    lunch: 11,
    evening: 12,
    sleep: 13,
    weeklyReview: 14,
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
      await LocalNotifications.createChannel({
        id: 'system-alarms',
        name: 'System Alarms',
        importance: 5,
        sound: 'default',
        vibration: true,
        lights: true
      });
      await LocalNotifications.createChannel({
        id: 'game-events',
        name: 'Game Events',
        importance: 4,
        sound: 'default',
        vibration: true
      });
      await LocalNotifications.createChannel({
        id: 'reminders',
        name: 'Daily Reminders',
        importance: 3,
        vibration: false
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
        notifications: [{ id: LocalNotificationsService.IDS.midnight }, { id: LocalNotificationsService.IDS.wake }, { id: LocalNotificationsService.IDS.sleep }]
      });
      await LocalNotifications.schedule({
        notifications: [
          {
            id: LocalNotificationsService.IDS.midnight,
            channelId: 'system-alarms',
            title: '⚡ SYSTEM ALERT: Midnight Reset',
            body: 'A new day begins. Quests reset. Arise, Hunter.',
            schedule: { on: { hour: 0, minute: 0 }, allowWhileIdle: true, repeats: true },
            smallIcon: 'ic_launcher'
          },
          {
            id: LocalNotificationsService.IDS.wake,
            channelId: 'system-alarms',
            title: '⚡ WAKE PROTOCOL INITIATED',
            body: 'Cold shower. Sunlight. Eggs. Begin.',
            schedule: { on: { hour: 8, minute: 0 }, allowWhileIdle: true, repeats: true },
            smallIcon: 'ic_launcher'
          },
          {
            id: LocalNotificationsService.IDS.sleep,
            channelId: 'system-alarms',
            title: '⚡ SLEEP PROTOCOL',
            body: 'Phone down. Sleep before 11:30. System watching.',
            schedule: { on: { hour: 23, minute: 0 }, allowWhileIdle: true, repeats: true },
            smallIcon: 'ic_launcher'
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
            channelId: 'reminders',
            title: 'FUEL REQUIRED',
            body: 'Proper lunch. No junk. Zinc included.',
            schedule: { on: { hour: 13, minute: 0 }, repeats: true },
            smallIcon: 'ic_launcher'
          },
          {
            id: LocalNotificationsService.IDS.evening,
            channelId: 'reminders',
            title: 'QUESTS REMAINING',
            body: 'Check your incomplete quests. Evening window closing.',
            schedule: { on: { hour: 21, minute: 0 }, repeats: true },
            smallIcon: 'ic_launcher'
          },
          {
            id: LocalNotificationsService.IDS.weeklyReview,
            channelId: 'reminders',
            title: '📊 WEEKLY REVIEW',
            body: 'Open the system. Review your week. Set next target.',
            schedule: { on: { weekday: 1, hour: 20, minute: 0 }, repeats: true },
            smallIcon: 'ic_launcher'
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
            channelId: 'system-alarms',
            title: '✅ FOCUS BLOCK COMPLETE',
            body: `${minutes}-minute session done. Take a break.`,
            schedule: { at: new Date(Date.now() + minutes * 60000), allowWhileIdle: true },
            smallIcon: 'ic_launcher'
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
          channelId: 'game-events',
          title: '⚠ CRITICAL: HP BELOW 40',
          body: `HP is at ${currentHp}. Complete quests now or face demotion.`,
          schedule: { at: new Date(Date.now() + 500) },
          smallIcon: 'ic_launcher'
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
          channelId: 'game-events',
          title,
          body,
          schedule: { at: new Date(Date.now() + 500) },
          smallIcon: 'ic_launcher'
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
            smallIcon: 'ic_launcher',
            channelId: 'reminders',
            actionTypeId: LocalNotificationsService.HABIT_ACTION_TYPE,
          };
        });
      if (scheduled.length) await LocalNotifications.schedule({ notifications: scheduled });
    } catch {}
  }
}
