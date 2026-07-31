import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemBroadcastService, SystemBroadcast } from '../../../core/services/system-broadcast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-system-broadcast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="broadcast-overlay" *ngIf="broadcastService.activeBroadcast() as b" [class]="b.type.toLowerCase()">
      <div class="glitch-container">
        <h1 class="mono glitch" [attr.data-text]="b.title">{{ b.title }}</h1>
        <p class="tech typing-effect">{{ b.message }}</p>
      </div>
    </div>
  `,
  styleUrls: ['./system-broadcast.component.scss']
})
export class SystemBroadcastComponent {
  constructor(public broadcastService: SystemBroadcastService) {}
}

