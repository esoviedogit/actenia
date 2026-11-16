import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  standalone: true,
})
export class App {
  protected readonly title = signal('Actenia');
  logoutError = '';

  constructor(
    readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  async logout(): Promise<void> {
    this.logoutError = '';
    try {
      await this.auth.logout();
      await this.router.navigate(['/login']);
    } catch (error) {
      this.logoutError = error instanceof Error ? error.message : 'No fue posible cerrar sesión.';
    }
  }
}
