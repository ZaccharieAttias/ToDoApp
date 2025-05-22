import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { NoAuthGuard } from './guards/no-auth.guard';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { UserNameResolver } from './resolvers/user-name.resolver';
import { UserComponent } from './features/dashboard/user/user.component';
import { routes as userRoutes } from './features/dashboard/user.route';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
    title: 'Accueil',
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth.component').then((m) => m.AuthComponent),
    canActivate: [NoAuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(
            (m) => m.LoginComponent
          ),
        title: 'Connexion',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(
            (m) => m.RegisterComponent
          ),
        title: 'Inscription',
      },
    ],
    title: 'Authentification',
  },
  // {
  //   path: 'tasks',
  //   loadComponent: () =>
  //     import('./features/tasks/tasks.component').then((m) => m.TasksComponent),
  //   canActivate: [AuthGuard],
  // },
  {
    path: ':userName',
    component: UserComponent,
    children: userRoutes,
    canActivate: [AuthGuard],
    resolve: {
      userName: UserNameResolver,
    },
    title: 'Profil utilisateur',
  },
  // {
  //   path: 'dashboard',
  //   component: DashboardComponent,
  //   canActivate: [AuthGuard],
  //   title: 'Tableau de bord',
  // },
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Page non trouvée',
  },
];
