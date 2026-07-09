import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

const SYSTEM_PROMPTS = [
  'YOU HAVE BEEN DETECTED BY THE SYSTEM.',
  'HUNTER QUALIFICATION VERIFIED.',
  'E-RANK STATUS ASSIGNED.',
  'INITIATING LIFE OS PROTOCOL...',
  'ENTER YOUR CREDENTIALS TO BEGIN THE HUNT.',
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./auth.shared.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = signal(false);
  error = signal<string | null>(null);
  typedText = signal('');
  promptIdx = 0;
  charIdx = 0;
  private timer: any;

  ngOnInit(): void { this.typeNext(); }
  ngOnDestroy(): void { clearTimeout(this.timer); }

  /** True when a field is invalid and the user has interacted with it. */
  invalid(name: 'username' | 'password'): boolean {
    const c = this.form.get(name)!;
    return c.invalid && (c.touched || c.dirty);
  }

  private typeNext(): void {
    const msg = SYSTEM_PROMPTS[this.promptIdx];
    if (this.charIdx <= msg.length) {
      this.typedText.set(msg.slice(0, this.charIdx++));
      this.timer = setTimeout(() => this.typeNext(), 45);
    } else {
      this.timer = setTimeout(() => {
        this.promptIdx = (this.promptIdx + 1) % SYSTEM_PROMPTS.length;
        this.charIdx = 0;
        this.typeNext();
      }, 2400);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('CREDENTIALS REQUIRED — THE SYSTEM DOES NOT WAIT.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { username, password } = this.form.getRawValue();
    this.auth.login({ username: username!, password: password! }).subscribe({
      next: () => this.router.navigate(['/system']),
      error: (e) => {
        this.error.set(e?.error?.message ?? 'AUTHENTICATION FAILED. TRY AGAIN, HUNTER.');
        this.loading.set(false);
      },
    });
  }
}




