import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../models/task.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
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
export class TaskListComponent implements OnInit, OnChanges {
  @Input() tasks: Task[] = [];
  @Output() editRequested = new EventEmitter<Task>();
  @Output() deleteRequested = new EventEmitter<Task>();
  private destroyRef = inject(DestroyRef);

  searchControl = new FormControl('');
  statusFilter = new FormControl('all');
  filteredTasks$ = new BehaviorSubject<Task[]>([]);

  constructor(
    private tasksService: TasksService,
    private authService: AuthService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.updateFilteredTasks(this.searchControl.value || '');
    }
  }

  ngOnInit(): void {
    // Initialiser filteredTasks$ avec les tâches initiales
    this.updateFilteredTasks('');

    // Mettre à jour filteredTasks$ quand les tâches changent
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.updateFilteredTasks(searchTerm || '');
      });
  }

  private updateFilteredTasks(searchTerm: string): void {
    const term = searchTerm.toLowerCase();
    const filtered = !term
      ? this.tasks
      : this.tasks.filter(
          (task) =>
            task.title.toLowerCase().includes(term) ||
            task.description.toLowerCase().includes(term)
        );

    this.filteredTasks$.next(filtered);
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  onEdit(task: Task): void {
    this.editRequested.emit(task);
  }

  onDelete(task: Task): void {
    this.deleteRequested.emit(task);
  }
}
