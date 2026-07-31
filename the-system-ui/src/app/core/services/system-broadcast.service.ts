import { Injectable, signal } from '@angular/core';

export interface SystemBroadcast {
  title: string;
  message: string;
  type: 'LEVEL_UP' | 'WARNING' | 'REWARD' | 'INFO';
  durationMs?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SystemBroadcastService {
  activeBroadcast = signal<SystemBroadcast | null>(null);

  broadcast(broadcast: SystemBroadcast) {
    this.activeBroadcast.set(broadcast);
    const duration = broadcast.durationMs || 5000;
    setTimeout(() => {
      this.clear();
    }, duration);
  }

  clear() {
    this.activeBroadcast.set(null);
  }
}
