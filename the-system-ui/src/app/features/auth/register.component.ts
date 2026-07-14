import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./auth.shared.scss'],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    displayName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = signal(false);
  error = signal<string | null>(null);
  /** Toggles password field between text and password type */
  showPassword = signal(false);

  invalid(name: 'username' | 'email' | 'password'): boolean {
    const c = this.form.get(name)!;
    return c.invalid && (c.touched || c.dirty);
  }

  /** Simple password strength for the visual meter: 0 weak · 1 fair · 2 strong. */
  passwordStrength(): { level: number; label: string } {
    const v = this.form.get('password')?.value ?? '';
    let score = 0;
    if (v.length >= 6) score++;
    if (v.length >= 10 && /[A-Z]/.test(v) && /[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v) && v.length >= 10) score++;
    const level = Math.min(2, score);
    return { level, label: ['WEAK', 'FAIR', 'STRONG'][level] };
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('All fields are required to awaken.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    // Store username lowercase — case-insensitive Hunter ID
    const username = raw.username!.trim().toLowerCase();
    this.auth.register({
      username,
      email: raw.email!,
      password: raw.password!,
      displayName: raw.displayName || username,
    }).subscribe({
      next: () => this.router.navigate(['/system']),
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Awakening failed.');
        this.loading.set(false);
      },
    });
  }
}

