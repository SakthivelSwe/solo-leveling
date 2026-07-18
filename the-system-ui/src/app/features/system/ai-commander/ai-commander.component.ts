import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiCommanderService } from '../../../core/services/ai-commander.service';
import { AiCommanderBriefing } from '../../../core/models/models';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-ai-commander',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-commander.component.html',
  styleUrls: ['./ai-commander.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class AiCommanderComponent implements OnInit {
  private aiService = inject(AiCommanderService);
  
  briefing: AiCommanderBriefing | null = null;
  loading = true;
  error: string | null = null;
  isOpen = false;

  ngOnInit(): void {
    // We can auto-fetch or wait for user to open it.
    // Given it's a morning briefing, maybe auto-fetch on init.
    this.fetchBriefing();
  }

  fetchBriefing(): void {
    this.loading = true;
    this.error = null;
    this.aiService.getMorningBriefing().subscribe({
      next: (data) => {
        this.briefing = data;
        this.loading = false;
        // Auto-open if we successfully got a briefing
        this.isOpen = true;
      },
      error: (err) => {
        console.error('Failed to load morning briefing', err);
        this.error = 'Failed to load Commander Briefing. The System API might be down.';
        this.loading = false;
      }
    });
  }

  close(): void {
    this.isOpen = false;
  }
}
