import { Component, OnInit, Output, EventEmitter, signal } from '@angular/core';
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
export class PenaltyZoneComponent implements OnInit {
  @Output() survived = new EventEmitter<void>();

  loading = signal(false);
  /** Set when the API call fails — shows retry UI instead of silently dismissing. */
  hasError = signal(false);
  /** Human-readable error message shown to the user. */
  errorMsg = signal('');

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
    this.hasError.set(false);
    this.errorMsg.set('');

    this.lifeOs.survivePenalty().subscribe({
      next: () => {
        this.loading.set(false);
        this.haptics.success();
        this.survived.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.haptics.warning();
        const msg = err?.error?.message ?? 'Connection failed. Check your network and try again.';
        this.errorMsg.set(msg);
        this.hasError.set(true);
        // Do NOT emit survived — the penalty must be cleared server-side.
        // The user stays in the overlay with a retry button.
      }
    });
  }

  retry() {
    this.hasError.set(false);
    this.survive();
  }
}
