import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$ = new BehaviorSubject<User | null>(null);
  allUsers: User[] = [];

  login(email: string, password: string) {
    if (this.allUsers.length > 0) {
      const foundUser = this.allUsers.find(
        (user) => user.email === email && user.password === password
      );
      if (foundUser) {
        this.user$.next(foundUser);
        if (this.isBrowser()) {
          localStorage.setItem('currentUser', JSON.stringify(foundUser));
        }
        return true;
      }
    }
    return false;
  }
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  register(displayName: string, email: string, password: string) {
    const userExists = this.allUsers.some((user) => user.email === email);
    if (userExists) {
      return false;
    }
    const newUser: User = {
      id: Math.random().toString(),
      email: email,
      password: password,
      displayName: displayName,
    };
    this.allUsers = [...this.allUsers, newUser];
    if (this.isBrowser()) {
      localStorage.setItem('users', JSON.stringify(this.allUsers));
      localStorage.setItem('currentUser', JSON.stringify(newUser));
    }
    this.user$.next(newUser);
    return true;
  }
  logout() {
    this.user$.next(null);
    if (this.isBrowser()) {
      localStorage.removeItem('currentUser');
    }
  }
  autoLogin() {
    if (this.isBrowser()) {
      const users = localStorage.getItem('users');
      console.log(users);
      if (users) {
        this.allUsers = JSON.parse(users);
      }

      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        this.user$.next(JSON.parse(currentUser));
      }
    }
  }
  autoLogout() {}
  isLoggedIn() {
    return this.user$.value !== null;
  }
}
