import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sede } from '../../models/sede.model';
import { SedeService } from '../../services/sede.service';

@Component({
  selector: 'app-sede-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sede-list.component.html',
  styleUrl: './sede-list.component.css',
})
export class SedeListComponent implements OnInit {
  readonly sedes = signal<Sede[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  constructor(private readonly sedeService: SedeService) {}

  ngOnInit(): void {
    void this.loadSedes();
  }

  async loadSedes(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      this.sedes.set(await this.sedeService.getSedes());
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No fue posible cargar las sedes.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
