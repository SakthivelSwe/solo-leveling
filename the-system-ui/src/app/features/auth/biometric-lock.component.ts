import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BiometricService } from '../../core/services/biometric.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * Full-screen biometric lock overlay.
 * Shown when the app resumes from background and biometric re-auth is required.
 * Dismissed automatically on successful authentication.
 * Falls back to password login if biometric fails or user prefers it.
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
  private auth      = inject(AuthService);
  private router    = inject(Router);

  authenticating = signal(false);
  failed = signal(false);

  ngOnInit(): void {
    // Component acts as a manual fallback screen. NativeService handles the auto-prompt.
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

  /** Bypass biometric — disable it, unlock, and show the full login form instead. */
  usePassword(): void {
    this.biometric.setBiometricEnabled(false);
    this.auth.logout();
  }
}
