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
    console.log('Attempting login for:', email);
    if (this.allUsers.length > 0) {
      const foundUser = this.allUsers.find(
        (user) => user.email === email && user.password === password
      );
      if (foundUser) {
        console.log('Login successful for:', email);
        this.user$.next(foundUser);
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
    const userExists = this.allUsers.some((user) => user.email === email);
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
    this.allUsers = [...this.allUsers, newUser];
    if (this.isBrowser()) {
      localStorage.setItem('users', JSON.stringify(this.allUsers));
      localStorage.setItem('currentUser', JSON.stringify(newUser));
    }
    console.log('Registration successful for:', email);
    this.user$.next(newUser);
    return true;
  }
  logout() {
    console.log('Logging out user:', this.user$.value?.email);
    this.user$.next(null);
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
          this.allUsers = JSON.parse(users);
          console.log('Loaded users from localStorage:', this.allUsers.length);
        } catch (error) {
          console.error('Error parsing users from localStorage:', error);
          this.allUsers = [];
        }
      }

      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        try {
          const parsedUser = JSON.parse(currentUser);
          // Vérifier si l'utilisateur existe toujours dans allUsers
          const userExists = this.allUsers.some(
            (user) => user.email === parsedUser.email
          );
          if (userExists) {
            console.log('Auto login successful for:', parsedUser.email);
            this.user$.next(parsedUser);
          } else {
            console.log('Auto login failed - user not found in allUsers');
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
    const isLoggedIn = this.user$.value !== null;
    console.log('isLoggedIn check:', isLoggedIn);
    return isLoggedIn;
  }
}
