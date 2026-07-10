import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BiometricService } from '../../core/services/biometric.service';

/**
 * Full-screen biometric lock overlay.
 * Shown when the app resumes from background and biometric re-auth is required.
 * Dismissed automatically on successful authentication.
 */
@Component({
  selector: 'app-biometric-lock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './biometric-lock.component.html',
  styleUrls: ['./biometric-lock.component.scss'],
})
export class BiometricLockComponent implements OnInit {
  private biometric = inject(BiometricService);

  authenticating = signal(false);
  failed = signal(false);

  ngOnInit(): void {
    // Auto-trigger on mount
    this.authenticate();
  }

  async authenticate(): Promise<void> {
    this.authenticating.set(true);
    this.failed.set(false);
    const success = await this.biometric.authenticate();
    this.authenticating.set(false);
    if (!success) {
      this.failed.set(true);
    }
  }
}
