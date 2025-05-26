import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Comment } from '../models/comment.model';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root',
})
export class CommentService {
  // private commentsSubject = new BehaviorSubject<Map<string, Comment[]>>(
  //   new Map()
  // );
  // private readonly STORAGE_KEY = 'task_comments';

  // constructor(private notificationService: NotificationService) {
  //   this.loadCommentsFromStorage();
  // }

  /*private loadCommentsFromStorage(): void {
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
  }*/
  /*private saveCommentsToStorage(commentsMap: Map<string, Comment[]>): void {
    try {
      const commentsObject = Object.fromEntries(commentsMap);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(commentsObject));
    } catch (error) {
      console.error('Error saving comments to storage:', error);
    }
  }*/
  /*getCommentsFromTask(taskId: string): Observable<Comment[]> {
    return new Observable<Comment[]>((observer) => {
      const comments = this.commentsSubject.value.get(taskId) || [];
      observer.next(comments);
      observer.complete();
    });
  }*/
  /*getCommentsUpdates(taskId: string): Observable<Comment[]> {
    return new Observable<Comment[]>((observer) => {
      const subscription = this.commentsSubject.subscribe((commentsMap) => {
        const comments = commentsMap.get(taskId) || [];
        observer.next(comments);
      });

      return () => subscription.unsubscribe();
    });
  }*/
  /*addCommentToTask(taskId: string, comment: Comment): void {
    const currentComments = this.commentsSubject.value;
    const taskComments = currentComments.get(taskId) || [];
    const updatedComments = [...taskComments, comment];

    const updatedMap = new Map(currentComments);
    updatedMap.set(taskId, updatedComments);

    this.commentsSubject.next(updatedMap);
    this.saveCommentsToStorage(updatedMap);
    this.notificationService.success('Commentaire créé avec succès !');
  }*/
  /*updateComment(taskId: string, commentId: string, updatedComment: Comment): void {
    const currentComments = this.commentsSubject.value;
    const taskComments = currentComments.get(taskId) || [];
    const updatedComments = taskComments.map((comment: Comment) =>
      comment.id === commentId ? updatedComment : comment
    );

    const updatedMap = new Map(currentComments);
    updatedMap.set(taskId, updatedComments);

    this.commentsSubject.next(updatedMap);
    this.saveCommentsToStorage(updatedMap);
    this.notificationService.success('Commentaire modifié avec succès !');
  }*/
  /*deleteComment(taskId: string, commentId: string): void {
    const currentComments = this.commentsSubject.value;
    const taskComments = currentComments.get(taskId) || [];
    const updatedComments = taskComments.filter(
      (comment: Comment) => comment.id !== commentId
    );

    const updatedMap = new Map(currentComments);
    updatedMap.set(taskId, updatedComments);

    this.commentsSubject.next(updatedMap);
    this.saveCommentsToStorage(updatedMap);
    this.notificationService.success('Commentaire supprimé avec succès !');
  }*/
  /*deleteAllCommentsForTask(taskId: string): void {
    const currentComments = this.commentsSubject.value;
    const updatedMap = new Map(currentComments);
    updatedMap.delete(taskId);
    this.commentsSubject.next(updatedMap);
    this.saveCommentsToStorage(updatedMap);
    this.notificationService.success(
      'Tous les commentaires ont été supprimés !'
    );
  }*/

  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  getCommentsFromTask(taskId: string): Observable<Comment[]> {
    const commentsRef = collection(this.firestore, 'comments');
    const commentsQuery = query(
      commentsRef,
      where('taskId', '==', taskId),
      orderBy('createdAt', 'asc')
    );
    return collectionData(commentsQuery, { idField: 'id' }).pipe(
      map(
        (comments) =>
          comments.map((comment) => ({
            ...comment,
            createdAt: this.convertTimestampToDate(comment['createdAt']),
            updatedAt: this.convertTimestampToDate(comment['updatedAt']),
          })) as Comment[]
      )
    );
  }

  async addCommentToTask(taskId: string, content: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const id = doc(collection(this.firestore, 'comments')).id;
    const ref = doc(this.firestore, 'comments', id);
    const date = new Date();

    const comment: Comment = {
      id,
      taskId,
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      content,
      createdAt: date,
      updatedAt: date,
    };
    await setDoc(ref, comment);
    this.notificationService.success('Comment added successfully!');
  }

  async updateComment(commentId: string, content: string): Promise<void> {
    const commentRef = doc(this.firestore, 'comments', commentId);
    await updateDoc(commentRef, {
      content,
      updatedAt: new Date(),
    });
    this.notificationService.success('Comment updated successfully!');
  }

  async deleteComment(commentId: string): Promise<void> {
    const commentRef = doc(this.firestore, 'comments', commentId);
    await deleteDoc(commentRef);
    this.notificationService.success('Comment deleted successfully!');
  }

  async deleteAllCommentsForTask(taskId: string): Promise<void> {
    const comments = await this.getCommentsFromTask(taskId).toPromise();
    if (comments) {
      const deletePromises = comments.map((comment) =>
        deleteDoc(doc(this.firestore, 'comments', comment.id))
      );
      await Promise.all(deletePromises);
      this.notificationService.success('All comments deleted successfully!');
    }
  }

  getCommentById(commentId: string): Observable<Comment | undefined> {
    const commentsRef = collection(this.firestore, 'comments');
    const commentQuery = query(commentsRef, where('id', '==', commentId));
    return collectionData(commentQuery, { idField: 'id' }).pipe(
      map((comments) => comments[0] as Comment | undefined)
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
