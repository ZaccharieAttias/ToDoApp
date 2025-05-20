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
} from '@angular/forms';
import { Task } from '../../../models/task.model';
import { TasksService } from '../../../services/tasks.service';
import { CanDeactivateFn, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css',
})
export class TaskFormComponent implements OnInit, OnDestroy {
  @Input() set taskToEdit(value: Task | null) {
    this._taskToEdit = value;
    this.updateForm();
  }
  get taskToEdit(): Task | null {
    return this._taskToEdit;
  }
  private _taskToEdit: Task | null = null;

  @Output() taskSaved = new EventEmitter<Task>();
  @Output() cancel = new EventEmitter<void>();
  submitted = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private taskService: TasksService,
    private router: Router
  ) {}

  form = new FormGroup({
    title: new FormControl('', {
      validators: [Validators.required],
    }),
    description: new FormControl('', { validators: [Validators.required] }),
    dueDate: new FormControl('', { validators: [Validators.required] }),
    status: new FormControl(false),
  });

  ngOnInit() {
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {});
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateForm() {
    if (this.taskToEdit) {
      // Formater la date pour l'input date
      const dueDate = new Date(this.taskToEdit.dueDate);
      const formattedDate = dueDate.toISOString().split('T')[0];

      this.form.patchValue({
        title: this.taskToEdit.title,
        description: this.taskToEdit.description,
        dueDate: formattedDate,
        status: this.taskToEdit.status,
      });
    } else {
      this.form.reset({
        title: '',
        description: '',
        dueDate: '',
        status: false,
      });
    }
  }

  onSubmit() {
    console.log('Form submitted', this.form.value);
    if (this.form.invalid) {
      console.log('Form is invalid');
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const task: Task = {
      id: this.taskToEdit?.id || new Date().getTime().toString(),
      uid: this.authService.user$.value?.id || '',
      title: formValue.title ?? '',
      description: formValue.description ?? '',
      status: formValue.status ?? false,
      dueDate: formValue.dueDate ? new Date(formValue.dueDate) : new Date(),
    };

    console.log('Emitting task:', task);
    this.taskSaved.emit(task);
    this.submitted = true;
    this.form.reset({
      title: '',
      description: '',
      dueDate: '',
      status: false,
    });

    // this.router.navigate(['/users', this.userId(), 'tasks'], {
    //   replaceUrl: true,
    // });
  }

  onCancel() {
    this.cancel.emit();
    this.form.reset({
      title: '',
      description: '',
      dueDate: '',
      status: false,
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
