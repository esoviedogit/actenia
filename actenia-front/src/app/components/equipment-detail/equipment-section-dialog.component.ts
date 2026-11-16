import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, Signal, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EquipmentType } from '../../models/equipment-type.model';
import { Proveedor } from '../../models/proveedor.model';
import { Sede } from '../../models/sede.model';
import { Ubicacion } from '../../models/ubicacion.model';

export type EquipmentEditSection =
  'general' | 'technical' | 'location' | 'maintenance' | 'provider';
export type EquipmentDialogSection = EquipmentEditSection | 'maintenance-entry';

export interface EquipmentSectionDialogData {
  section: EquipmentDialogSection;
  form: FormGroup;
  equipmentTypes: EquipmentType[];
  providers: Proveedor[];
  sedes: Sede[];
  ubicaciones: Signal<Ubicacion[]>;
  loadingLocations: Signal<boolean>;
  locationError: Signal<string>;
  imageUrl: string | null;
  onSedeChange: () => void;
  onProviderChange: () => void;
  save: (image: File | null) => Promise<void>;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-equipment-section-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './equipment-section-dialog.component.html',
  styleUrl: './equipment-section-dialog.component.css',
})
export class EquipmentSectionDialogComponent implements OnDestroy {
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly imageUrl = signal<string | null>(null);
  private selectedImage: File | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) readonly data: EquipmentSectionDialogData,
    private readonly dialogRef: MatDialogRef<EquipmentSectionDialogComponent>,
  ) {
    this.imageUrl.set(data.imageUrl);
  }

  ngOnDestroy(): void {
    this.releasePreviewUrl();
  }

  get title(): string {
    switch (this.data.section) {
      case 'general':
        return 'Información general';
      case 'technical':
        return 'Datos técnicos y eléctricos';
      case 'location':
        return 'Ubicación';
      case 'maintenance':
        return 'Mantenimiento y calibración';
      case 'provider':
        return 'Datos del proveedor';
      case 'maintenance-entry':
        return 'Registrar intervención';
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.errorMessage.set('');
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      input.value = '';
      this.errorMessage.set('La imagen debe ser JPG, PNG, WebP, GIF o AVIF.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      input.value = '';
      this.errorMessage.set('La imagen no puede superar los 5 MB.');
      return;
    }

    this.releasePreviewUrl();
    this.selectedImage = file;
    this.imageUrl.set(URL.createObjectURL(file));
  }

  async submit(): Promise<void> {
    this.errorMessage.set('');
    this.data.form.markAllAsTouched();
    if (this.data.form.invalid) return;

    this.saving.set(true);
    try {
      await this.data.save(this.selectedImage);
      this.dialogRef.close(true);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No fue posible guardar los cambios.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  close(): void {
    this.dialogRef.close(false);
  }

  private releasePreviewUrl(): void {
    const url = this.imageUrl();
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    this.imageUrl.set(null);
  }
}
