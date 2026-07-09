import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { fadeInUp, listStagger } from '../../shared/animations';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  animations: [fadeInUp, listStagger],
})
export class NotificationsComponent implements OnInit {
  constructor(public notifications: NotificationService) {}

  ngOnInit(): void {
    this.notifications.load().subscribe();
    this.notifications.refreshUnread();
  }

  icon(type: string): string {
    switch (type) {
      case 'RANK_DROP': return '⚠️';
      case 'ACHIEVEMENT': return '🏆';
      case 'REMINDER': return '⏰';
      default: return '◈';
    }
  }
}

