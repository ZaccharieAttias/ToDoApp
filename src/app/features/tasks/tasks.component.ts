import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';
import { TaskListComponent } from './task-list/task-list.component';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectAllTasks } from '../../state/tasks/selectors/tasks.selectors';
import { Observable, of } from 'rxjs';
import { deleteTask, loadTasks } from '../../state/tasks/actions/tasks.actions';
import { AppState } from '../../state/tasks/state/app.state';
@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, TaskListComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
})
export class TasksComponent implements OnInit {
  taskToEdit: Task | null = null;
  showForm = false;
  tasks$: Observable<Task[]>;
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private store: Store<AppState>
  ) {
    if (this.authService.isLoggedIn()) {
      this.tasks$ = this.store.select(selectAllTasks);
    } else {
      this.tasks$ = of([]);
    }
  }

  ngOnInit() {
    this.store.dispatch(loadTasks());
  }

  onEditTask(task: Task) {
    this.router.navigate(['edit', task.id], { relativeTo: this.route });
  }

  onDeleteTask(taskId: string) {
    this.store.dispatch(deleteTask({ taskId }));
  }

  onNewTask() {
    this.router.navigate(['new'], { relativeTo: this.route });
  }
}
