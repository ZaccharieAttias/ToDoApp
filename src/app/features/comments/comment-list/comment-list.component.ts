import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { CommentService } from '../../../services/comment.service';
import { Comment } from '../../../models/comment.model';
import { CommonModule, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../services/auth.service';
import { TasksService } from '../../../services/tasks.service';
import { FormsModule } from '@angular/forms';
import { MentionPipe } from '../../../shared/pipes/mention.pipe';

@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, MentionPipe],
  templateUrl: './comment-list.component.html',
  styleUrl: './comment-list.component.css',
})
export class CommentListComponent implements OnInit {
  @Input() set taskId(value: string) {
    this._taskId = value;
    if (value) {
      this.loadComments();
    }
  }
  get taskId(): string {
    return this._taskId;
  }
  private _taskId: string = '';
  comments: Comment[] = [];
  editingCommentId: string | null = null;
  editedContent: string = '';
  currentUserId: string | null = null;
  taskOwnerId: string | null = null;
  isSubmitting: boolean = false;
  userDisplayNames: string[] = [];
  allUserDisplayNames: string[] = [];
  private destroyRef = inject(DestroyRef);

  constructor(
    private commentService: CommentService,
    private authService: AuthService,
    private tasksService: TasksService
  ) {
    this.currentUserId = this.authService.getCurrentUser()?.uid || null;
  }

  ngOnInit(): void {
    this.authService
      .getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((users) => {
        this.userDisplayNames = users.map((user) => user.displayName);
        this.allUserDisplayNames = [
          ...this.userDisplayNames,
          this.authService.getCurrentUser()?.displayName || '',
        ];
      });

    this.tasksService
      .getTaskById(this.taskId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((task) => {
        this.taskOwnerId = task?.uid || null;
      });

    if (this.taskId) {
      this.loadComments();
    }
  }

  private loadComments(): void {
    if (!this.taskId) return;

    this.commentService
      .getCommentsFromTask(this.taskId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comments: Comment[]) => {
          this.comments = this.sortCommentsByDate(comments);
          console.log('Comments loaded:', this.comments);
        },
        error: (error) => {
          console.error('Error loading comments:', error);
        },
      });
  }

  private sortCommentsByDate(comments: Comment[]): Comment[] {
    return [...comments].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA - dateB;
    });
  }

  isCommentOwner(comment: Comment): boolean {
    return this.currentUserId === comment.userId;
  }

  isTaskOwner(): boolean {
    return this.currentUserId === this.taskOwnerId;
  }

  startEditing(comment: Comment): void {
    this.editingCommentId = comment.id;
    this.editedContent = comment.content;
  }

  cancelEditing(): void {
    this.editingCommentId = null;
    this.editedContent = '';
  }

  async saveEdit(comment: Comment): Promise<void> {
    if (this.editedContent.trim() && !this.isSubmitting) {
      try {
        this.isSubmitting = true;
        const updatedComment: Comment = {
          ...comment,
          content: this.editedContent,
          updatedAt: new Date(),
        };
        this.commentService.updateComment(comment.id, updatedComment.content);
        this.editingCommentId = null;
        this.editedContent = '';
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  async deleteComment(comment: Comment): Promise<void> {
    if (
      (this.isCommentOwner(comment) || this.isTaskOwner()) &&
      !this.isSubmitting
    ) {
      try {
        this.isSubmitting = true;
        this.commentService.deleteComment(comment.id);
      } finally {
        this.isSubmitting = false;
      }
    }
  }
}
