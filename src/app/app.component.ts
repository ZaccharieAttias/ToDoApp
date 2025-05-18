import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TasksComponent } from './features/tasks/tasks.component';
import { NotificationsComponent } from './features/notifications/notifications.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TasksComponent, NotificationsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'ToDoApp';
}
