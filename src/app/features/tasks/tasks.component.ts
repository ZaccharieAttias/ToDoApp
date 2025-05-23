import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';
import { TasksService } from '../../services/tasks.service';
import { TaskListComponent } from './task-list/task-list.component';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, TaskListComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  taskToEdit: Task | null = null;
  showForm = false;
  private destroyRef = inject(DestroyRef);

  constructor(
    private tasksService: TasksService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const userId = this.authService.getCurrentUser()?.uid;
    if (userId) {
      const subscription = this.tasksService
        .getTasks()
        .subscribe((tasks: Task[]) => {
          this.tasks = tasks;
        });

      this.destroyRef.onDestroy(() => subscription.unsubscribe());
    }
  }

  onEditTask(task: Task) {
    this.router.navigate(['edit', task.id], { relativeTo: this.route });
  }

  onDeleteTask(taskId: string) {
    this.tasksService.deleteTask(taskId);
  }

  onNewTask() {
    this.router.navigate(['new'], { relativeTo: this.route });
  }
}
