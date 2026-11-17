import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import type { TipoMantenimiento } from '../../models/tipo-mantenimiento.model';
import { MAINTENANCE_MONTHS } from '../../models/maintenance-month.model';
import type { MaintenanceMonth } from '../../models/maintenance-month.model';
import { MaintenanceService } from '../../services/maintenance.service';

export interface MaintenanceExecutionDialogData {
  equipoId: string;
  equipoNombre: string;
  mes: MaintenanceMonth;
  mesLabel: string;
  anio: number;
  types: TipoMantenimiento[];
}

@Component({
  selector: 'app-maintenance-execution-dialog',
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
  templateUrl: './maintenance-execution-dialog.component.html',
  styleUrl: './maintenance-execution-dialog.component.css',
})
export class MaintenanceExecutionDialogComponent {
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly dateMin: string;
  readonly dateMax: string;
  readonly form: FormGroup<{
    fecha: FormControl<string>;
    tipo_mantenimiento_id: FormControl<string>;
  }>;

  constructor(
    @Inject(MAT_DIALOG_DATA) readonly data: MaintenanceExecutionDialogData,
    private readonly fb: FormBuilder,
    private readonly maintenanceService: MaintenanceService,
    private readonly dialogRef: MatDialogRef<MaintenanceExecutionDialogComponent>,
  ) {
    const monthIndex = MAINTENANCE_MONTHS.findIndex((month) => month.value === data.mes);
    const month = String(monthIndex + 1).padStart(2, '0');
    this.dateMin = `${data.anio}-${month}-01`;
    this.dateMax = `${data.anio}-${month}-${String(
      new Date(data.anio, monthIndex + 1, 0).getDate(),
    ).padStart(2, '0')}`;
    const today = new Date();
    const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 10);
    const defaultDate =
      localToday >= this.dateMin && localToday <= this.dateMax ? localToday : this.dateMin;

    this.form = this.fb.nonNullable.group({
      fecha: this.fb.nonNullable.control(defaultDate, Validators.required),
      tipo_mantenimiento_id: this.fb.nonNullable.control(
        data.types[0]?.id ?? '',
        Validators.required,
      ),
    });
  }

  async save(): Promise<void> {
    this.errorMessage.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    try {
      const execution = await this.maintenanceService.recordExecution({
        equipo_id: this.data.equipoId,
        tipo_mantenimiento_id: this.form.controls.tipo_mantenimiento_id.value,
        fecha: this.form.controls.fecha.value,
        mes_programado: this.data.mes,
        anio: this.data.anio,
      });
      this.dialogRef.close(execution);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No fue posible registrar el mantenimiento.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
