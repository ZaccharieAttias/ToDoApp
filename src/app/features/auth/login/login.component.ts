import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { debounceTime } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';

let initialEmailValue = '';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  form = new FormGroup({
    email: new FormControl(initialEmailValue, {
      validators: [Validators.email, Validators.required],
    }),
    password: new FormControl('', {
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const subscription = this.form.valueChanges
      .pipe(debounceTime(500))
      .subscribe({
        next: (value) => {
          localStorage.setItem(
            'saved-login-form',
            JSON.stringify({ email: value.email })
          );
        },
      });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  onSubmit() {
    if (this.form.valid) {
      // const isLogin = this.authService.login(
      //   this.form.controls.email.value ?? '',
      //   this.form.controls.password.value ?? ''
      // );

      // if (isLogin) {
      //   this.router.navigate(['/dashboard']);
      // } else {
      //   this.notificationService.error('Login failed');
      // }

      this.authService
        .login(
          this.form.controls.email.value ?? '',
          this.form.controls.password.value ?? ''
        )
        .then((isLogin) => {
          if (isLogin) {
            this.router.navigate(['/dashboard']);
          } else {
            this.notificationService.error('Login failed');
          }
        });
    }
  }

  get emailIsInvalid() {
    return (
      this.form.controls.email.touched &&
      this.form.controls.email.dirty &&
      this.form.controls.email.invalid
    );
  }

  get passwordIsInvalid() {
    return (
      this.form.controls.password.touched &&
      this.form.controls.password.dirty &&
      this.form.controls.password.invalid
    );
  }
}
