import { Injectable } from '@angular/core';
import { Task } from '../models/task.model';
import { BehaviorSubject, map } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  constructor() {
    if (this.isBrowser()) {
      const tasks = localStorage.getItem('tasks');
      if (tasks) {
        this.tasksSubject.next(JSON.parse(tasks));
      }
    }
  }

  getUserTasks(userId: string) {
    return this.tasks$.pipe(
      map((tasks) => tasks.filter((task) => task.uid === userId))
    );
  }

  addTask(task: Task) {
    console.log('Adding task to service:', task);
    const currentTasks = this.tasksSubject.value;

    const taskExists = currentTasks.some((t) => t.id === task.id);
    if (!taskExists) {
      console.log('Task does not exist, adding to list');
      this.tasksSubject.next([task, ...currentTasks]);
      if (this.isBrowser()) {
        console.log('Saving tasks to localStorage');
        this.saveTasks();
      }
    } else {
      console.log('Task already exists, skipping');
    }
  }

  updateTask(updatedTask: Task) {
    console.log('Updating task in service:', updatedTask);
    this.tasksSubject.next(
      this.tasksSubject.value.map((task) => {
        if (task.id === updatedTask.id) {
          return {
            ...task,
            title: updatedTask.title,
            description: updatedTask.description,
            status: updatedTask.status,
            dueDate: updatedTask.dueDate,
            tags: updatedTask.tags,
            updatedAt: new Date().toISOString(),
          };
        }
        return task;
      })
    );

    if (this.isBrowser()) {
      console.log('Saving updated tasks to localStorage');
      this.saveTasks();
    }
  }

  deleteTask(id: string) {
    console.log('Deleting task from service:', id);
    this.tasksSubject.next(
      this.tasksSubject.value.filter((task) => task.id !== id)
    );

    if (this.isBrowser()) {
      console.log('Saving tasks after deletion to localStorage');
      this.saveTasks();
    }
  }

  getTaskById(id: string) {
    return this.tasks$.pipe(
      map((tasks) => tasks.find((task) => task.id === id))
    );
  }

  private saveTasks() {
    const tasks = this.tasksSubject.value;
    console.log('Current tasks to save:', tasks);
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
