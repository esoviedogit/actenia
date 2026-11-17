import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import type { EquipmentScheduleRecord } from '../../models/equipment.model';
import type { MaintenanceHistoryRecord } from '../../models/maintenance-history.model';
import type { TipoMantenimiento } from '../../models/tipo-mantenimiento.model';
import { MAINTENANCE_MONTHS } from '../../models/maintenance-month.model';
import { MaintenanceService } from '../../services/maintenance.service';

export interface MaintenanceHistoryFormDialogData {
  equipments: EquipmentScheduleRecord[];
  types: Pick<TipoMantenimiento, 'id' | 'nombre'>[];
  record: MaintenanceHistoryRecord | null;
}

@Component({
  selector: 'app-maintenance-history-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
  ],
  templateUrl: './maintenance-history-form-dialog.component.html',
  styleUrl: './maintenance-history-form-dialog.component.css',
})
export class MaintenanceHistoryFormDialogComponent {
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly form: FormGroup<{
    equipo_id: FormControl<string>;
    tipo_mantenimiento_id: FormControl<string>;
    fecha: FormControl<string>;
    observaciones: FormControl<string>;
  }>;

  constructor(
    @Inject(MAT_DIALOG_DATA) readonly data: MaintenanceHistoryFormDialogData,
    private readonly fb: FormBuilder,
    private readonly maintenanceService: MaintenanceService,
    private readonly dialogRef: MatDialogRef<MaintenanceHistoryFormDialogComponent>,
  ) {
    const record = data.record;
    this.form = this.fb.nonNullable.group({
      equipo_id: this.fb.nonNullable.control(record?.equipo_id ?? '', Validators.required),
      tipo_mantenimiento_id: this.fb.nonNullable.control(
        record?.tipo_mantenimiento_id ?? data.types[0]?.id ?? '',
        Validators.required,
      ),
      fecha: this.fb.nonNullable.control(record?.fecha ?? localDate(), Validators.required),
      observaciones: this.fb.nonNullable.control(record?.observaciones ?? '', [
        Validators.required,
        Validators.maxLength(4000),
      ]),
    });
  }

  get title(): string {
    return this.data.record ? 'Editar intervención' : 'Nueva intervención';
  }

  async save(): Promise<void> {
    this.errorMessage.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    const values = this.form.getRawValue();
    const dateMatch = /^(\d{4})-(\d{2})-\d{2}$/.exec(values.fecha);
    const year = Number(dateMatch?.[1]);
    const monthNumber = Number(dateMatch?.[2]);
    const month = MAINTENANCE_MONTHS.find((_, index) => index + 1 === monthNumber);
    if (!dateMatch || !month || !Number.isInteger(year)) {
      this.errorMessage.set('Ingresa una fecha de mantenimiento válida.');
      return;
    }

    this.saving.set(true);
    try {
      const payload = {
        equipo_id: values.equipo_id,
        tipo_mantenimiento_id: values.tipo_mantenimiento_id,
        fecha: values.fecha,
        descripcion: values.observaciones.trim(),
        observaciones: values.observaciones.trim(),
        mes_programado: month.value,
        anio: year,
      };
      if (this.data.record) {
        await this.maintenanceService.updateExecution(this.data.record.id, payload);
      } else {
        await this.maintenanceService.recordExecution(payload);
      }
      this.dialogRef.close(true);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No fue posible guardar la intervención.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

function localDate(): string {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}
