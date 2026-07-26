import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LifeOsService } from '../../../core/services/life-os.service';
import { HapticsService } from '../../../core/services/haptics.service';

@Component({
  selector: 'app-penalty-zone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './penalty-zone.component.html',
  styleUrls: ['./penalty-zone.component.scss'],
})
export class PenaltyZoneComponent {
  @Output() survived = new EventEmitter<void>();

  loading = signal(false);

  constructor(
    private lifeOs: LifeOsService,
    private haptics: HapticsService
  ) {}

  ngOnInit() {
    this.haptics.streak(); // Trigger aggressive haptics on load
  }

  survive() {
    if (this.loading()) return;
    this.loading.set(true);
    
    this.lifeOs.survivePenalty().subscribe({
      next: () => {
        this.loading.set(false);
        this.haptics.success();
        this.survived.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.haptics.warning();
        console.error('Failed to survive penalty', err);
        // Fallback emit if offline or error to not hard-lock user forever
        this.survived.emit();
      }
    });
  }
}
