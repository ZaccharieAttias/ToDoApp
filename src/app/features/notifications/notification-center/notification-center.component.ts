import { Component, DestroyRef, inject } from '@angular/core';
import {
  NotificationService,
  Notification,
} from '../../../services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.css',
})
export class NotificationCenterComponent {
  private notificationService = inject(NotificationService);
  notification$ = this.notificationService.notification$;
  notification: Notification | null = null;
  destroyRef = inject(DestroyRef);

  ngOnInit() {
    const subscription = this.notification$.subscribe((notification) => {
      if (notification.message) {
        this.notification = notification;
        if (notification.duration) {
          setTimeout(() => {
            this.onCloseNotification();
          }, notification.duration);
        }
      } else {
        this.notification = null;
      }
    });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }

  onCloseNotification() {
    this.notificationService.clearNotification();
    this.notification = null;
  }
}
