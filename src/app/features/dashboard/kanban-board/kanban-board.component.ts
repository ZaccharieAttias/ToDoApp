import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../models/task.model';
import { TasksService } from '../../../services/tasks.service';
import { AuthService } from '../../../services/auth.service';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { NotificationService } from '../../../services/notification.service';

interface KanbanColumn {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  template: `
    <div class="kanban-container">
      <div
        *ngFor="let column of columns"
        class="kanban-column"
        [style.border-top-color]="column.color"
        cdkDropList
        [cdkDropListData]="column.tasks"
        [cdkDropListConnectedTo]="getConnectedLists(column.id)"
        [id]="column.id"
        (cdkDropListDropped)="drop($event)"
      >
        <div class="column-header">
          <h3>{{ column.title }}</h3>
          <div class="task-count">{{ column.tasks.length }} task(s)</div>
        </div>
        <div class="task-list">
          <div class="task-card" *ngFor="let task of column.tasks" cdkDrag>
            <div class="task-header">
              <h4>{{ task.title }}</h4>
              <span class="due-date" [class.overdue]="isOverdue(task)">
                {{ task.dueDate | date : 'dd/MM/yyyy' }}
              </span>
            </div>
            <p class="task-description">{{ task.description }}</p>
            <div class="task-tags" *ngIf="task.tags?.length">
              <span class="tag" *ngFor="let tag of task.tags">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .kanban-container {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        overflow-x: auto;
      }

      .kanban-column {
        flex: 1;
        min-width: 300px;
        background: #f8f9fa;
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        border-top: 4px solid;
        height: auto;
      }

      .column-header {
        margin-bottom: 1rem;
      }

      .kanban-column h3 {
        margin: 0 0 0.5rem 0;
        color: #2c3e50;
      }

      .task-count {
        font-size: 0.875rem;
        color: #6c757d;
      }

      .task-list {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem;
      }

      .task-card {
        background: white;
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        cursor: move;
        position: relative;
      }

      .task-card.cdk-drag-preview {
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
      }

      .task-card.cdk-drag-placeholder {
        opacity: 0.3;
      }

      .task-card.cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }

      .task-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.5rem;
      }

      .task-header h4 {
        margin: 0;
        color: #2c3e50;
      }

      .due-date {
        font-size: 0.875rem;
        color: #6c757d;
      }

      .due-date.overdue {
        color: #e74c3c;
        font-weight: 500;
      }

      .task-description {
        color: #495057;
        margin: 0.5rem 0;
        font-size: 0.875rem;
      }

      .task-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .tag {
        background: #e9ecef;
        color: #495057;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
      }
    `,
  ],
})
export class KanbanBoardComponent implements OnInit {
  private tasksService = inject(TasksService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  columns: KanbanColumn[] = [
    { id: 'In Progress', title: 'In Progress', tasks: [], color: '#9b59b6' },
    { id: 'Completed', title: 'Completed', tasks: [], color: '#2ecc71' },
  ];

  connectedDropLists: string[] = [];

  ngOnInit() {
    this.connectedDropLists = this.columns.map((col) => col.id);
    const userId = this.authService.getCurrentUser()?.id;
    if (userId) {
      this.tasksService.getUserTasks(userId).subscribe((tasks) => {
        this.organizeTasks(tasks);
      });
    }
  }

  private organizeTasks(tasks: Task[]) {
    this.columns.forEach((column) => {
      column.tasks = tasks.filter((task) => {
        switch (column.id) {
          case 'Completed':
            return task.status === true;
          case 'In Progress':
            return task.status === false;
          default:
            return false;
        }
      });
    });
  }

  getConnectedLists(columnId: string): string[] {
    return this.connectedDropLists.filter((id) => id !== columnId);
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const task = event.container.data[event.currentIndex];
      const newStatus = this.getNewTaskStatus(event.container.id);

      this.tasksService.updateTask({
        ...task,
        ...newStatus,
      });

      this.notificationService.success(
        `Task moved to "${this.getColumnTitle(event.container.id)}"`
      );
    }
  }

  private getNewTaskStatus(columnId: string): Partial<Task> {
    switch (columnId) {
      case 'Completed':
        return { status: true };
      case 'In Progress':
        return { status: false };
      default:
        return {};
    }
  }

  private getColumnTitle(columnId: string): string {
    return this.columns.find((col) => col.id === columnId)?.title || '';
  }

  isOverdue(task: Task): boolean {
    return new Date(task.dueDate) < new Date() && !task.status;
  }
}
