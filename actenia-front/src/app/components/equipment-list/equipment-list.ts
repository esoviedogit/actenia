import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EquipmentRecord } from '../../models/equipment.model';
import { EquipmentService } from '../../services/equipment.service';
import { EquipmentAlert, getEquipmentAlert } from '../../utils/equipment-alerts';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink],
  templateUrl: './equipment-list.html',
  styleUrl: './equipment-list.css',
})
export class EquipmentListComponent implements OnInit {
  readonly equipos = signal<EquipmentRecord[]>([]);
  readonly searchTerm = signal('');
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly deletingId = signal<string | null>(null);
  readonly filteredEquipment = computed(() => {
    const search = this.searchTerm().trim().toLocaleLowerCase();
    const equipment = this.equipos();
    if (!search) return equipment;

    return equipment.filter((asset) =>
      [
        asset.numero_inventario,
        asset.nombre,
        asset.tipo_equipo?.nombre,
        asset.marca,
        asset.modelo,
        asset.serial,
      ].some((value) => value?.toLocaleLowerCase().includes(search)),
    );
  });

  constructor(private readonly equipmentService: EquipmentService) {}

  ngOnInit(): void {
    void this.loadEquipment();
  }

  alertFor(equipment: EquipmentRecord): EquipmentAlert {
    return getEquipmentAlert(equipment);
  }

  async loadEquipment(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      this.equipos.set(await this.equipmentService.list());
    } catch (error) {
      this.errorMessage.set(this.errorText(error, 'No fue posible cargar los equipos.'));
    } finally {
      this.loading.set(false);
    }
  }

  async deleteEquipment(equipment: EquipmentRecord): Promise<void> {
    if (!window.confirm(`¿Eliminar el equipo ${equipment.numero_inventario}?`)) return;

    this.deletingId.set(equipment.id);
    this.errorMessage.set('');
    try {
      await this.equipmentService.delete(equipment.id);
      this.equipos.update((items) => items.filter((item) => item.id !== equipment.id));
    } catch (error) {
      this.errorMessage.set(this.errorText(error, 'No fue posible eliminar el equipo.'));
    } finally {
      this.deletingId.set(null);
    }
  }

  private errorText(error: unknown, fallback: string): string {
    return error instanceof Error ? `${fallback} ${error.message}` : fallback;
  }
}
