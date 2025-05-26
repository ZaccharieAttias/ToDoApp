import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, timer } from 'rxjs';
import { NotificationService } from './notification.service';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
} from '@angular/fire/auth';
import { Firestore, doc, getDocs, setDoc } from '@angular/fire/firestore';
import { collection, collectionData } from '@angular/fire/firestore';
import { User as UserProfile } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  private autoLogoutTimer: any;
  private readonly AUTO_LOGOUT_TIME = 30 * 60 * 1000; // 30 minutes

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private notificationService: NotificationService
  ) {}

  // private async initializeAuth() {
  //   try {
  //     // Set persistence to local storage
  //     await setPersistence(this.auth, browserLocalPersistence);
  //     console.log('Auth persistence initialized');

  //     // Listen for auth state changes
  //     onAuthStateChanged(this.auth, (user) => {
  //       if (user) {
  //         console.log('User is signed in:', user.email);
  //         this.currentUserSubject.next(user);
  //         this.startAutoLogoutTimer();
  //       } else {
  //         console.log('User is signed out');
  //         this.currentUserSubject.next(null);
  //         this.clearAutoLogoutTimer();
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Error initializing auth:', error);
  //   }
  // }

  private startAutoLogoutTimer() {
    this.clearAutoLogoutTimer();
    this.autoLogoutTimer = timer(this.AUTO_LOGOUT_TIME).subscribe(() => {
      this.logout();
      this.notificationService.info('Session expired due to inactivity');
    });
  }

  private clearAutoLogoutTimer() {
    if (this.autoLogoutTimer) {
      this.autoLogoutTimer.unsubscribe();
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      console.log('Login successful for:', email);
      this.currentUserSubject.next(userCredential.user);
      this.startAutoLogoutTimer();
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      this.notificationService.error('Email or password incorrect');
      return false;
    }
  }

  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<boolean> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      console.log('Registration successful for:', email);
      this.currentUserSubject.next(userCredential.user);
      await this.updateProfile(displayName);

      const uid = userCredential.user.uid;
      await setDoc(doc(this.firestore, 'users', uid), {
        id: uid,
        email: email,
        displayName: displayName,
      });
      this.startAutoLogoutTimer();
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      this.notificationService.error('Registration failed');
      return false;
    }
  }

  async updateProfile(displayName: string): Promise<void> {
    const user = this.currentUserSubject.value;
    if (user) {
      await updateProfile(user, { displayName: displayName });
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      console.log('User logged out successfully');
      this.currentUserSubject.next(null);
      this.clearAutoLogoutTimer();
    } catch (error) {
      console.error('Logout failed:', error);
      this.notificationService.error('Logout failed');
    }
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  autoLogout() {
    this.logout();
    this.notificationService.info('Session expired due to inactivity');
  }

  getUsers(): Observable<UserProfile[]> {
    const usersRef = collection(this.firestore, 'users');
    return collectionData(usersRef, { idField: 'uid' }).pipe(
      map((users) =>
        users.filter((user) => user.uid !== this.currentUserSubject.value?.uid)
      )
    ) as Observable<UserProfile[]>;
  }
}
