import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EquipmentType } from '../../models/equipment-type.model';
import { EquipmentTypeService } from '../../services/equipment-type.service';

@Component({
  selector: 'app-equipment-type-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './equipment-type-list.component.html',
  styleUrl: './equipment-type-list.component.css',
})
export class EquipmentTypeListComponent implements OnInit {
  readonly equipmentTypes = signal<EquipmentType[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  constructor(
    private readonly equipmentTypeService: EquipmentTypeService,
    private readonly router: Router,
  ) {
    const navigation = this.router.getCurrentNavigation();
    const notice = navigation?.extras.state?.['successMessage'];
    if (typeof notice === 'string') this.successMessage.set(notice);
  }

  ngOnInit(): void {
    void this.loadEquipmentTypes();
  }

  async loadEquipmentTypes(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      this.equipmentTypes.set(await this.equipmentTypeService.getEquipmentTypes());
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No fue posible cargar los tipos de equipo.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  classificationLabel(value: EquipmentType['clasificacion_riesgo']): string {
    return value ? `Clase ${value}` : 'Sin clasificación';
  }
}
