import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'system' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'system',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/system/system.component').then(m => m.SystemComponent),
  },
  {
    path: 'achievements',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/achievements/achievements.component').then(m => m.AchievementsComponent),
  },
  {
    path: 'life',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/life-os/life-os.component').then(m => m.LifeOsComponent),
  },
  {
    path: 'physical',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/physical/physical-tracking.component').then(m => m.PhysicalTrackingComponent),
  },
  {
    path: 'stats',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/stats/statistics.component').then(m => m.StatisticsComponent),
  },
  {
    path: 'habits',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/habits/habits.component').then(m => m.HabitsComponent),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
  },
  {
    path: 'ai',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/ai-mentor/ai-mentor.component').then(m => m.AiMentorComponent),
  },
  {
    path: 'insights',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/progress/progress-report.component').then(m => m.ProgressReportComponent),
  },
  {
    path: 'guide',
    loadComponent: () =>
      import('./features/guide/system-guide.component').then(m => m.SystemGuideComponent),
  },
  { path: '**', redirectTo: 'system' },
];
