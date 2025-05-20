import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../models/task.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
})
export class TaskListComponent {
  @Input() tasks: Task[] = [];
  @Output() editRequested = new EventEmitter<Task>();
  @Output() deleteRequested = new EventEmitter<Task>();

  onEdit(task: Task) {
    this.editRequested.emit(task);
  }

  onDelete(task: Task) {
    this.deleteRequested.emit(task);
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }
}
