import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  readonly loginForm: FormGroup;

  loading = false;
  errorMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.loginForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      password: ['', [Validators.required, Validators.maxLength(128)]],
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.auth.sessionReady;
      if (await this.auth.getCurrentUser()) {
        await this.router.navigate(['/equipment-list']);
      }
    } catch (error) {
      this.errorMessage = this.errorText(error);
    }
  }

  async onSubmit(): Promise<void> {
    this.errorMessage = '';
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    try {
      const { email, password } = this.loginForm.getRawValue();
      await this.auth.login(email, password);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(this.safeReturnUrl(returnUrl));
    } catch (error) {
      this.errorMessage = this.errorText(error);
    } finally {
      this.loading = false;
    }
  }

  private safeReturnUrl(returnUrl: string | null): string {
    if (!returnUrl?.startsWith('/') || returnUrl.startsWith('//')) {
      return '/equipment-list';
    }
    return returnUrl;
  }

  private errorText(error: unknown): string {
    if (error instanceof Error && /invalid login credentials/i.test(error.message)) {
      return 'El correo o la contraseña no son correctos.';
    }
    return error instanceof Error
      ? `No fue posible iniciar sesión. ${error.message}`
      : 'No fue posible iniciar sesión. Inténtalo de nuevo.';
  }
}
