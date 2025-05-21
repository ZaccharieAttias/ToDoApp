import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../models/task.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { TasksService } from '../../../services/tasks.service';
import { AuthService } from '../../../services/auth.service';
import { FilterByStatusPipe } from '../../../shared/pipes/filter-by-status.pipe';
import { CommentService } from '../../../services/comment.service';
import { CommentListComponent } from '../../comments/comment-list/comment-list.component';
import { CommentFormComponent } from '../../comments/comment-form/comment-form.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FilterByStatusPipe,
    CommentListComponent,
    CommentFormComponent,
  ],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
})
export class TaskListComponent implements OnInit {
  @Input() set tasks(value: Task[]) {
    this.tasks$.next(value);
    this.resetExpandedTasks();
  }
  @Output() editRequested = new EventEmitter<Task>();
  @Output() deleteRequested = new EventEmitter<Task>();
  private destroy$ = new Subject<void>();

  private tasks$ = new BehaviorSubject<Task[]>([]);
  searchControl = new FormControl('');
  statusFilter = new FormControl('all');
  filteredTasks$ = new BehaviorSubject<Task[]>([]);
  expandedTasks = new Set<string>();
  taskCommentsCount = new Map<string, number>();

  constructor(
    private tasksService: TasksService,
    private authService: AuthService,
    private commentService: CommentService
  ) {}

  ngOnInit() {
    // Souscription aux changements de recherche
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterTasks();
        this.resetExpandedTasks();
      });

    // Souscription aux changements de filtre de statut
    this.statusFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterTasks();
        this.resetExpandedTasks();
      });

    // Souscription aux changements de tâches
    this.tasks$.pipe(takeUntil(this.destroy$)).subscribe((tasks) => {
      this.filterTasks();
      this.resetExpandedTasks();
    });

    // Chargement initial des commentaires
    this.loadCommentsCount();
  }

  private resetExpandedTasks(): void {
    this.expandedTasks.clear();
  }

  private filterTasks(): void {
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    const statusFilter = this.statusFilter.value || 'all';

    this.tasks$.pipe(takeUntil(this.destroy$)).subscribe((tasks) => {
      const filtered = tasks.filter((task) => {
        const matchesSearch =
          task.title.toLowerCase().includes(searchTerm) ||
          task.description.toLowerCase().includes(searchTerm) ||
          task.tags?.some((tag) => tag.toLowerCase().includes(searchTerm));

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'completed' && task.status) ||
          (statusFilter === 'pending' && !task.status);

        return matchesSearch && matchesStatus;
      });

      this.filteredTasks$.next(filtered);
    });
  }

  private loadCommentsCount(): void {
    this.commentService
      .getCommentsUpdates('')
      .pipe(takeUntil(this.destroy$))
      .subscribe((comments) => {
        const countMap = new Map<string, number>();
        comments.forEach((comment) => {
          const currentCount = countMap.get(comment.taskId) || 0;
          countMap.set(comment.taskId, currentCount + 1);
        });
        this.taskCommentsCount = countMap;
      });
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  isTaskExpanded(taskId: string): boolean {
    return this.expandedTasks.has(taskId);
  }

  toggleTaskExpansion(taskId: string): void {
    if (this.expandedTasks.has(taskId)) {
      this.expandedTasks.delete(taskId);
    } else {
      this.expandedTasks.add(taskId);
    }
  }

  updateCommentsCount(taskId: string): void {
    this.commentService
      .getCommentsFromTask(taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((comments) => {
        this.taskCommentsCount.set(taskId, comments.length);
      });
  }

  onEdit(task: Task): void {
    console.log('Edit requested for task:', task);
    this.editRequested.emit(task);
    this.resetExpandedTasks();
  }

  onDelete(task: Task): void {
    console.log('Delete requested for task:', task);
    this.deleteRequested.emit(task);
    this.resetExpandedTasks();
  }
}
