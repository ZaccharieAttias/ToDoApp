import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
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
  private destroyRef = inject(DestroyRef);

  constructor(
    private commentService: CommentService,
    private authService: AuthService
  ) {}

  onSubmit() {
    if (this.commentForm.valid) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        const userId = currentUser.id;
        const comment: Comment = {
          id: userId + '-' + this.taskId + '-' + new Date().getTime(),
          taskId: this.taskId,
          userId: userId,
          userName: currentUser.displayName,
          content: this.commentForm.value.content || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.commentService.addCommentToTask(this.taskId, comment);
        this.commentForm.reset();
        this.onCommentAdded.emit(comment);
      }
    }
  }
}
