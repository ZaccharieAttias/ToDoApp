import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';
import { TasksService } from '../../services/tasks.service';
import { TaskFormComponent } from './task-form/task-form.component';
import { TaskListComponent } from './task-list/task-list.component';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
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
  private commentService = inject(CommentService);
  tasks: Task[] = [];
  taskToEdit: Task | null = null;
  private destroy$ = new Subject<void>();

  ngOnInit() {
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
    console.log('Task received in parent:', task);
    if (this.taskToEdit) {
      console.log('Updating existing task');
      this.tasksService.updateTask(task);
    } else {
      console.log('Adding new task');
      this.tasksService.addTask(task);
    }
    this.taskToEdit = null;
  }

  onEditTask(task: Task) {
    this.taskToEdit = task;
  }

  onDeleteTask(taskId: string) {
    this.tasksService.deleteTask(taskId);
  }

  onCancelEdit() {
    this.taskToEdit = null;
  }
}
