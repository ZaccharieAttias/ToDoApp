import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { CommentService } from '../../../services/comment.service';
import { Comment } from '../../../models/comment.model';
import { CommonModule, DatePipe } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
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
  @Input() taskId: string = '';
  comments: Comment[] = [];
  private destroyRef = inject(DestroyRef);
  editingCommentId: string | null = null;
  editedContent: string = '';
  currentUserId: string | null = null;
  taskOwnerId: string | null = null;
  isSubmitting: boolean = false;
  userDisplayNames: string[] = [];

  constructor(
    private commentService: CommentService,
    private authService: AuthService,
    private tasksService: TasksService
  ) {
    this.currentUserId = this.authService.getCurrentUser()?.id || null;
  }

  ngOnInit(): void {
    this.userDisplayNames = this.authService
      .getUsers()
      .map((u) => u.displayName);

    this.tasksService.getTaskById(this.taskId).subscribe((task) => {
      this.taskOwnerId = task?.uid || null;
    });

    this.commentService
      .getCommentsFromTask(this.taskId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((comments: Comment[]) => {
        this.comments = this.sortCommentsByDate(comments);
      });

    this.commentService
      .getCommentsUpdates(this.taskId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updatedComments: Comment[]) => {
        this.comments = this.sortCommentsByDate(updatedComments);
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
        this.commentService.updateComment(
          this.taskId,
          comment.id,
          updatedComment
        );
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
        this.commentService.deleteComment(this.taskId, comment.id);
      } finally {
        this.isSubmitting = false;
      }
    }
  }
}
