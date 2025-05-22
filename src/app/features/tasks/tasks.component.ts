import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';
import { TasksService } from '../../services/tasks.service';
import { TaskFormComponent } from './task-form/task-form.component';
import { TaskListComponent } from './task-list/task-list.component';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommentService } from '../../services/comment.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, TaskFormComponent, TaskListComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
})
export class TasksComponent implements OnInit, OnDestroy {
  private tasksService = inject(TasksService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private commentService = inject(CommentService);

  tasks: Task[] = [];
  taskToEdit: Task | null = null;
  showForm = false;
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // Gérer les paramètres de route
    this.route.data.subscribe((data) => {
      if (data['mode'] === 'new') {
        this.showForm = true;
        this.taskToEdit = null;
      }
    });

    this.route.params.subscribe((params) => {
      if (params['id']) {
        const taskId = params['id'];
        this.tasksService.getTaskById(taskId).subscribe((task) => {
          if (task) {
            this.taskToEdit = task;
            this.showForm = true;
          }
        });
      }
    });

    // Charger les tâches
    const userId = this.authService.getCurrentUser()?.id;
    if (userId) {
      this.tasksService
        .getUserTasks(userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((tasks: Task[]) => {
          this.tasks = tasks;
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTaskSaved(task: Task) {
    if (this.taskToEdit) {
      this.tasksService.updateTask(task);
    } else {
      this.tasksService.addTask(task);
    }
    // Navigation vers la liste des tâches
    if (this.taskToEdit) {
      console.log('a ete creee');
      this.router.navigate(['../../'], { relativeTo: this.route });
    } else {
      this.router.navigate(['../'], { relativeTo: this.route });
    }
    this.taskToEdit = null;
    this.showForm = false;
  }

  onEditTask(task: Task) {
    this.router.navigate(['edit', task.id], { relativeTo: this.route });
  }

  onDeleteTask(taskId: string) {
    this.tasksService.deleteTask(taskId);
  }

  onCancelEdit() {
    if (this.taskToEdit) {
      this.router.navigate(['../../'], { relativeTo: this.route });
    } else {
      this.router.navigate(['../'], { relativeTo: this.route });
    }
    this.taskToEdit = null;
    this.showForm = false;
  }

  onNewTask() {
    this.router.navigate(['new'], { relativeTo: this.route });
  }
}
