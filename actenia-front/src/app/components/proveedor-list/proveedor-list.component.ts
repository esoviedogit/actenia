import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Proveedor } from '../../models/proveedor.model';
import { ProveedorService } from '../../services/proveedor.service';

@Component({
  selector: 'app-proveedor-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './proveedor-list.component.html',
  styleUrl: './proveedor-list.component.css',
})
export class ProveedorListComponent implements OnInit {
  readonly proveedores = signal<Proveedor[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  constructor(private readonly proveedorService: ProveedorService) {}

  ngOnInit(): void {
    void this.loadProveedores();
  }

  async loadProveedores(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      this.proveedores.set(await this.proveedorService.getProveedores());
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No fue posible cargar los proveedores.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
