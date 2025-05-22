import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { Task } from '../../../models/task.model';
import { TasksService } from '../../../services/tasks.service';
import { CanDeactivateFn, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, BehaviorSubject } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { User } from '../../../models/user.model';
import { MentionDirective } from '../../../shared/directives/mention.directive';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MentionDirective],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css',
})
export class TaskFormComponent implements OnInit, OnDestroy {
  private taskToEdit$ = new BehaviorSubject<Task | null>(null);
  isEditing$ = new BehaviorSubject<boolean>(false);
  form: FormGroup;
  submitted = false;
  currentTag = new FormControl('');
  private destroy$ = new Subject<void>();
  availableUsers: User[] = [];
  selectedUsers: User[] = [];

  constructor(
    private authService: AuthService,
    private taskService: TasksService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      dueDate: ['', [Validators.required]],
      status: [false],
      tags: [[]],
      sharedWith: [[]],
    });
  }

  ngOnInit() {
    // Charger la liste des utilisateurs disponibles
    this.availableUsers = this.authService
      .getUsers()
      .filter((user) => user.id !== this.authService.getCurrentUser()?.id);

    this.route.params.subscribe((params) => {
      if (params['id']) {
        const taskId = params['id'];
        this.taskService.getTaskById(taskId).subscribe((task) => {
          if (task) {
            const dueDate = new Date(task.dueDate);
            const formattedDate = dueDate.toISOString().split('T')[0];

            this.form.patchValue({
              title: task.title,
              description: task.description,
              dueDate: formattedDate,
              status: task.status,
              tags: task.tags || [],
              sharedWith: task.sharedWith || [],
            });

            // Mettre à jour la liste des utilisateurs sélectionnés
            if (task.sharedWith) {
              this.selectedUsers = this.availableUsers.filter((user) =>
                task.sharedWith?.includes(user.id)
              );
            }

            this.isEditing$.next(true);
            this.taskToEdit$.next(task);
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    if (this.form.valid) {
      const userId = this.authService.getCurrentUser()?.id;
      if (!userId) {
        console.error('No user ID available');
        this.notificationService.error('The user was disconnected');
        this.router.navigate(['/login']);
        return;
      }

      const formValue = this.form.value;
      const taskData: Task = {
        id: this.taskToEdit$.value?.id || Date.now().toString(),
        uid: userId,
        title: formValue.title,
        description: formValue.description,
        dueDate: new Date(formValue.dueDate),
        status: formValue.status,
        tags: formValue.tags || [],
        sharedWith: formValue.sharedWith || [],
        createdAt:
          this.taskToEdit$.value?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (this.taskToEdit$.value) {
        this.taskService.updateTask(taskData);
      } else {
        this.taskService.addTask(taskData);
      }

      this.submitted = true;
      this.form.reset();
      this.currentTag.reset();
      const isEditing = this.isEditing$.value;
      this.isEditing$.next(false);

      if (isEditing) {
        this.router.navigate(['../../'], { relativeTo: this.route });
      } else {
        this.router.navigate(['../'], { relativeTo: this.route });
      }
    }
  }

  onCancel() {
    this.form.reset();
    this.currentTag.reset();
    const isEditing = this.isEditing$.value;
    this.isEditing$.next(false);

    if (isEditing) {
      this.router.navigate(['../../'], { relativeTo: this.route });
    } else {
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }

  addTag() {
    const tag = this.currentTag.value?.trim();
    if (tag) {
      const currentTags = this.form.get('tags')?.value || [];
      if (!currentTags.includes(tag)) {
        this.form.patchValue({
          tags: [...currentTags, tag],
        });
      }
      this.currentTag.reset();
    }
  }

  removeTag(tagToRemove: string) {
    const currentTags = this.form.get('tags')?.value || [];
    this.form.patchValue({
      tags: currentTags.filter((tag: string) => tag !== tagToRemove),
    });
  }

  toggleUserSelection(user: User) {
    const currentSharedWith = this.form.get('sharedWith')?.value || [];
    const userIndex = currentSharedWith.indexOf(user.id);

    if (userIndex === -1) {
      this.form.patchValue({
        sharedWith: [...currentSharedWith, user.id],
      });
      this.selectedUsers.push(user);
    } else {
      this.form.patchValue({
        sharedWith: currentSharedWith.filter((id: string) => id !== user.id),
      });
      this.selectedUsers = this.selectedUsers.filter((u) => u.id !== user.id);
    }

    if (this.isEditing$.value && this.taskToEdit$.value) {
      const updatedTask: Task = {
        ...this.taskToEdit$.value,
        sharedWith: this.form.get('sharedWith')?.value || [],
        updatedAt: new Date().toISOString(),
      };
    }
  }

  isUserSelected(user: User): boolean {
    return this.selectedUsers.some((u) => u.id === user.id);
  }
}

export const canLeaveEditPage: CanDeactivateFn<TaskFormComponent> = (
  component
) => {
  if (component.submitted) {
    return true;
  }

  if (component.form.dirty) {
    return window.confirm(
      'Do you really want to leave? You will lose the data you have entered.'
    );
  }
  return true;
};
