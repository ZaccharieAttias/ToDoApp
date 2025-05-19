import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { NgIf, AsyncPipe } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [NgIf, AsyncPipe, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  isAuthenticated$ = this.authService.user$.pipe(map((user) => !!user));

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
