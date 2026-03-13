import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'suspect/:id',
    loadComponent: () =>
      import('./features/suspect-deep-intel/suspect-deep-intel.component').then(
        (m) => m.SuspectDeepIntelComponent,
      ),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
