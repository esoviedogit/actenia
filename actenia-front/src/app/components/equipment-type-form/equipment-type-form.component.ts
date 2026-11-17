import { CommonModule } from '@angular/common';
import { Component, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {
  EquipmentRiskClassification,
  EquipmentTypeService,
} from '../../services/equipment-type.service';
import { MAINTENANCE_FREQUENCIES } from '../../models/maintenance-frequency.model';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-equipment-type-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
  ],
  templateUrl: './equipment-type-form.component.html',
  styleUrl: './equipment-type-form.component.css',
})
export class EquipmentTypeFormComponent implements OnDestroy {
  readonly loading = signal(false);
  readonly loadingType = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly selectedImage = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly existingImageUrl = signal<string | null>(null);
  readonly equipmentTypeId: string | null;
  readonly maintenanceFrequencies = MAINTENANCE_FREQUENCIES;
  readonly form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly equipmentTypeService: EquipmentTypeService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.equipmentTypeId = this.route.snapshot.paramMap.get('id');
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      clasificacion_riesgo: ['', Validators.required],
      frecuencia_mantenimiento_meses: [null as number | null, Validators.required],
    });
    if (this.equipmentTypeId) void this.loadEquipmentType(this.equipmentTypeId);
  }

  ngOnDestroy(): void {
    this.releasePreviewUrl();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.errorMessage.set('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) {
      input.value = '';
      this.resetSelectedImage();
      this.errorMessage.set('El formato debe ser JPG, PNG, WebP, GIF o AVIF.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      input.value = '';
      this.resetSelectedImage();
      this.errorMessage.set('La imagen no puede superar los 5 MB.');
      return;
    }

    this.releasePreviewUrl();
    this.selectedImage.set(file);
    this.imagePreviewUrl.set(URL.createObjectURL(file));
  }

  private async loadEquipmentType(id: string): Promise<void> {
    this.loadingType.set(true);
    try {
      const equipmentType = await this.equipmentTypeService.getEquipmentTypeById(id);
      this.form.patchValue({
        nombre: equipmentType.nombre,
        clasificacion_riesgo: equipmentType.clasificacion_riesgo ?? '',
        frecuencia_mantenimiento_meses: equipmentType.frecuencia_mantenimiento_meses,
      });
      this.existingImageUrl.set(equipmentType.imagen_url ?? null);
      this.imagePreviewUrl.set(this.existingImageUrl());
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No fue posible cargar el tipo de equipo.',
      );
    } finally {
      this.loadingType.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.equipmentTypeId && this.loadingType()) return;

    this.loading.set(true);
    let uploadedImageUrl: string | null = null;
    try {
      const { nombre, clasificacion_riesgo, frecuencia_mantenimiento_meses } =
        this.form.getRawValue();
      if (
        !nombre ||
        !this.isRiskClassification(clasificacion_riesgo) ||
        frecuencia_mantenimiento_meses === null
      ) {
        this.form.markAllAsTouched();
        return;
      }

      const selectedImage = this.selectedImage();
      if (selectedImage) {
        uploadedImageUrl = await this.equipmentTypeService.uploadImage(selectedImage);
      }
      const payload = {
        nombre,
        clasificacion_riesgo,
        frecuencia_mantenimiento_meses,
        ...(uploadedImageUrl ? { imagen_url: uploadedImageUrl } : {}),
      };

      if (this.equipmentTypeId) {
        await this.equipmentTypeService.updateEquipmentType(this.equipmentTypeId, payload);
      } else {
        await this.equipmentTypeService.createEquipmentType(payload);
      }
      uploadedImageUrl = null;
      const successMessage = this.equipmentTypeId
        ? 'Tipo de equipo actualizado correctamente.'
        : 'Tipo de equipo registrado correctamente.';
      this.successMessage.set(successMessage);
      await this.router.navigate(['/tipos-equipo'], {
        state: { successMessage },
      });
    } catch (error) {
      let message =
        error instanceof Error ? error.message : 'No fue posible guardar el tipo de equipo.';
      if (uploadedImageUrl) {
        try {
          await this.equipmentTypeService.removeUploadedImage(uploadedImageUrl);
        } catch (cleanupError) {
          const cleanupMessage =
            cleanupError instanceof Error
              ? cleanupError.message
              : 'No fue posible limpiar la imagen que no quedó asociada.';
          message = `${message} Además, ${cleanupMessage}`;
        }
      }
      this.errorMessage.set(message);
    } finally {
      this.loading.set(false);
    }
  }

  private isRiskClassification(value: unknown): value is EquipmentRiskClassification {
    return typeof value === 'string' && ['I', 'IIa', 'IIb', 'III'].includes(value);
  }

  private releasePreviewUrl(): void {
    const currentUrl = this.imagePreviewUrl();
    if (currentUrl?.startsWith('blob:')) URL.revokeObjectURL(currentUrl);
  }

  private resetSelectedImage(): void {
    this.releasePreviewUrl();
    this.selectedImage.set(null);
    this.imagePreviewUrl.set(this.existingImageUrl());
  }
}
