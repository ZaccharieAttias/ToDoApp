import { createSelector } from '@ngrx/store';
import { TaskState } from '../models/task.model';
import { Task } from '../../../models/task.model';

export const selectTasksState = (state: { tasks: TaskState }) => state.tasks;

export const selectAllTasks = createSelector(
  selectTasksState,
  (state: TaskState) => state.tasks
);

export const selectTasksLoading = createSelector(
  selectTasksState,
  (state: TaskState) => state.loading
);

export const selectTasksError = createSelector(
  selectTasksState,
  (state: TaskState) => state.error
);

export const selectTaskById = (id: string) =>
  createSelector(selectAllTasks, (tasks) =>
    tasks.find((task) => task.id === id)
  );
