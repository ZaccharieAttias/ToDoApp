import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as TasksActions from '../actions/tasks.actions';
import {
  Firestore,
  collectionData,
  collection,
  addDoc,
  query,
  where,
  Timestamp,
  updateDoc,
  doc,
  deleteDoc,
  getDocs,
} from '@angular/fire/firestore';
import {
  map,
  mergeMap,
  catchError,
  of,
  from,
  switchMap,
  combineLatest,
  withLatestFrom,
  take,
  filter,
} from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { Task } from '../../../models/task.model';
import { User } from 'firebase/auth';

@Injectable()
export class TasksEffects {
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private notificationService: NotificationService,
    private firestore: Firestore
  ) {}

  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.loadTasks),
      switchMap(() => {
        return this.authService.currentUser$.pipe(
          filter((user): user is User => !!user),
          take(1),
          switchMap((user) => {
            if (!user) {
              return of(
                TasksActions.loadTasksFailure({
                  error: 'User not authenticated',
                })
              );
            }

            const tasksRef = collection(this.firestore, 'tasks');
            const ownTasksQuery = query(
              tasksRef,
              where('userId', '==', user.uid)
            );
            const sharedTasksQuery = query(
              tasksRef,
              where('sharedWith', 'array-contains', user.uid)
            );

            const ownTasks$ = collectionData(ownTasksQuery, { idField: 'id' });
            const sharedTasks$ = collectionData(sharedTasksQuery, {
              idField: 'id',
            });

            return combineLatest([ownTasks$, sharedTasks$]).pipe(
              map(([ownTasks, sharedTasks]) => {
                const allTasks = [...ownTasks, ...sharedTasks] as Task[];
                const uniqueMap = new Map<string, Task>();
                for (const task of allTasks) {
                  uniqueMap.set(task.id, task);
                }
                const uniqueTasks = Array.from(uniqueMap.values());
                return TasksActions.loadTasksSuccess({ tasks: uniqueTasks });
              }),
              catchError((err) =>
                of(TasksActions.loadTasksFailure({ error: err.message }))
              )
            );
          })
        );
      })
    )
  );

  addTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.addTask),
      withLatestFrom(this.authService.currentUser$),
      mergeMap(([{ task }, user]) => {
        if (!user) {
          return of(
            TasksActions.addTaskFailure({ error: 'User not authenticated' })
          );
        }

        try {
          const tasksRef = collection(this.firestore, 'tasks');
          const duplicateQuery = query(
            tasksRef,
            where('userId', '==', user.uid),
            where('title', '==', task.title)
          );

          return from(getDocs(duplicateQuery)).pipe(
            mergeMap((snapshot) => {
              if (!snapshot.empty) {
                this.notificationService.error('Task already exists');
                return of(
                  TasksActions.addTaskFailure({ error: 'Task already exists' })
                );
              }

              const newTask = {
                ...task,
                userId: user.uid,
                createdAt: Timestamp.now(),
              };

              return from(addDoc(tasksRef, newTask)).pipe(
                map((docRef) => {
                  this.notificationService.success(
                    'Task created successfully!'
                  );
                  return TasksActions.addTaskSuccess({
                    task: {
                      ...newTask,
                      id: docRef.id,
                      createdAt: newTask.createdAt.toDate(),
                    } as Task,
                  });
                })
              );
            }),
            catchError((err) => {
              this.notificationService.error('Failed to create task.');
              return of(TasksActions.addTaskFailure({ error: err.message }));
            })
          );
        } catch (error) {
          this.notificationService.error('Failed to create task.');
          return of(
            TasksActions.addTaskFailure({
              error: 'Firestore context lost after logout',
            })
          );
        }
      })
    )
  );

  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.updateTask),
      mergeMap(({ taskId, updates }) => {
        const taskRef = doc(this.firestore, 'tasks', taskId);
        return from(
          updateDoc(taskRef, { ...updates, updatedAt: Timestamp.now() })
        ).pipe(
          map(() => {
            this.notificationService.success('Task updated successfully!');
            return TasksActions.updateTaskSuccess({ taskId, updates });
          }),
          catchError((err) => {
            this.notificationService.error('Failed to update task.');
            return of(TasksActions.updateTaskFailure({ error: err.message }));
          })
        );
      })
    )
  );

  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.deleteTask),
      mergeMap(({ taskId }) => {
        const taskRef = doc(this.firestore, 'tasks', taskId);
        return from(deleteDoc(taskRef)).pipe(
          map(() => {
            this.notificationService.success('Task deleted successfully!');
            return TasksActions.deleteTaskSuccess({ taskId });
          }),
          catchError((err) => {
            this.notificationService.error('Failed to delete task.');
            return of(TasksActions.deleteTaskFailure({ error: err.message }));
          })
        );
      })
    )
  );
}
