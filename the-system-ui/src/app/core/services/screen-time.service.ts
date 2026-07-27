import { Injectable } from '@angular/core';
import { registerPlugin } from '@capacitor/core';
import { Platform } from '@angular/cdk/platform';

export interface ScreenTimePlugin {
  hasUsagePermission(): Promise<{ granted: boolean }>;
  requestUsagePermission(): Promise<void>;
  startPenaltyEnforcement(options: { blacklistedPackages: string[] }): Promise<void>;
  stopPenaltyEnforcement(): Promise<void>;
  initiateLockdown(): Promise<void>;
}

const ScreenTime = registerPlugin<ScreenTimePlugin>('ScreenTime');

@Injectable({ providedIn: 'root' })
export class ScreenTimeService {
  constructor(private platform: Platform) {}

  async isReady(): Promise<boolean> {
    if (!this.platform.ANDROID) return false;
    try {
      const res = await ScreenTime.hasUsagePermission();
      return res.granted;
    } catch {
      return false;
    }
  }

  async requestPermission(): Promise<void> {
    if (this.platform.ANDROID) {
      await ScreenTime.requestUsagePermission();
    }
  }

  async startEnforcement(packages: string[] = ['com.instagram.android', 'com.zhiliaoapp.musically', 'com.twitter.android']): Promise<void> {
    if (this.platform.ANDROID) {
      const ready = await this.isReady();
      if (ready) {
        await ScreenTime.startPenaltyEnforcement({ blacklistedPackages: packages });
      } else {
        console.warn('Cannot start ScreenTime tracking without Usage Access permission.');
      }
    }
  }

  async stopEnforcement(): Promise<void> {
    if (this.platform.ANDROID) {
      await ScreenTime.stopPenaltyEnforcement();
    }
  }

  async initiateLockdown(): Promise<void> {
    if (this.platform.ANDROID) {
      const ready = await this.isReady();
      if (ready) {
        await ScreenTime.initiateLockdown();
      } else {
        console.warn('Cannot initiate lockdown without Usage Access permission.');
      }
    }
  }
}
