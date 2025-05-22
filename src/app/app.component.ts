import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { NotificationCenterComponent } from './features/notifications/notification-center/notification-center.component';
// import { NotificationsComponent } from './features/notifications/notifications.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationCenterComponent],
  template: `
    <router-outlet></router-outlet>
    <app-notification-center></app-notification-center>
  `,
  styles: [],
})
export class AppComponent implements OnInit {
  title = 'ToDoApp';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.autoLogin();
  }
}
