import { registerPlugin } from '@capacitor/core';

/**
 * Bridge to the native `SystemAlarm` plugin (android/app/src/main/java/com/thesystem/app/SystemAlarmPlugin.java).
 *
 * This is the REAL alarm — it plays a user-selected local MP3 at alarm volume,
 * vibrates and shows a full-screen ringing screen over the lock screen, even
 * when the app is closed. On web / iOS every method is a harmless no-op.
 */
export interface SystemAlarmConfig {
  enabled: boolean;
  hour: number;
  minute: number;
  /** 7 booleans, index 0 = Sunday … 6 = Saturday. */
  days: boolean[];
  label: string;
  soundUri: string;
  soundName: string;
  vibrate: boolean;
  snoozeMinutes: number;
}

export interface SystemAlarmPlugin {
  /** Opens the system file picker so the user chooses a local audio file. */
  pickSound(): Promise<{ uri: string; name: string }>;
  setAlarm(options: {
    hour: number;
    minute: number;
    days: boolean[];
    label: string;
    soundUri?: string;
    soundName?: string;
    vibrate?: boolean;
    snoozeMinutes?: number;
  }): Promise<{ scheduled: boolean }>;
  cancelAlarm(): Promise<void>;
  getAlarm(): Promise<SystemAlarmConfig>;
  dismiss(): Promise<void>;
  /** Android 14+ can block full-screen alarm intents until the user allows it. */
  canUseFullScreenIntent(): Promise<{ allowed: boolean }>;
  openFullScreenIntentSettings(): Promise<void>;
}

export const SystemAlarm = registerPlugin<SystemAlarmPlugin>('SystemAlarm');

