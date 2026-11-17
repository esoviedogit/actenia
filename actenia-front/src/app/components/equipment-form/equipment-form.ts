import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {
  Equipment,
  EquipmentCatalogs,
  EquipmentPayload,
  EquipmentStatus,
  InvimaRiskClassification,
} from '../../models/equipment.model';
import { EquipmentService } from '../../services/equipment.service';
import { EquipmentImageService } from '../../services/equipment-image.service';
import { EquipmentType } from '../../models/equipment-type.model';
import { Sede } from '../../models/sede.model';
import { SedeService } from '../../services/sede.service';
import { Ubicacion } from '../../models/ubicacion.model';
import { UbicacionService } from '../../services/ubicacion.service';
import { EquipmentTypeService } from '../../services/equipment-type.service';
import { MAINTENANCE_FREQUENCIES } from '../../models/maintenance-frequency.model';
import { MAINTENANCE_MONTHS } from '../../models/maintenance-month.model';

@Component({
  selector: 'app-equipment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
  ],
  templateUrl: './equipment-form.html',
  styleUrl: './equipment-form.css',
})
export class EquipmentFormComponent implements OnInit, OnDestroy {
  readonly equipmentForm: FormGroup;

  catalogs: EquipmentCatalogs = {
    proveedores: [],
  };
  readonly sedes = signal<Sede[]>([]);
  readonly ubicaciones = signal<Ubicacion[]>([]);
  readonly tiposEquipo = signal<EquipmentType[]>([]);
  readonly maintenanceFrequencies = MAINTENANCE_FREQUENCIES;
  readonly maintenanceMonths = MAINTENANCE_MONTHS;
  readonly selectedEquipmentType = signal<EquipmentType | null>(null);
  readonly selectedImage = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly existingImageUrl = signal<string | null>(null);
  readonly loadingUbicaciones = signal(false);
  readonly loading = signal(false);
  readonly loadingForm = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly equipmentId: string | null;
  private ubicacionRequestId = 0;

  constructor(
    private readonly fb: FormBuilder,
    private readonly equipmentService: EquipmentService,
    private readonly equipmentImageService: EquipmentImageService,
    private readonly sedeService: SedeService,
    private readonly ubicacionService: UbicacionService,
    private readonly equipmentTypeService: EquipmentTypeService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.equipmentId = this.route.snapshot.paramMap.get('id');
    this.equipmentForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      numero_inventario: ['', [Validators.required, Validators.maxLength(50)]],
      tipo_equipo_id: ['', Validators.required],
      marca: ['', Validators.maxLength(100)],
      modelo: ['', Validators.maxLength(100)],
      serial: ['', Validators.maxLength(100)],
      fabricante: ['', Validators.maxLength(100)],
      fecha_adquisicion: [''],
      garantia_periodo: ['', Validators.maxLength(50)],
      vida_util_anios: [null as number | null, [Validators.min(1)]],
      clasificacion_riesgo_invima: [null as InvimaRiskClassification | null],
      registro_sanitario_invima: [
        '',
        [Validators.maxLength(100), Validators.pattern(/^[a-zA-Z0-9./-]*$/)],
      ],
      estado: ['EN USO' as EquipmentStatus, Validators.required],
      sede_id: ['', Validators.required],
      consultorio_id: ['', Validators.required],
      proveedor_id: [''],
      especificaciones_electricas: this.fb.group({
        voltaje: [''],
        frecuencia: [''],
        potencia: [''],
        amperaje: [''],
        corriente: ['AC'],
        usa_bateria: [false],
        usa_adaptador: [true],
        tipo_bateria: [''],
        voltaje_adaptador: [''],
        amperaje_adaptador: [''],
      }),
      dimensiones: this.fb.group({
        peso_kg: [null as number | null, [Validators.min(0)]],
        largo_mm: [null as number | null, [Validators.min(0)]],
        ancho_mm: [null as number | null, [Validators.min(0)]],
        alto_mm: [null as number | null, [Validators.min(0)]],
      }),
      requiere_calibracion: [false],
      frecuencia_calibracion: [''],
      frecuencia_mantenimiento_meses: [null as number | null],
      meses_programados: this.fb.nonNullable.control<string[]>([]),
      fecha_proximo_mantenimiento: [''],
      fecha_proxima_calibracion: [''],
      observaciones: [''],
      manual_usuario_url: ['', Validators.maxLength(2048)],
      qr_code_url: ['', Validators.maxLength(2048)],
    });
    this.equipmentForm.get('consultorio_id')?.disable();
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
      this.errorMessage.set('La foto debe estar en formato JPG, PNG, WebP, GIF o AVIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      input.value = '';
      this.resetSelectedImage();
      this.errorMessage.set('La foto no puede superar los 5 MB.');
      return;
    }

    this.releasePreviewUrl();
    this.selectedImage.set(file);
    this.imagePreviewUrl.set(URL.createObjectURL(file));
  }

  async onSedeChange(): Promise<void> {
    const ubicacionControl = this.equipmentForm.get('consultorio_id');
    ubicacionControl?.reset('');
    const sedeId = this.equipmentForm.get('sede_id')?.value;
    await this.loadUbicaciones(typeof sedeId === 'string' ? sedeId : '');
  }

  onEquipmentTypeChange(event?: Event): void {
    const selectedId =
      event?.target instanceof HTMLSelectElement
        ? event.target.value
        : this.equipmentForm.get('tipo_equipo_id')?.value;
    this.selectedEquipmentType.set(
      this.tiposEquipo().find((type) => type.id === selectedId) ?? null,
    );
  }

  async ngOnInit(): Promise<void> {
    try {
      const [catalogs, sedes, tiposEquipo] = await Promise.all([
        this.equipmentService.getCatalogs(),
        this.sedeService.getSedes(),
        this.equipmentTypeService.getEquipmentTypes(),
      ]);
      this.catalogs = catalogs;
      this.sedes.set(sedes);
      this.tiposEquipo.set(tiposEquipo);
      if (this.equipmentId) {
        const equipment = await this.equipmentService.getById(this.equipmentId);
        this.equipmentForm.patchValue({
          ...equipment,
          especificaciones_electricas: equipment.especificaciones_electricas ?? undefined,
          dimensiones: equipment.dimensiones ?? undefined,
        });
        this.existingImageUrl.set(equipment.imagen_url ?? null);
        this.imagePreviewUrl.set(this.existingImageUrl());
        this.onEquipmentTypeChange();
        if (equipment.sede_id) {
          await this.loadUbicaciones(equipment.sede_id);
        }
      }
    } catch (error) {
      this.errorMessage.set(this.errorText(error, 'No fue posible cargar el formulario.'));
    } finally {
      this.loadingForm.set(false);
    }
  }

  private async loadUbicaciones(sedeId: string): Promise<void> {
    const requestId = ++this.ubicacionRequestId;
    const control = this.equipmentForm.get('consultorio_id');
    if (!sedeId) {
      this.ubicaciones.set([]);
      this.loadingUbicaciones.set(false);
      control?.disable();
      return;
    }

    this.loadingUbicaciones.set(true);
    control?.disable();
    this.errorMessage.set('');
    try {
      const ubicaciones = await this.ubicacionService.getUbicacionesBySede(sedeId);
      if (requestId === this.ubicacionRequestId) {
        this.ubicaciones.set(ubicaciones);
        control?.enable();
      }
    } catch (error) {
      if (requestId === this.ubicacionRequestId) {
        this.ubicaciones.set([]);
        this.errorMessage.set(this.errorText(error, 'No fue posible cargar las ubicaciones.'));
      }
    } finally {
      if (requestId === this.ubicacionRequestId) {
        this.loadingUbicaciones.set(false);
      }
    }
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');
    if (this.equipmentForm.invalid) {
      this.equipmentForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    let uploadedImageUrl: string | null = null;
    try {
      const selectedImage = this.selectedImage();
      if (selectedImage) {
        uploadedImageUrl = await this.equipmentImageService.upload(selectedImage, 'assets');
      }
      const payload = this.toPayload(uploadedImageUrl ?? this.existingImageUrl());
      if (this.equipmentId) {
        await this.equipmentService.update(this.equipmentId, payload);
      } else {
        await this.equipmentService.createEquipment(this.toEquipment(payload));
      }
      uploadedImageUrl = null;
      this.successMessage.set('Activo guardado correctamente.');
      await this.router.navigate(['/equipment-list']);
    } catch (error) {
      let message = this.errorText(error, 'No fue posible guardar el activo.');
      if (uploadedImageUrl) {
        try {
          await this.equipmentImageService.remove(uploadedImageUrl);
        } catch (cleanupError) {
          message += ` No se pudo limpiar la foto subida: ${this.errorText(cleanupError, 'error de almacenamiento.')}`;
        }
      }
      this.errorMessage.set(message);
    } finally {
      this.loading.set(false);
    }
  }

  private toPayload(imageUrl: string | null = this.existingImageUrl()): EquipmentPayload {
    const value = this.equipmentForm.getRawValue();
    return {
      nombre: value.nombre?.trim() ?? '',
      numero_inventario: value.numero_inventario?.trim() ?? '',
      tipo_equipo_id: this.nullIfEmpty(value.tipo_equipo_id),
      marca: this.nullIfEmpty(value.marca),
      modelo: this.nullIfEmpty(value.modelo),
      serial: this.nullIfEmpty(value.serial),
      fabricante: this.nullIfEmpty(value.fabricante),
      fecha_adquisicion: this.nullIfEmpty(value.fecha_adquisicion),
      garantia_periodo: this.nullIfEmpty(value.garantia_periodo),
      vida_util_anios: value.vida_util_anios,
      clasificacion_riesgo_invima: value.clasificacion_riesgo_invima || null,
      registro_sanitario_invima: this.nullIfEmpty(value.registro_sanitario_invima),
      estado: value.estado ?? 'EN USO',
      sede_id: this.nullIfEmpty(value.sede_id),
      consultorio_id: this.nullIfEmpty(value.consultorio_id),
      proveedor_id: this.nullIfEmpty(value.proveedor_id),
      especificaciones_electricas: {
        voltaje: value.especificaciones_electricas.voltaje ?? '',
        frecuencia: value.especificaciones_electricas.frecuencia ?? '',
        potencia: value.especificaciones_electricas.potencia ?? '',
        amperaje: value.especificaciones_electricas.amperaje ?? '',
        corriente: value.especificaciones_electricas.corriente ?? 'AC',
        usa_bateria: value.especificaciones_electricas.usa_bateria ?? false,
        usa_adaptador: value.especificaciones_electricas.usa_adaptador ?? false,
        tipo_bateria: this.nullIfEmpty(value.especificaciones_electricas.tipo_bateria),
        voltaje_adaptador: this.nullIfEmpty(value.especificaciones_electricas.voltaje_adaptador),
        amperaje_adaptador: this.nullIfEmpty(value.especificaciones_electricas.amperaje_adaptador),
      },
      dimensiones: value.dimensiones,
      requiere_calibracion: value.requiere_calibracion ?? false,
      frecuencia_calibracion: this.nullIfEmpty(value.frecuencia_calibracion),
      frecuencia_mantenimiento_meses:
        value.frecuencia_mantenimiento_meses === '' || value.frecuencia_mantenimiento_meses === null
          ? null
          : Number(value.frecuencia_mantenimiento_meses),
      meses_programados: value.meses_programados ?? [],
      fecha_proximo_mantenimiento: this.nullIfEmpty(value.fecha_proximo_mantenimiento),
      fecha_proxima_calibracion: this.nullIfEmpty(value.fecha_proxima_calibracion),
      observaciones: this.nullIfEmpty(value.observaciones),
      manual_usuario_url: this.nullIfEmpty(value.manual_usuario_url),
      qr_code_url: this.nullIfEmpty(value.qr_code_url),
      imagen_url: imageUrl,
    };
  }

  private toEquipment(payload: EquipmentPayload): Partial<Equipment> {
    const sedeId = payload.sede_id;
    const ubicacionId = payload.consultorio_id;
    const tipoId = payload.tipo_equipo_id;
    if (!sedeId || !ubicacionId || !tipoId) {
      throw new Error('Selecciona una sede, ubicación y tipo de activo.');
    }

    return {
      nombre: payload.nombre,
      numero_inventario: payload.numero_inventario,
      sede_id: sedeId,
      ubicacion_id: ubicacionId,
      tipo_id: tipoId,
      estado: payload.estado,
      marca: payload.marca,
      modelo: payload.modelo,
      serie: payload.serial,
      fabricante: payload.fabricante,
      fecha_adquisicion: payload.fecha_adquisicion,
      garantia_periodo: payload.garantia_periodo,
      vida_util_anios: payload.vida_util_anios,
      clasificacion_riesgo_invima: payload.clasificacion_riesgo_invima,
      registro_sanitario_invima: payload.registro_sanitario_invima,
      proveedor_id: payload.proveedor_id,
      especificaciones_electricas: payload.especificaciones_electricas,
      dimensiones: payload.dimensiones,
      requiere_calibracion: payload.requiere_calibracion,
      frecuencia_calibracion: payload.frecuencia_calibracion,
      frecuencia_mantenimiento_meses: payload.frecuencia_mantenimiento_meses,
      meses_programados: payload.meses_programados,
      fecha_mantenimiento: payload.fecha_proximo_mantenimiento,
      fecha_calibracion: payload.fecha_proxima_calibracion,
      observaciones: payload.observaciones,
      manual_usuario_url: payload.manual_usuario_url,
      qr_code_url: payload.qr_code_url,
      imagen_url: payload.imagen_url,
    };
  }

  private nullIfEmpty(value: string | null): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private errorText(error: unknown, fallback: string): string {
    return error instanceof Error ? `${fallback} ${error.message}` : fallback;
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
