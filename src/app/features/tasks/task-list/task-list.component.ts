import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../models/task.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import {
  BehaviorSubject,
  Observable,
  Subject,
  takeUntil,
  combineLatest,
} from 'rxjs';
import { FilterByStatusPipe } from '../../../shared/pipes/filter-by-status.pipe';
import { CommentService } from '../../../services/comment.service';
import { CommentListComponent } from '../../comments/comment-list/comment-list.component';
import { CommentFormComponent } from '../../comments/comment-form/comment-form.component';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { MentionPipe } from '../../../shared/pipes/mention.pipe';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FilterByStatusPipe,
    CommentListComponent,
    CommentFormComponent,
    MentionPipe,
  ],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
})
export class TaskListComponent implements OnInit {
  @Input() set tasks(value: Task[]) {
    this.originalTasks$.next(value);
    this.filterTasks();
    this.resetExpandedTasks();
  }
  @Output() editRequested = new EventEmitter<Task>();
  @Output() deleteRequested = new EventEmitter<Task>();

  private originalTasks$ = new BehaviorSubject<Task[]>([]);
  private tasks$ = new BehaviorSubject<Task[]>([]);
  private destroy$ = new Subject<void>();
  taskCommentsCount = new Map<string, number>();
  currentUserId: string | undefined;
  users: User[] = [];
  userDisplayNames: string[] = [];
  searchControl = new FormControl('');
  statusFilter = new FormControl('all');
  expandedTasks = new Set<string>();

  get currentTasks(): Observable<Task[]> {
    return this.tasks$.asObservable();
  }

  get currentStatus(): string {
    return this.statusFilter.value || 'all';
  }

  constructor(
    private commentService: CommentService,
    private authService: AuthService
  ) {
    this.currentUserId = this.authService.getCurrentUser()?.uid;
    this.authService.getUsers().subscribe((users) => {
      this.users = users;
    });
  }

  ngOnInit() {
    combineLatest([
      this.searchControl.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        startWith('')
      ),
      this.statusFilter.valueChanges.pipe(startWith('all')),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterTasks();
      });

    this.loadCommentsCount();
    this.authService.getUsers().subscribe((users) => {
      this.userDisplayNames = users.map((u) => u.displayName);
    });
  }

  private resetExpandedTasks(): void {
    this.expandedTasks.clear();
  }

  private filterTasks(): void {
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    const currentTasks = this.originalTasks$.getValue();

    const filtered = currentTasks.filter((task) => {
      return (
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm) ||
        task.tags?.some((tag) => tag.toLowerCase().includes(searchTerm))
      );
    });

    this.tasks$.next(filtered);
    this.resetExpandedTasks();
  }

  private loadCommentsCount(): void {
    this.tasks$.pipe(takeUntil(this.destroy$)).subscribe((tasks) => {
      tasks.forEach((task) => {
        this.commentService
          .getCommentsFromTask(task.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((comments) => {
            this.taskCommentsCount.set(task.id, comments.length);
          });
      });
    });
    // function to load the comments count for each task
    // this.commentService
    // .getCommentsFromTask('')
    // .pipe(takeUntil(this.destroy$))
    // .subscribe((comments) => {
    //   const countMap = new Map<string, number>();
    //   comments.forEach((comment) => {
    //     const currentCount = countMap.get(comment.taskId) || 0;
    //     countMap.set(comment.taskId, currentCount + 1);
    //   });
    //   this.taskCommentsCount = countMap;
    // });
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
      // Charger les commentaires lors de l'expansion
      this.commentService
        .getCommentsFromTask(taskId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((comments) => {
          this.taskCommentsCount.set(taskId, comments.length);
        });
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

  isTaskOwner(task: Task): boolean {
    return task.uid === this.currentUserId;
  }

  getSharedUsers(task: Task): User[] {
    if (!task.sharedWith) return [];
    return this.users.filter((user) => task.sharedWith?.includes(user.id));
  }

  getSharedWithText(task: Task): string {
    if (!task.sharedWith?.length) return '';
    const sharedUsers = this.getSharedUsers(task);
    if (this.isTaskOwner(task)) {
      return `Shared with: ${sharedUsers.map((u) => u.displayName).join(', ')}`;
    } else {
      const owner = this.users.find((u) => u.id === task.uid);
      return `Shared by: ${owner?.displayName || 'Unknown'}`;
    }
  }
}
