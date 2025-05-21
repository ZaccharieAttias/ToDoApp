import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { Task } from '../../../models/task.model';
import { TasksService } from '../../../services/tasks.service';
import { CanDeactivateFn, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, BehaviorSubject, debounceTime } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css',
})
export class TaskFormComponent implements OnInit, OnDestroy {
  @Input() set taskToEdit(task: Task | null) {
    if (task) {
      this.taskToEdit$.next(task);
    }
  }
  @Output() formSubmit = new EventEmitter<Task>();
  @Output() cancel = new EventEmitter<void>();

  private taskToEdit$ = new BehaviorSubject<Task | null>(null);
  isEditing$ = new BehaviorSubject<boolean>(false);
  form: FormGroup;
  currentTag = new FormControl('');
  submitted = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private taskService: TasksService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      dueDate: ['', [Validators.required]],
      status: [false],
      tags: [[]],
    });
  }

  ngOnInit() {
    this.taskToEdit$.pipe(takeUntil(this.destroy$)).subscribe((task) => {
      if (task) {
        console.log('Task to edit received:', task);
        const dueDate = new Date(task.dueDate);
        const formattedDate = dueDate.toISOString().split('T')[0];

        this.form.patchValue({
          title: task.title,
          description: task.description,
          dueDate: formattedDate,
          status: task.status,
          tags: task.tags || [],
        });
        this.isEditing$.next(true);
      } else {
        this.isEditing$.next(false);
      }
    });

    this.form.valueChanges
      .pipe(debounceTime(1000), takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('Form values changed:', this.form.value);
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
        createdAt:
          this.taskToEdit$.value?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.formSubmit.emit(taskData);
      this.submitted = true;
      this.form.reset();
      this.currentTag.reset();
      this.isEditing$.next(false);
    }
  }

  onCancel() {
    this.cancel.emit();
    this.form.reset();
    this.currentTag.reset();
    this.isEditing$.next(false);
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
}

export const canLeaveEditPage: CanDeactivateFn<TaskFormComponent> = (
  component
) => {
  if (component.submitted) {
    return true;
  }

  if (component.form.dirty) {
    return window.confirm(
      'Do you really want to leave? You will lose the entered data.'
    );
  }
  return true;
};
