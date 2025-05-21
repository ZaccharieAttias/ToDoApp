import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../models/task.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { TasksService } from '../../../services/tasks.service';
import { AuthService } from '../../../services/auth.service';
import { FilterByStatusPipe } from '../../../shared/filter-by-status.pipe';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FilterByStatusPipe],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
})
export class TaskListComponent implements OnInit {
  @Input() set tasks(value: Task[]) {
    this.tasks$.next(value);
  }
  @Output() editRequested = new EventEmitter<Task>();
  @Output() deleteRequested = new EventEmitter<Task>();
  private destroy$ = new Subject<void>();

  private tasks$ = new BehaviorSubject<Task[]>([]);
  searchControl = new FormControl('');
  statusFilter = new FormControl('all');
  filteredTasks$ = new BehaviorSubject<Task[]>([]);

  constructor(
    private tasksService: TasksService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Souscription aux changements des tâches
    this.tasks$.pipe(takeUntil(this.destroy$)).subscribe((tasks) => {
      console.log('Tasks updated:', tasks);
      this.updateFilteredTasks(this.searchControl.value || '');
    });

    // Souscription aux changements de la recherche
    this.searchControl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        console.log('Search term changed:', searchTerm);
        this.updateFilteredTasks(searchTerm || '');
      });

    // Souscription aux changements du filtre de statut
    this.statusFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        console.log('Status filter changed:', status);
        this.updateFilteredTasks(this.searchControl.value || '');
      });
  }

  private updateFilteredTasks(searchTerm: string): void {
    const term = searchTerm.toLowerCase();
    const tasks = this.tasks$.value;
    const filtered = !term
      ? tasks
      : tasks.filter(
          (task) =>
            task.title.toLowerCase().includes(term) ||
            task.description.toLowerCase().includes(term)
        );

    console.log('Updating filtered tasks:', filtered);
    this.filteredTasks$.next(filtered);
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  onEdit(task: Task): void {
    console.log('Edit requested for task:', task);
    this.editRequested.emit(task);
  }

  onDelete(task: Task): void {
    console.log('Delete requested for task:', task);
    this.deleteRequested.emit(task);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
