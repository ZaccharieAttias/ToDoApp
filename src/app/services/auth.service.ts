import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private users: User[] = [];

  get currentUser$(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUsers(): User[] {
    return this.users;
  }

  login(email: string, password: string) {
    console.log('Attempting login for:', email);
    if (this.users.length > 0) {
      const foundUser = this.users.find(
        (user) => user.email === email && user.password === password
      );
      if (foundUser) {
        console.log('Login successful for:', email);
        this.currentUserSubject.next(foundUser);
        if (this.isBrowser()) {
          localStorage.setItem('currentUser', JSON.stringify(foundUser));
        }
        return true;
      }
    }
    console.log('Login failed for:', email);
    return false;
  }
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  register(displayName: string, email: string, password: string) {
    console.log('Attempting registration for:', email);
    const userExists = this.users.some((user) => user.email === email);
    if (userExists) {
      console.log('Registration failed - user already exists:', email);
      return false;
    }
    const newUser: User = {
      id: Math.random().toString(),
      email: email,
      password: password,
      displayName: displayName,
    };
    this.users = [...this.users, newUser];
    if (this.isBrowser()) {
      localStorage.setItem('users', JSON.stringify(this.users));
      localStorage.setItem('currentUser', JSON.stringify(newUser));
    }
    console.log('Registration successful for:', email);
    this.currentUserSubject.next(newUser);
    return true;
  }
  logout() {
    console.log('Logging out user:', this.currentUserSubject.value?.email);
    this.currentUserSubject.next(null);
    if (this.isBrowser()) {
      localStorage.removeItem('currentUser');
    }
  }
  autoLogin() {
    console.log('Attempting auto login');
    if (this.isBrowser()) {
      const users = localStorage.getItem('users');
      if (users) {
        try {
          this.users = JSON.parse(users);
          console.log('Loaded users from localStorage:', this.users.length);
        } catch (error) {
          console.error('Error parsing users from localStorage:', error);
          this.users = [];
        }
      }

      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        try {
          const parsedUser = JSON.parse(currentUser);

          const userExists = this.users.some(
            (user) => user.email === parsedUser.email
          );
          if (userExists) {
            console.log('Auto login successful for:', parsedUser.email);
            this.currentUserSubject.next(parsedUser);
          } else {
            console.log('Auto login failed - user not found in users');
            this.logout();
          }
        } catch (error) {
          console.error('Error parsing currentUser from localStorage:', error);
          this.logout();
        }
      } else {
        console.log('No current user found in localStorage');
      }
    }
  }
  autoLogout() {}
  isLoggedIn() {
    const isLoggedIn = this.currentUserSubject.value !== null;
    console.log('isLoggedIn check:', isLoggedIn);
    return isLoggedIn;
  }
}
