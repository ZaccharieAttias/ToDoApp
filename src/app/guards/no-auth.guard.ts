import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, of, switchMap, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class NoAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.authReady$.pipe(
      take(1),
      switchMap(() => {
        if (!this.authService.isLoggedIn()) {
          return of(true);
        } else {
          return of(this.router.createUrlTree(['/dashboard']));
        }
      })
    );
  }
}
