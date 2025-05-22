import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserNameResolver implements Resolve<string> {
  constructor(private authService: AuthService, private router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<string> {
    const requestedUserName = route.paramMap.get('userName');
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return of('');
    }

    if (requestedUserName !== currentUser.displayName) {
      // Rediriger vers le profil de l'utilisateur connecté
      this.router.navigate([`/${currentUser.displayName}`]);
      return of('');
    }

    return of(currentUser.displayName);
  }
}
