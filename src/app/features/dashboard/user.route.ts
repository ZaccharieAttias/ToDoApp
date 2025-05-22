import { Routes } from '@angular/router';
import { TaskGuard } from '../../guards/task.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard.component').then((m) => m.DashboardComponent),
    title: 'Tableau de bord',
  },
  {
    path: 'tasks',
    loadChildren: () => import('../tasks/tasks.route').then((m) => m.routes),
    canActivate: [TaskGuard],
    title: 'Tâches',
  },
];
