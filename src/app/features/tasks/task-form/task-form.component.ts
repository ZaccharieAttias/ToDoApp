import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { Task } from '../../../models/task.model';
import { CanDeactivateFn, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, BehaviorSubject, combineLatest, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { User as UserProfile } from '../../../models/user.model';
import { Store } from '@ngrx/store';
import { AppState } from '../../../state/tasks/state/app.state';
import { selectTaskById } from '../../../state/tasks/selectors/tasks.selectors';
import {
  addTask,
  updateTask,
} from '../../../state/tasks/actions/tasks.actions';
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
  availableUsers: UserProfile[] = [];
  selectedUsers: UserProfile[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private store: Store<AppState>
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
    // this.authService.getUsers().subscribe((users) => {
    //   this.availableUsers = users;

    //   this.route.params.subscribe((params) => {
    //     if (params['id']) {
    //       const taskId = params['id'];
    //       this.taskService.getTaskById(taskId).subscribe((task) => {
    //         if (task) {
    //           const dueDate = new Date(task.dueDate);
    //           const formattedDate = dueDate.toISOString().split('T')[0];

    //           if (task.sharedWith) {
    //             this.selectedUsers = this.availableUsers.filter((user) =>
    //               task.sharedWith?.includes(user.id)
    //             );
    //           } else {
    //             this.selectedUsers = [];
    //           }

    //           this.form.patchValue({
    //             title: task.title,
    //             description: task.description,
    //             dueDate: formattedDate,
    //             status: task.status,
    //             tags: task.tags || [],
    //             sharedWith: task.sharedWith || [],
    //           });

    //           this.isEditing$.next(true);
    //           this.taskToEdit$.next(task);
    //         }
    //       });
    //     }
    //   });
    // });

    combineLatest([this.route.params, this.authService.getUsers()])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([params, users]) => {
        this.availableUsers = users;

        if (params['id']) {
          const taskId = params['id'];
          this.store.select(selectTaskById(taskId)).subscribe((task) => {
            if (task) {
              const dueDate = new Date(task.dueDate);
              const formattedDate = dueDate.toISOString().split('T')[0];

              if (task.sharedWith) {
                this.selectedUsers = this.availableUsers.filter((user) =>
                  task.sharedWith?.includes(user.id)
                );
              } else {
                this.selectedUsers = [];
              }

              this.form.patchValue({
                title: task.title,
                description: task.description,
                dueDate: formattedDate,
                status: task.status,
                tags: task.tags || [],
                sharedWith: task.sharedWith || [],
              });

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
      const userId = this.authService.getCurrentUser()?.uid;
      if (!userId) {
        console.error('No user ID available');
        this.notificationService.error('The user was disconnected');
        this.router.navigate(['/login']);
        return;
      }

      const formValue = this.form.value;
      const taskData: Task = {
        id: this.taskToEdit$.value?.id || Date.now().toString(),
        userId: userId,
        title: formValue.title,
        description: formValue.description,
        dueDate: formValue.dueDate,
        status: formValue.status,
        tags: formValue.tags || [],
        sharedWith: formValue.sharedWith || [],
        createdAt: this.taskToEdit$.value?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      if (this.taskToEdit$.value) {
        console.log('Updating task:', taskData);
        this.store.dispatch(
          updateTask({
            taskId: this.taskToEdit$.value.id,
            updates: taskData,
          })
        );
      } else {
        console.log('Adding task:', taskData);
        this.store.dispatch(addTask({ task: taskData }));
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

  toggleUserSelection(user: UserProfile) {
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
  }

  isUserSelected(user: UserProfile): boolean {
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
