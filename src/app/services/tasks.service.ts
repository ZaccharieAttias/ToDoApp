import { inject, Injectable } from '@angular/core';
import { Task } from '../models/task.model';
import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  map,
  Observable,
  of,
} from 'rxjs';
import { NotificationService } from './notification.service';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  addDoc,
  Timestamp,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  // private tasksSubject = new BehaviorSubject<Task[]>([]);
  // tasks$ = this.tasksSubject.asObservable();

  // constructor(private notificationService: NotificationService) {
  //   if (this.isBrowser()) {
  //     const tasks = localStorage.getItem('tasks');
  //     if (tasks) {
  //       this.tasksSubject.next(JSON.parse(tasks));
  //     }
  //   }
  // }

  // getUserTasks(userId: string) {
  //   return this.tasks$.pipe(
  //     map((tasks) =>
  //       tasks.filter(
  //         (task) =>
  //           task.uid === userId ||
  //           (task.sharedWith && task.sharedWith.includes(userId))
  //       )
  //     )
  //   );
  // }*/
  /*addTask(task: Task) {
    console.log('Adding task to service:', task);
    const currentTasks = this.tasksSubject.value;

    const taskExists = currentTasks.some((t) => t.id === task.id);
    if (!taskExists) {
      console.log('Task does not exist, adding to list');
      this.tasksSubject.next([task, ...currentTasks]);
      if (this.isBrowser()) {
        console.log('Saving tasks to localStorage');
        this.saveTasks();
        this.notificationService.success('Task created successfully !');
      }
    } else {
      console.log('Task already exists, skipping');
      this.notificationService.warning('Task already exists');
    }
  }*/
  /*updateTask(updatedTask: Task) {
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
            sharedWith: updatedTask.sharedWith,
            updatedAt: new Date().toISOString(),
          };
        }
        return task;
      })
    );

    if (this.isBrowser()) {
      console.log('Saving updated tasks to localStorage');
      this.saveTasks();
      this.notificationService.success('Task updated successfully !');
    }
  }*/
  /*deleteTask(id: string) {
    console.log('Deleting task from service:', id);
    this.tasksSubject.next(
      this.tasksSubject.value.filter((task) => task.id !== id)
    );

    if (this.isBrowser()) {
      console.log('Saving tasks after deletion to localStorage');
      this.saveTasks();
      this.notificationService.success('Task deleted successfully !');
    }
  }*/
  /*getTaskById(id: string) {
    return this.tasks$.pipe(
      map((tasks) => tasks.find((task) => task.id === id))
    );
  }*/
  /*private saveTasks() {
    const tasks = this.tasksSubject.value;
    console.log('Current tasks to save:', tasks);
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }*/
  /*private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }*/

  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  getTasks(): Observable<Task[]> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return of([]);
    }

    // get user tasks
    const userTasksRef = collection(this.firestore, 'tasks');
    const userTasksQuery = query(userTasksRef, where('userId', '==', user.uid));
    const userTasks$ = collectionData(userTasksQuery, { idField: 'id' }).pipe(
      map(
        (tasks) =>
          tasks.map((task) => ({
            id: task['id'],
            uid: task['userId'],
            title: task['title'],
            description: task['description'],
            dueDate: this.convertTimestampToDate(task['dueDate']),
            status: task['status'],
            tags: task['tags'] || [],
            sharedWith: task['sharedWith'] || [],
            createdAt: this.convertTimestampToDate(task['createdAt']),
            updatedAt: this.convertTimestampToDate(task['updatedAt']),
          })) as Task[]
      )
    );
    // get shared tasks
    const sharedTasksRef = collection(this.firestore, 'tasks');
    const sharedTasksQuery = query(
      sharedTasksRef,
      where('sharedWith', 'array-contains', user.uid)
    );
    const sharedTasks$ = collectionData(sharedTasksQuery, {
      idField: 'id',
    }).pipe(
      map(
        (tasks) =>
          tasks.map((task) => ({
            ...task,
            dueDate: this.convertTimestampToDate(task['dueDate']),
            createdAt: this.convertTimestampToDate(task['createdAt']),
            updatedAt: this.convertTimestampToDate(task['updatedAt']),
          })) as Task[]
      )
    );

    // combine two observables and remove duplicates
    return combineLatest([userTasks$, sharedTasks$]).pipe(
      map(([userTasks, sharedTasks]) => {
        const allTasks = [...userTasks, ...sharedTasks] as Task[];
        // remove duplicates using id as unique key
        const uniqueTasks = Array.from(
          new Map(allTasks.map((task) => [task.id, task])).values()
        );
        return uniqueTasks;
      })
    );
  }

  async addTask(task: Omit<Task, 'id'>): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // (1) Vérifie si une tâche du même titre existe déjà
    const existingTasks = await firstValueFrom(this.getTasks());
    const alreadyExists = existingTasks.some((t) => t.title === task.title);

    if (alreadyExists) {
      this.notificationService.warning('Task already exists');
      return;
    }

    // (2) Ajoute la tâche
    const taskRef = collection(this.firestore, 'tasks');
    await addDoc(taskRef, {
      ...task,
      userId: user.uid,
      createdAt: Timestamp.now(),
    });

    this.notificationService.success('Task created successfully!');
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const taskRef = doc(this.firestore, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    this.notificationService.success('Task updated successfully!');
  }

  async deleteTask(taskId: string): Promise<void> {
    const taskRef = doc(this.firestore, 'tasks', taskId);
    await deleteDoc(taskRef);
    this.notificationService.success('Task deleted successfully!');
  }

  getTaskById(id: string): Observable<Task | undefined> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return of(undefined);
    }

    return this.getTasks().pipe(
      map((tasks) => tasks.find((task) => task.id === id))
    );
  }

  private convertTimestampToDate(timestamp: any): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    return new Date();
  }
}
