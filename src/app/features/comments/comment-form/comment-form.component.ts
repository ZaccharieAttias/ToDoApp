import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Comment } from '../../../models/comment.model';
import { CommentService } from '../../../services/comment.service';
import { AuthService } from '../../../services/auth.service';
import { MentionDirective } from '../../../shared/directives/mention.directive';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MentionDirective],
  templateUrl: './comment-form.component.html',
  styleUrls: ['./comment-form.component.css'],
})
export class CommentFormComponent {
  @Input() taskId: string = '';
  @Output() onCommentAdded = new EventEmitter<Comment>();
  commentForm = new FormGroup({
    content: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(100),
    ]),
  });

  constructor(
    private commentService: CommentService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  async onSubmit() {
    if (this.commentForm.valid) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        try {
          await this.commentService.addCommentToTask(
            this.taskId,
            this.commentForm.value.content || ''
          );
          this.commentForm.reset();
          this.notificationService.success('Comment added successfully!');
        } catch (error) {
          this.notificationService.error('Error adding comment');
        }
      }
    }
  }
}
