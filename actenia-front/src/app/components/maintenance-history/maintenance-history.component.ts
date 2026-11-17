import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import type { EquipmentScheduleRecord } from '../../models/equipment.model';
import type { MaintenanceHistoryRecord } from '../../models/maintenance-history.model';
import type { TipoMantenimiento } from '../../models/tipo-mantenimiento.model';
import { EquipmentService } from '../../services/equipment.service';
import { MaintenanceService } from '../../services/maintenance.service';
import { TipoMantenimientoService } from '../../services/tipo-mantenimiento.service';
import {
  MaintenanceHistoryFormDialogComponent,
  MaintenanceHistoryFormDialogData,
} from './maintenance-history-form-dialog.component';

type MaintenanceTypeFilter = string;

@Component({
  selector: 'app-maintenance-history',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
  ],
  templateUrl: './maintenance-history.component.html',
  styleUrl: './maintenance-history.component.css',
})
export class MaintenanceHistoryComponent implements OnInit {
  readonly displayedColumns = [
    'inventory',
    'equipment',
    'date',
    'type',
    'activity',
    'responsible',
    'actions',
  ];
  readonly maintenanceTypes = signal<TipoMantenimiento[]>([]);
  readonly histories = signal<MaintenanceHistoryRecord[]>([]);
  readonly equipments = signal<EquipmentScheduleRecord[]>([]);
  readonly inventorySearch = signal('');
  readonly selectedType = signal<MaintenanceTypeFilter>('ALL');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly deletingId = signal<string | null>(null);
  readonly invalidDateRange = computed(
    () => Boolean(this.dateFrom() && this.dateTo()) && this.dateFrom() > this.dateTo(),
  );
  readonly filteredHistories = computed(() => {
    if (this.invalidDateRange()) return [];

    const inventorySearch = this.inventorySearch().trim().toLocaleLowerCase();
    const selectedType = this.selectedType();
    const dateFrom = this.dateFrom();
    const dateTo = this.dateTo();
    return this.histories().filter((record) => {
      const inventory = record.equipo?.numero_inventario?.toLocaleLowerCase() ?? '';
      return (
        (!inventorySearch || inventory.includes(inventorySearch)) &&
        (selectedType === 'ALL' || record.tipo_mantenimiento_id === selectedType) &&
        (!dateFrom || record.fecha >= dateFrom) &&
        (!dateTo || record.fecha <= dateTo)
      );
    });
  });

  constructor(
    private readonly equipmentService: EquipmentService,
    private readonly maintenanceService: MaintenanceService,
    private readonly tipoMantenimientoService: TipoMantenimientoService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    void this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    const [historyResult, equipmentResult, typeResult] = await Promise.allSettled([
      this.maintenanceService.listGlobal(),
      this.equipmentService.listForSchedule(),
      this.tipoMantenimientoService.getTiposMantenimiento(),
    ]);

    if (historyResult.status === 'fulfilled') {
      this.histories.set(historyResult.value);
    } else {
      this.errorMessage.set(
        this.errorText(historyResult.reason, 'No fue posible cargar el historial.'),
      );
    }

    if (equipmentResult.status === 'fulfilled') {
      this.equipments.set(equipmentResult.value);
    } else {
      const message = this.errorText(equipmentResult.reason, 'No fue posible cargar los equipos.');
      this.errorMessage.update((current) => (current ? `${current} ${message}` : message));
    }

    if (typeResult.status === 'fulfilled') {
      this.maintenanceTypes.set(typeResult.value);
    } else {
      const message = this.errorText(
        typeResult.reason,
        'No fue posible cargar los tipos de mantenimiento.',
      );
      this.errorMessage.update((current) => (current ? `${current} ${message}` : message));
    }

    this.loading.set(false);
  }

  onInventoryInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.inventorySearch.set(event.target.value);
    }
  }

  onTypeChange(type: MaintenanceTypeFilter): void {
    this.selectedType.set(type);
  }

  onDateFromChange(event: Event): void {
    if (event.target instanceof HTMLInputElement) this.dateFrom.set(event.target.value);
  }

  onDateToChange(event: Event): void {
    if (event.target instanceof HTMLInputElement) this.dateTo.set(event.target.value);
  }

  clearFilters(): void {
    this.inventorySearch.set('');
    this.selectedType.set('ALL');
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  typeLabel(record: MaintenanceHistoryRecord): string {
    const maintenanceType = Array.isArray(record.tipo_mantenimiento)
      ? record.tipo_mantenimiento[0]
      : record.tipo_mantenimiento;
    return maintenanceType?.nombre || '—';
  }

  trackHistory(_index: number, record: MaintenanceHistoryRecord): string {
    return record.id;
  }

  openForm(record: MaintenanceHistoryRecord | null = null): void {
    const types: Pick<TipoMantenimiento, 'id' | 'nombre'>[] = [
      ...this.maintenanceTypes(),
    ];
    const currentType = Array.isArray(record?.tipo_mantenimiento)
      ? record.tipo_mantenimiento[0]
      : record?.tipo_mantenimiento;
    if (currentType && !types.some((type) => type.id === currentType.id)) {
      types.unshift(currentType);
    }
    const dialogRef = this.dialog.open<
      MaintenanceHistoryFormDialogComponent,
      MaintenanceHistoryFormDialogData,
      boolean
    >(MaintenanceHistoryFormDialogComponent, {
      width: 'min(600px, calc(100vw - 32px))',
      maxWidth: '600px',
      autoFocus: 'first-tabbable',
      data: { equipments: this.equipments(), types, record },
    });

    dialogRef.afterClosed().subscribe((saved) => {
      if (saved) void this.loadData();
    });
  }

  async deleteHistory(record: MaintenanceHistoryRecord): Promise<void> {
    const equipmentName = record.equipo?.numero_inventario || record.equipo?.nombre || 'el equipo';
    if (!window.confirm(`¿Eliminar la intervención de ${equipmentName}?`)) return;

    this.deletingId.set(record.id);
    this.errorMessage.set('');
    try {
      await this.maintenanceService.deleteExecution(record.id);
      this.histories.update((items) => items.filter((item) => item.id !== record.id));
    } catch (error) {
      this.errorMessage.set(this.errorText(error, 'No fue posible eliminar la intervención.'));
    } finally {
      this.deletingId.set(null);
    }
  }

  private errorText(error: unknown, fallback: string): string {
    return error instanceof Error ? `${fallback} ${error.message}` : fallback;
  }
}
