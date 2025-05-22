import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  notification$ = this.notificationSubject.asObservable();

  constructor() {}

  showNotification(notification: Notification) {
    this.notificationSubject.next(notification);
  }

  success(message: string, duration: number = 3000) {
    this.showNotification({ message, type: 'success', duration });
  }

  error(message: string, duration: number = 5000) {
    this.showNotification({ message, type: 'error', duration });
  }

  info(message: string, duration: number = 3000) {
    this.showNotification({ message, type: 'info', duration });
  }

  warning(message: string, duration: number = 4000) {
    this.showNotification({ message, type: 'warning', duration });
  }

  clearNotification() {
    this.notificationSubject.next({ message: '', type: 'info' });
  }
}
