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
import { CanDeactivateFn, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, BehaviorSubject, debounceTime } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

export const canLeaveEditPage: CanDeactivateFn<TaskFormComponent> = (
  component
) => {
  if (component.submitted) {
    return true;
  }

  if (component.form.dirty) {
    return window.confirm(
      'Voulez-vous vraiment quitter ? Vous perdrez les données saisies.'
    );
  }
  return true;
};

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css',
})
export class TaskFormComponent implements OnInit, OnDestroy {
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
    private route: ActivatedRoute,
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
    // Vérifier si nous sommes en mode édition
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

      // Navigation vers la liste des tâches
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
    // Navigation vers la liste des tâches
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
}
