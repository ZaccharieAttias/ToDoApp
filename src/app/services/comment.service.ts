import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Comment } from '../models/comment.model';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private commentsSubject = new BehaviorSubject<Map<string, Comment[]>>(
    new Map()
  );
  private readonly STORAGE_KEY = 'task_comments';

  constructor() {
    this.loadCommentsFromStorage();
  }

  private loadCommentsFromStorage(): void {
    const storedComments = localStorage.getItem(this.STORAGE_KEY);
    if (storedComments) {
      try {
        const parsedComments = JSON.parse(storedComments);
        const commentsMap = new Map<string, Comment[]>();

        Object.entries(parsedComments).forEach(([taskId, comments]) => {
          const typedComments = (comments as any[]).map((comment) => ({
            ...comment,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt),
          }));
          commentsMap.set(taskId, typedComments);
        });

        this.commentsSubject.next(commentsMap);
      } catch (error) {
        console.error('Error loading comments from storage:', error);
        this.commentsSubject.next(new Map());
      }
    }
  }

  private saveCommentsToStorage(commentsMap: Map<string, Comment[]>): void {
    try {
      const commentsObject = Object.fromEntries(commentsMap);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(commentsObject));
    } catch (error) {
      console.error('Error saving comments to storage:', error);
    }
  }

  getCommentsFromTask(taskId: string): Observable<Comment[]> {
    return new Observable<Comment[]>((observer) => {
      const comments = this.commentsSubject.value.get(taskId) || [];
      observer.next(comments);
      observer.complete();
    });
  }

  getCommentsUpdates(taskId: string): Observable<Comment[]> {
    return new Observable<Comment[]>((observer) => {
      const subscription = this.commentsSubject.subscribe((commentsMap) => {
        const comments = commentsMap.get(taskId) || [];
        observer.next(comments);
      });

      return () => subscription.unsubscribe();
    });
  }

  addCommentToTask(taskId: string, comment: Comment): void {
    const currentComments = this.commentsSubject.value;
    const taskComments = currentComments.get(taskId) || [];
    const updatedComments = [...taskComments, comment];

    const updatedMap = new Map(currentComments);
    updatedMap.set(taskId, updatedComments);

    this.commentsSubject.next(updatedMap);
    this.saveCommentsToStorage(updatedMap);
  }

  updateComment(
    taskId: string,
    commentId: string,
    updatedComment: Comment
  ): void {
    const currentComments = this.commentsSubject.value;
    const taskComments = currentComments.get(taskId) || [];
    const updatedComments = taskComments.map((comment: Comment) =>
      comment.id === commentId ? updatedComment : comment
    );

    const updatedMap = new Map(currentComments);
    updatedMap.set(taskId, updatedComments);

    this.commentsSubject.next(updatedMap);
    this.saveCommentsToStorage(updatedMap);
  }

  deleteComment(taskId: string, commentId: string): void {
    const currentComments = this.commentsSubject.value;
    const taskComments = currentComments.get(taskId) || [];
    const updatedComments = taskComments.filter(
      (comment: Comment) => comment.id !== commentId
    );

    const updatedMap = new Map(currentComments);
    updatedMap.set(taskId, updatedComments);

    this.commentsSubject.next(updatedMap);
    this.saveCommentsToStorage(updatedMap);
  }

  deleteAllCommentsForTask(taskId: string): void {
    const currentComments = this.commentsSubject.value;
    const updatedMap = new Map(currentComments);
    updatedMap.delete(taskId);
    this.commentsSubject.next(updatedMap);
    this.saveCommentsToStorage(updatedMap);
  }
}
