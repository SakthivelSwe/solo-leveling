import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Onboarding Guard — redirects new users to /onboarding if they haven't
 * completed the initial assessment yet.
 *
 * Only applies to the /system route. All other routes (habits, nofap, etc.)
 * are accessible without completing onboarding for existing users.
 *
 * Existing users: onboardingComplete = true (DB default) → pass through immediately.
 * New users:      onboardingComplete = false (set in AuthService.register()) → redirect.
 */
export const onboardingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const player = auth.player();

  // Not logged in → authGuard handles this
  if (!player) return true;

  // onboardingComplete is true for all existing users (safe default)
  // It's only false for brand-new registrations
  if (player.onboardingComplete === false) {
    router.navigate(['/onboarding']);
    return false;
  }

  return true;
};
