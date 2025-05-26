import { createReducer, on } from '@ngrx/store';
import { TaskState } from '../models/task.model';
import * as TasksActions from '../actions/tasks.actions';

export const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
};

export const tasksReducer = createReducer(
  initialState,
  on(TasksActions.loadTasks, (state) => ({ ...state, loading: true })),
  on(TasksActions.loadTasksSuccess, (state, { tasks }) => ({
    ...state,
    tasks,
    loading: false,
  })),
  on(TasksActions.loadTasksFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),

  on(TasksActions.addTask, (state) => ({ ...state, loading: true })),
  on(TasksActions.addTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: [...state.tasks, task],
    loading: false,
  })),
  on(TasksActions.addTaskFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),

  on(TasksActions.updateTask, (state) => ({ ...state, loading: true })),
  on(TasksActions.updateTaskSuccess, (state, { taskId, updates }) => ({
    ...state,
    tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    loading: false,
  })),
  on(TasksActions.updateTaskFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),

  on(TasksActions.deleteTask, (state) => ({ ...state, loading: true })),
  on(TasksActions.deleteTaskSuccess, (state, { taskId }) => ({
    ...state,
    tasks: state.tasks.filter((t) => t.id !== taskId),
    loading: false,
  })),
  on(TasksActions.deleteTaskFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  }))
);
