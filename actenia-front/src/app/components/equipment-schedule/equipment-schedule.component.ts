import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import type { EquipmentScheduleRecord } from '../../models/equipment.model';
import type { MaintenanceExecution } from '../../models/maintenance-history.model';
import { MAINTENANCE_MONTHS } from '../../models/maintenance-month.model';
import type { MaintenanceMonth } from '../../models/maintenance-month.model';
import type { TipoMantenimiento } from '../../models/tipo-mantenimiento.model';
import { EquipmentService } from '../../services/equipment.service';
import { MaintenanceService } from '../../services/maintenance.service';
import { TipoMantenimientoService } from '../../services/tipo-mantenimiento.service';
import {
  MaintenanceExecutionDialogComponent,
  MaintenanceExecutionDialogData,
} from './maintenance-execution-dialog.component';
import {
  formatMaintenanceDate,
  getMaintenanceDateParts,
  isEquipmentAvailableInScheduleYear,
  maintenanceDateTime,
} from './equipment-schedule.utils';

interface ScheduleCell {
  scheduled: boolean;
  executions: MaintenanceExecution[];
}

interface ScheduleRow {
  equipment: EquipmentScheduleRecord;
  cells: ReadonlyMap<MaintenanceMonth, ScheduleCell>;
}

type MaintenanceMonthOption = (typeof MAINTENANCE_MONTHS)[number];

@Component({
  selector: 'app-equipment-schedule',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatOptionModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
  ],
  templateUrl: './equipment-schedule.component.html',
  styleUrl: './equipment-schedule.component.css',
})
export class EquipmentScheduleComponent implements OnInit {
  readonly months = MAINTENANCE_MONTHS;
  readonly selectedYear = signal(new Date().getFullYear());
  readonly selectedMonth = signal<MaintenanceMonth | null>(null);
  readonly years = Array.from({ length: 11 }, (_, index) => this.selectedYear() - 5 + index);
  readonly visibleMonths = computed<MaintenanceMonthOption[]>(() => {
    const selectedMonth = this.selectedMonth();
    return selectedMonth
      ? this.months.filter((month) => month.value === selectedMonth)
      : [...this.months];
  });
  readonly displayedColumns = computed(() => [
    'equipment',
    ...this.visibleMonths().map((month) => month.value),
  ]);
  readonly equipment = signal<EquipmentScheduleRecord[]>([]);
  readonly executions = signal<MaintenanceExecution[]>([]);
  readonly maintenanceTypes = signal<TipoMantenimiento[]>([]);
  readonly equipmentError = signal('');
  readonly executionsError = signal('');
  readonly maintenanceTypesError = signal('');
  readonly loadingEquipment = signal(true);
  readonly loadingExecutions = signal(true);
  readonly loadingTypes = signal(true);
  private executionRequestId = 0;
  readonly loading = computed(
    () => this.loadingEquipment() || this.loadingExecutions() || this.loadingTypes(),
  );
  readonly errorMessage = computed(() =>
    [this.equipmentError(), this.executionsError(), this.maintenanceTypesError()]
      .filter(Boolean)
      .join(' '),
  );
  readonly eligibleEquipment = computed(() => {
    const selectedYear = this.selectedYear();
    return this.equipment().filter((equipment) => {
      return isEquipmentAvailableInScheduleYear(equipment.fecha_adquisicion, selectedYear);
    });
  });
  readonly scheduleRows = computed<ScheduleRow[]>(() => {
    const executionBySlot = new Map<string, MaintenanceExecution[]>();
    for (const execution of this.executions()) {
      if (execution.estado !== 'Realizado') continue;
      const dateParts = getMaintenanceDateParts(execution.fecha);
      if (!dateParts || dateParts.year !== this.selectedYear()) continue;
      const executionMonth = this.months[dateParts.month - 1]?.value;
      if (!executionMonth) continue;

      const key = this.slotKey(execution.equipo_id, executionMonth);
      const slotExecutions = executionBySlot.get(key) ?? [];
      slotExecutions.push(execution);
      executionBySlot.set(key, slotExecutions);
    }

    return this.eligibleEquipment().map((equipment) => ({
      equipment,
      cells: new Map(
        this.months.map((month) => [
          month.value,
          {
            scheduled: equipment.meses_programados?.includes(month.value) ?? false,
            executions: executionBySlot.get(this.slotKey(equipment.id, month.value)) ?? [],
          },
        ]),
      ),
    }));
  });
  readonly scheduledCount = computed(() =>
    this.scheduleRows().reduce(
      (total, row) => total + [...row.cells.values()].filter((cell) => cell.scheduled).length,
      0,
    ),
  );
  readonly completedCount = computed(() =>
    this.scheduleRows().reduce(
      (total, row) =>
        total + [...row.cells.values()].filter((cell) => cell.executions.length > 0).length,
      0,
    ),
  );
  readonly pendingCount = computed(() =>
    this.scheduleRows().reduce(
      (total, row) =>
        total +
        [...row.cells.values()].filter((cell) => cell.scheduled && cell.executions.length === 0)
          .length,
      0,
    ),
  );
  readonly visibleRows = computed(() => {
    const selectedMonth = this.selectedMonth();
    return this.scheduleRows().filter(
      (row) => selectedMonth === null || row.cells.get(selectedMonth)?.scheduled,
    );
  });

  constructor(
    private readonly equipmentService: EquipmentService,
    private readonly maintenanceService: MaintenanceService,
    private readonly tipoMantenimientoService: TipoMantenimientoService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    void this.loadEquipment();
    void this.loadExecutions(this.selectedYear());
    void this.loadMaintenanceTypes();
  }

  onYearChange(year: number): void {
    if (!Number.isInteger(year) || year === this.selectedYear()) return;
    this.selectedYear.set(year);
    void this.loadExecutions(year);
  }

  onMonthChange(month: MaintenanceMonth | null): void {
    this.selectedMonth.set(month);
  }

  trackEquipment(_index: number, row: ScheduleRow): string {
    return row.equipment.id;
  }

  maintenanceTypeLabel(execution: MaintenanceExecution): string {
    const maintenanceType = Array.isArray(execution.tipo_mantenimiento)
      ? execution.tipo_mantenimiento[0]
      : execution.tipo_mantenimiento;
    return maintenanceType?.nombre || 'Mantenimiento';
  }

  maintenanceDateLabel(date: string): string {
    return formatMaintenanceDate(date);
  }

  maintenanceDateTime(date: string): string | null {
    return maintenanceDateTime(date);
  }

  openExecutionDialog(
    equipment: EquipmentScheduleRecord,
    month: (typeof MAINTENANCE_MONTHS)[number],
  ): void {
    this.dialog
      .open<
        MaintenanceExecutionDialogComponent,
        MaintenanceExecutionDialogData,
        MaintenanceExecution
      >(MaintenanceExecutionDialogComponent, {
        width: 'min(480px, calc(100vw - 32px))',
        maxWidth: '480px',
        autoFocus: 'first-tabbable',
        data: {
          equipoId: equipment.id,
          equipoNombre: equipment.nombre,
          mes: month.value,
          mesLabel: month.label,
          anio: this.selectedYear(),
          types: this.maintenanceTypes(),
        },
      })
      .afterClosed()
      .subscribe((execution) => {
        if (execution) this.executions.update((items) => [execution, ...items]);
      });
  }

  private async loadEquipment(): Promise<void> {
    this.loadingEquipment.set(true);
    this.equipmentError.set('');
    try {
      this.equipment.set(await this.equipmentService.listForSchedule());
    } catch (error) {
      this.equipmentError.set(
        error instanceof Error ? error.message : 'No fue posible cargar los equipos.',
      );
    } finally {
      this.loadingEquipment.set(false);
    }
  }

  private async loadExecutions(year: number): Promise<void> {
    const requestId = ++this.executionRequestId;
    this.loadingExecutions.set(true);
    this.executionsError.set('');
    try {
      const executions = await this.maintenanceService.listForYear(year);
      if (requestId === this.executionRequestId) this.executions.set(executions);
    } catch (error) {
      if (requestId === this.executionRequestId) {
        this.executionsError.set(
          error instanceof Error ? error.message : 'No fue posible cargar el historial anual.',
        );
      }
    } finally {
      if (requestId === this.executionRequestId) this.loadingExecutions.set(false);
    }
  }

  private async loadMaintenanceTypes(): Promise<void> {
    this.loadingTypes.set(true);
    this.maintenanceTypesError.set('');
    try {
      this.maintenanceTypes.set(await this.tipoMantenimientoService.getTiposMantenimiento());
    } catch (error) {
      this.maintenanceTypesError.set(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar los tipos de mantenimiento.',
      );
    } finally {
      this.loadingTypes.set(false);
    }
  }

  private slotKey(equipmentId: string, month: MaintenanceMonth): string {
    return `${equipmentId}:${month}`;
  }
}
