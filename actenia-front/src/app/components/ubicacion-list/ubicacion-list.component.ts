import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Ubicacion } from '../../models/ubicacion.model';
import { UbicacionService } from '../../services/ubicacion.service';

@Component({
  selector: 'app-ubicacion-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ubicacion-list.component.html',
  styleUrl: './ubicacion-list.component.css',
})
export class UbicacionListComponent implements OnInit {
  readonly ubicaciones = signal<Ubicacion[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly deletingId = signal<string | null>(null);

  constructor(private readonly ubicacionService: UbicacionService) {}

  ngOnInit(): void {
    void this.loadUbicaciones();
  }

  async loadUbicaciones(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      this.ubicaciones.set(await this.ubicacionService.getUbicaciones());
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No fue posible cargar las ubicaciones.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async deleteUbicacion(ubicacion: Ubicacion): Promise<void> {
    if (!ubicacion.id || !window.confirm(`¿Eliminar "${ubicacion.nombre}"?`)) return;

    this.errorMessage.set('');
    this.deletingId.set(ubicacion.id);
    try {
      await this.ubicacionService.deleteUbicacion(ubicacion.id);
      this.ubicaciones.update((items) => items.filter((item) => item.id !== ubicacion.id));
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No fue posible eliminar la ubicación.',
      );
    } finally {
      this.deletingId.set(null);
    }
  }
}
