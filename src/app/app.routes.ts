import { Routes } from '@angular/router';
import { AppService } from './app.service';

export const routes: Routes = [
  {
    path: 'analytics',
    providers: [AppService],
    loadComponent: () =>
      import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent),
  },
  {
    path: 'players',
    providers: [AppService],
    loadComponent: () =>
      import('./pages/players/players.component').then(m => m.PlayersComponent),
  },
];
