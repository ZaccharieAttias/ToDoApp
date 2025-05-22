import { Routes } from '@angular/router';
import { TasksComponent } from './tasks.component';
import { TaskGuard } from '../../guards/task.guard';
import {
  TaskFormComponent,
  canLeaveEditPage,
} from './task-form/task-form.component';

export const routes: Routes = [
  {
    path: '',
    component: TasksComponent,
    canActivate: [TaskGuard],
  },
  {
    path: 'new',
    component: TaskFormComponent,
    data: { mode: 'new' },
    canActivate: [TaskGuard],
    canDeactivate: [canLeaveEditPage],
  },
  {
    path: 'edit/:id',
    component: TaskFormComponent,
    data: { mode: 'edit' },
    canActivate: [TaskGuard],
    canDeactivate: [canLeaveEditPage],
  },
];
