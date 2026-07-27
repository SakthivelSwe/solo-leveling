import { Injectable, signal } from '@angular/core';
import { Health } from '@capgo/capacitor-health';
import { Platform } from '@angular/cdk/platform';

@Injectable({ providedIn: 'root' })
export class HealthService {
  isAvailable = signal(false);
  isAuthorized = signal(false);
  isChecking = signal(false);

  constructor(private platform: Platform) {}

  async checkAvailability(): Promise<boolean> {
    // Only attempt on mobile/native platform
    if (this.platform.ANDROID || this.platform.IOS) {
      this.isChecking.set(true);
      try {
        await Health.requestAuthorization({ read: ['steps', 'distance'] });
        this.isAvailable.set(true);
        this.isAuthorized.set(true);
        this.isChecking.set(false);
        return true;
      } catch (e) {
        console.warn('Health Connect not available or denied:', e);
        this.isAvailable.set(false);
        this.isAuthorized.set(false);
        this.isChecking.set(false);
        return false;
      }
    }
    return false;
  }

  async syncToday(): Promise<{ steps: number, distance: number }> {
    if (!this.isAuthorized()) return { steps: 0, distance: 0 };
    
    try {
      const now = new Date();
      const startOfDay = new Date(now.getTime());
      startOfDay.setHours(0, 0, 0, 0);

      const queryOpts = {
        startDate: startOfDay.toISOString(),
        endDate: now.toISOString(),
      };

      const stepsResult = await Health.queryAggregated({ 
        dataType: 'steps',
        ...queryOpts,
        bucket: 'day',
        aggregation: 'sum' 
      });

      const distResult = await Health.queryAggregated({ 
        dataType: 'distance',
        ...queryOpts,
        bucket: 'day',
        aggregation: 'sum' 
      });

      let totalSteps = 0;
      let totalDistance = 0; // in meters

      if (stepsResult && stepsResult.samples && stepsResult.samples.length > 0) {
         totalSteps = stepsResult.samples.reduce((acc, sample) => acc + sample.value, 0);
      }
      
      if (distResult && distResult.samples && distResult.samples.length > 0) {
         totalDistance = distResult.samples.reduce((acc, sample) => acc + sample.value, 0);
      }

      return { steps: totalSteps, distance: totalDistance / 1000 }; // distance in KM
    } catch (e) {
      console.error('Failed to sync health data', e);
      return { steps: 0, distance: 0 };
    }
  }
}
