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
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css',
})
export class TaskFormComponent implements OnInit, OnDestroy {
  @Input() taskToEdit: Task | null = null;
  @Output() formSubmit = new EventEmitter<Task>();
  @Output() cancel = new EventEmitter<void>();

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
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {});
    if (this.taskToEdit) {
      const dueDate = new Date(this.taskToEdit.dueDate);
      const formattedDate = dueDate.toISOString().split('T')[0];

      this.form.patchValue({
        title: this.taskToEdit.title,
        description: this.taskToEdit.description,
        dueDate: formattedDate,
        status: this.taskToEdit.status,
        tags: this.taskToEdit.tags || [],
      });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    if (this.form.valid) {
      const userId = this.authService.user$.value?.id;
      if (!userId) {
        console.error('No user ID available');
        return;
      }

      const formValue = this.form.value;
      const taskData: Task = {
        id: this.taskToEdit?.id || Date.now().toString(),
        uid: userId,
        title: formValue.title,
        description: formValue.description,
        dueDate: new Date(formValue.dueDate),
        status: formValue.status,
        tags: formValue.tags || [],
        createdAt: this.taskToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.formSubmit.emit(taskData);
      this.submitted = true;
      this.form.reset();
      this.currentTag.reset();
    }
  }

  onCancel() {
    this.cancel.emit();
    this.form.reset();
    this.currentTag.reset();
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
  // Check if the form is completely filled
  if (component.form.dirty) {
    return window.confirm(
      'Do you really want to leave? You will lose the entered data.'
    );
  }
  return true;
};
