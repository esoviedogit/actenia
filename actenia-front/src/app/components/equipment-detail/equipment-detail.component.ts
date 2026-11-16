import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  EquipmentMaintenance,
  EquipmentMaintenanceType,
} from '../../models/equipment-maintenance.model';
import {
  EquipmentPayload,
  EquipmentRecord,
  EquipmentStatus,
  InvimaRiskClassification,
} from '../../models/equipment.model';
import { Proveedor } from '../../models/proveedor.model';
import { EquipmentImageService } from '../../services/equipment-image.service';
import { EquipmentMaintenanceService } from '../../services/equipment-maintenance.service';
import { EquipmentService } from '../../services/equipment.service';
import { EquipmentTypeService } from '../../services/equipment-type.service';
import { ProveedorService } from '../../services/proveedor.service';
import { Sede } from '../../models/sede.model';
import { SedeService } from '../../services/sede.service';
import { Ubicacion } from '../../models/ubicacion.model';
import { UbicacionService } from '../../services/ubicacion.service';
import { EquipmentType } from '../../models/equipment-type.model';
import {
  EquipmentDialogSection,
  EquipmentEditSection,
  EquipmentSectionDialogComponent,
} from './equipment-section-dialog.component';

@Component({
  selector: 'app-equipment-detail',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './equipment-detail.component.html',
  styleUrl: './equipment-detail.component.css',
})
export class EquipmentDetailComponent implements OnInit {
  readonly equipment = signal<EquipmentRecord | null>(null);
  readonly maintenanceHistory = signal<EquipmentMaintenance[]>([]);
  readonly providers = signal<Proveedor[]>([]);
  readonly equipmentTypes = signal<EquipmentType[]>([]);
  readonly sedes = signal<Sede[]>([]);
  readonly ubicaciones = signal<Ubicacion[]>([]);
  readonly loading = signal(true);
  readonly loadingLocations = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly generalForm: FormGroup;
  readonly technicalForm: FormGroup;
  readonly locationForm: FormGroup;
  readonly maintenancePlanForm: FormGroup;
  readonly providerForm: FormGroup;
  readonly maintenanceForm: FormGroup;
  readonly equipmentId: string;
  private locationRequestId = 0;

  constructor(
    private readonly fb: FormBuilder,
    private readonly equipmentService: EquipmentService,
    private readonly maintenanceService: EquipmentMaintenanceService,
    private readonly equipmentImageService: EquipmentImageService,
    private readonly equipmentTypeService: EquipmentTypeService,
    private readonly proveedorService: ProveedorService,
    private readonly sedeService: SedeService,
    private readonly ubicacionService: UbicacionService,
    private readonly route: ActivatedRoute,
    private readonly dialog: MatDialog,
  ) {
    this.equipmentId = this.route.snapshot.paramMap.get('id') ?? '';
    this.generalForm = this.fb.group({
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
      registro_sanitario_invima: ['', Validators.maxLength(100)],
      estado: ['EN USO' as EquipmentStatus, Validators.required],
    });
    this.technicalForm = this.fb.group({
      especificaciones_electricas: this.fb.group({
        voltaje: [''],
        frecuencia: [''],
        potencia: [''],
        amperaje: [''],
        corriente: ['AC'],
        usa_bateria: [false],
        tipo_bateria: [''],
        usa_adaptador: [false],
        voltaje_adaptador: [''],
        amperaje_adaptador: [''],
      }),
      dimensiones: this.fb.group({
        peso_kg: [null as number | null, [Validators.min(0)]],
        largo_mm: [null as number | null, [Validators.min(0)]],
        ancho_mm: [null as number | null, [Validators.min(0)]],
        alto_mm: [null as number | null, [Validators.min(0)]],
      }),
      manual_usuario_url: ['', Validators.maxLength(2048)],
      qr_code_url: ['', Validators.maxLength(2048)],
    });
    this.locationForm = this.fb.group({
      sede_id: ['', Validators.required],
      consultorio_id: ['', Validators.required],
    });
    this.maintenancePlanForm = this.fb.group({
      frecuencia_mantenimiento: [''],
      fecha_proximo_mantenimiento: [''],
      requiere_calibracion: [false],
      frecuencia_calibracion: [''],
      fecha_proxima_calibracion: [''],
      observaciones: [''],
    });
    this.providerForm = this.fb.group({
      proveedor_id: [''],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      direccion: [''],
      telefono_fijo: [''],
      telefono_celular: [''],
      email: ['', Validators.email],
      sitio_web: [''],
    });
    this.maintenanceForm = this.fb.group({
      tipo: ['MANTENIMIENTO_PREVENTIVO' as EquipmentMaintenanceType, Validators.required],
      fecha: [new Date().toISOString().slice(0, 10), Validators.required],
      proxima_fecha: [''],
      proveedor_id: [''],
      costo: [null as number | null, [Validators.min(0)]],
      descripcion: ['', [Validators.required, Validators.maxLength(2000)]],
    });
  }

  ngOnInit(): void {
    void this.loadDetail();
  }

  async loadDetail(): Promise<void> {
    if (!this.equipmentId) {
      this.errorMessage.set('No se indicó el activo que deseas consultar.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const [equipment, history, catalogs, sedes, equipmentTypes] = await Promise.all([
        this.equipmentService.getById(this.equipmentId),
        this.maintenanceService.listByEquipment(this.equipmentId),
        this.equipmentService.getCatalogs(),
        this.sedeService.getSedes(),
        this.equipmentTypeService.getEquipmentTypes(),
      ]);
      this.equipment.set(equipment);
      this.maintenanceHistory.set(history);
      this.providers.set(catalogs.proveedores);
      this.sedes.set(sedes);
      this.equipmentTypes.set(equipmentTypes);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No fue posible cargar la hoja de vida.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  openSection(section: EquipmentEditSection): void {
    const equipment = this.equipment();
    if (!equipment) return;
    this.errorMessage.set('');
    this.successMessage.set('');

    switch (section) {
      case 'general':
        this.generalForm.reset({
          nombre: equipment.nombre,
          numero_inventario: equipment.numero_inventario,
          tipo_equipo_id: equipment.tipo_equipo_id ?? '',
          marca: equipment.marca ?? '',
          modelo: equipment.modelo ?? '',
          serial: equipment.serial ?? '',
          fabricante: equipment.fabricante ?? '',
          fecha_adquisicion: equipment.fecha_adquisicion ?? '',
          garantia_periodo: equipment.garantia_periodo ?? '',
          vida_util_anios: equipment.vida_util_anios,
          clasificacion_riesgo_invima: equipment.clasificacion_riesgo_invima,
          registro_sanitario_invima: equipment.registro_sanitario_invima ?? '',
          estado: equipment.estado,
        });
        break;
      case 'technical':
        this.technicalForm.reset({
          especificaciones_electricas: {
            voltaje: equipment.especificaciones_electricas?.voltaje ?? '',
            frecuencia: equipment.especificaciones_electricas?.frecuencia ?? '',
            potencia: equipment.especificaciones_electricas?.potencia ?? '',
            amperaje: equipment.especificaciones_electricas?.amperaje ?? '',
            corriente: equipment.especificaciones_electricas?.corriente ?? 'AC',
            usa_bateria: equipment.especificaciones_electricas?.usa_bateria ?? false,
            tipo_bateria: equipment.especificaciones_electricas?.tipo_bateria ?? '',
            usa_adaptador: equipment.especificaciones_electricas?.usa_adaptador ?? false,
            voltaje_adaptador: equipment.especificaciones_electricas?.voltaje_adaptador ?? '',
            amperaje_adaptador: equipment.especificaciones_electricas?.amperaje_adaptador ?? '',
          },
          dimensiones: {
            peso_kg: equipment.dimensiones?.peso_kg ?? null,
            largo_mm: equipment.dimensiones?.largo_mm ?? null,
            ancho_mm: equipment.dimensiones?.ancho_mm ?? null,
            alto_mm: equipment.dimensiones?.alto_mm ?? null,
          },
          manual_usuario_url: equipment.manual_usuario_url ?? '',
          qr_code_url: equipment.qr_code_url ?? '',
        });
        break;
      case 'location':
        this.locationForm.reset({
          sede_id: equipment.sede_id ?? '',
          consultorio_id: equipment.consultorio_id ?? '',
        });
        void this.loadUbicaciones(equipment.sede_id ?? '');
        break;
      case 'maintenance':
        this.maintenancePlanForm.reset({
          frecuencia_mantenimiento: equipment.frecuencia_mantenimiento ?? '',
          fecha_proximo_mantenimiento: equipment.fecha_proximo_mantenimiento ?? '',
          requiere_calibracion: equipment.requiere_calibracion,
          frecuencia_calibracion: equipment.frecuencia_calibracion ?? '',
          fecha_proxima_calibracion: equipment.fecha_proxima_calibracion ?? '',
          observaciones: equipment.observaciones ?? '',
        });
        break;
      case 'provider': {
        const provider = this.providers().find((item) => item.id === equipment.proveedor_id);
        this.providerForm.reset({
          proveedor_id: provider?.id ?? '',
          nombre: provider?.nombre ?? '',
          direccion: provider?.direccion ?? '',
          telefono_fijo: provider?.telefono_fijo ?? '',
          telefono_celular: provider?.telefono_celular ?? '',
          email: provider?.email ?? '',
          sitio_web: provider?.sitio_web ?? '',
        });
        this.onProviderChange();
        break;
      }
    }

    this.openDialog(section);
  }

  async onLocationSedeChange(): Promise<void> {
    this.locationForm.get('consultorio_id')?.reset('');
    const sedeId = this.locationForm.get('sede_id')?.value;
    await this.loadUbicaciones(typeof sedeId === 'string' ? sedeId : '');
  }

  onProviderChange(): void {
    const providerId = this.providerForm.get('proveedor_id')?.value;
    const provider = this.providers().find((item) => item.id === providerId);
    const nameControl = this.providerForm.get('nombre');
    if (provider) {
      nameControl?.setValidators([Validators.required, Validators.maxLength(150)]);
    } else {
      nameControl?.clearValidators();
    }
    nameControl?.updateValueAndValidity({ emitEvent: false });
    this.providerForm.patchValue({
      nombre: provider?.nombre ?? '',
      direccion: provider?.direccion ?? '',
      telefono_fijo: provider?.telefono_fijo ?? '',
      telefono_celular: provider?.telefono_celular ?? '',
      email: provider?.email ?? '',
      sitio_web: provider?.sitio_web ?? '',
    });
  }

  async saveSection(section: EquipmentEditSection, image: File | null): Promise<void> {
    const form = this.formFor(section);
    if (form.invalid) {
      form.markAllAsTouched();
      throw new Error('Revisa los campos obligatorios.');
    }
    let uploadedImageUrl: string | null = null;
    try {
      const fields = await this.fieldsFor(section);
      if (section === 'provider') {
        const updatedProvider = await this.saveProviderSection();
        if (updatedProvider) {
          this.providers.update((providers) =>
            providers.map((provider) =>
              provider.id === updatedProvider.id ? updatedProvider : provider,
            ),
          );
        }
      } else {
        if (section === 'general' && image) {
          uploadedImageUrl = await this.equipmentImageService.upload(image, 'assets');
          fields.imagen_url = uploadedImageUrl;
        }
        const updatedEquipment = await this.equipmentService.updateFields(this.equipmentId, fields);
        this.equipment.set(updatedEquipment);
        uploadedImageUrl = null;
      }

      this.successMessage.set('Cambios guardados correctamente.');
    } catch (error) {
      let message = error instanceof Error ? error.message : 'No fue posible guardar los cambios.';
      if (uploadedImageUrl) {
        try {
          await this.equipmentImageService.remove(uploadedImageUrl);
        } catch (cleanupError) {
          message += ` No se pudo limpiar la imagen subida: ${this.errorText(cleanupError)}`;
        }
      }
      throw new Error(message);
    }
  }

  openMaintenanceForm(): void {
    const equipment = this.equipment();
    this.successMessage.set('');
    this.maintenanceForm.reset({
      tipo: 'MANTENIMIENTO_PREVENTIVO',
      fecha: new Date().toISOString().slice(0, 10),
      proxima_fecha: '',
      proveedor_id: equipment?.proveedor_id ?? '',
      costo: null,
      descripcion: '',
    });
    this.openDialog('maintenance-entry');
  }

  async onMaintenanceSubmit(): Promise<void> {
    const equipment = this.equipment();
    if (!equipment) return;
    this.maintenanceForm.markAllAsTouched();
    if (this.maintenanceForm.invalid) throw new Error('Revisa los campos obligatorios.');

    try {
      const value = this.maintenanceForm.getRawValue();
      await this.maintenanceService.create({
        equipo_id: equipment.id,
        tipo: value.tipo as EquipmentMaintenanceType,
        fecha: value.fecha,
        proxima_fecha: value.proxima_fecha || null,
        proveedor_id: value.proveedor_id || null,
        costo: value.costo === null || value.costo === '' ? null : Number(value.costo),
        descripcion: value.descripcion,
      });
      this.successMessage.set('Intervención registrada en el historial.');
      await this.loadDetail();
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'No fue posible registrar la intervención.',
      );
    }
  }

  formFor(section: EquipmentEditSection): FormGroup {
    switch (section) {
      case 'general':
        return this.generalForm;
      case 'technical':
        return this.technicalForm;
      case 'location':
        return this.locationForm;
      case 'maintenance':
        return this.maintenancePlanForm;
      case 'provider':
        return this.providerForm;
    }
  }

  maintenanceTypeLabel(type: EquipmentMaintenanceType): string {
    switch (type) {
      case 'CALIBRACION':
        return 'Calibración';
      case 'MANTENIMIENTO_CORRECTIVO':
        return 'Mantenimiento correctivo';
      default:
        return 'Mantenimiento preventivo';
    }
  }

  specification(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return 'No registrado';
    return String(value).trim() || 'No registrado';
  }

  maintenanceAlertClass(date: string): string {
    const daysUntil = this.daysUntil(date);
    if (daysUntil < 0) return 'alert-overdue';
    if (daysUntil <= 30) return 'alert-soon';
    return 'alert-upcoming';
  }

  maintenanceAlertLabel(date: string): string {
    const daysUntil = this.daysUntil(date);
    if (daysUntil < 0) return `Vencido ${Math.abs(daysUntil)} d`;
    if (daysUntil === 0) return 'Hoy';
    if (daysUntil <= 30) return `En ${daysUntil} d`;
    return 'Programado';
  }

  private async fieldsFor(section: EquipmentEditSection): Promise<Partial<EquipmentPayload>> {
    const value = this.formFor(section).getRawValue();
    switch (section) {
      case 'general':
        return {
          nombre: value.nombre.trim(),
          numero_inventario: value.numero_inventario.trim(),
          tipo_equipo_id: this.nullIfBlank(value.tipo_equipo_id),
          marca: this.nullIfBlank(value.marca),
          modelo: this.nullIfBlank(value.modelo),
          serial: this.nullIfBlank(value.serial),
          fabricante: this.nullIfBlank(value.fabricante),
          fecha_adquisicion: this.nullIfBlank(value.fecha_adquisicion),
          garantia_periodo: this.nullIfBlank(value.garantia_periodo),
          vida_util_anios: value.vida_util_anios === '' ? null : value.vida_util_anios,
          clasificacion_riesgo_invima: value.clasificacion_riesgo_invima || null,
          registro_sanitario_invima: this.nullIfBlank(value.registro_sanitario_invima),
          estado: value.estado as EquipmentStatus,
        };
      case 'technical':
        return {
          especificaciones_electricas: {
            voltaje: value.especificaciones_electricas.voltaje ?? '',
            frecuencia: value.especificaciones_electricas.frecuencia ?? '',
            potencia: value.especificaciones_electricas.potencia ?? '',
            amperaje: value.especificaciones_electricas.amperaje ?? '',
            corriente: value.especificaciones_electricas.corriente ?? 'AC',
            usa_bateria: value.especificaciones_electricas.usa_bateria ?? false,
            tipo_bateria: this.nullIfBlank(value.especificaciones_electricas.tipo_bateria),
            usa_adaptador: value.especificaciones_electricas.usa_adaptador ?? false,
            voltaje_adaptador: this.nullIfBlank(
              value.especificaciones_electricas.voltaje_adaptador,
            ),
            amperaje_adaptador: this.nullIfBlank(
              value.especificaciones_electricas.amperaje_adaptador,
            ),
          },
          dimensiones: {
            peso_kg: value.dimensiones.peso_kg === '' ? null : value.dimensiones.peso_kg,
            largo_mm: value.dimensiones.largo_mm === '' ? null : value.dimensiones.largo_mm,
            ancho_mm: value.dimensiones.ancho_mm === '' ? null : value.dimensiones.ancho_mm,
            alto_mm: value.dimensiones.alto_mm === '' ? null : value.dimensiones.alto_mm,
          },
          manual_usuario_url: this.nullIfBlank(value.manual_usuario_url),
          qr_code_url: this.nullIfBlank(value.qr_code_url),
        };
      case 'location':
        return {
          sede_id: value.sede_id,
          consultorio_id: value.consultorio_id,
        };
      case 'maintenance':
        return {
          frecuencia_mantenimiento: this.nullIfBlank(value.frecuencia_mantenimiento),
          fecha_proximo_mantenimiento: this.nullIfBlank(value.fecha_proximo_mantenimiento),
          requiere_calibracion: value.requiere_calibracion,
          frecuencia_calibracion: this.nullIfBlank(value.frecuencia_calibracion),
          fecha_proxima_calibracion: this.nullIfBlank(value.fecha_proxima_calibracion),
          observaciones: this.nullIfBlank(value.observaciones),
        };
      case 'provider':
        return {};
    }
  }

  private async saveProviderSection(): Promise<Proveedor | null> {
    const value = this.providerForm.getRawValue();
    const currentProviderId = this.equipment()?.proveedor_id ?? null;
    const nextProviderId = value.proveedor_id || null;
    if (nextProviderId) {
      const updatedProvider = await this.proveedorService.updateProveedor(nextProviderId, {
        nombre: value.nombre,
        direccion: value.direccion,
        telefono_fijo: value.telefono_fijo,
        telefono_celular: value.telefono_celular,
        email: value.email,
        sitio_web: value.sitio_web,
      });
      this.providers.update((providers) =>
        providers.map((provider) =>
          provider.id === updatedProvider.id ? updatedProvider : provider,
        ),
      );
    }
    if (currentProviderId !== nextProviderId) {
      const updatedEquipment = await this.equipmentService.updateFields(this.equipmentId, {
        proveedor_id: nextProviderId,
      });
      this.equipment.set(updatedEquipment);
    } else {
      this.equipment.update((equipment) =>
        equipment
          ? {
              ...equipment,
              proveedor: nextProviderId
                ? (this.providers().find((provider) => provider.id === nextProviderId) ?? null)
                : null,
            }
          : null,
      );
    }
    return nextProviderId
      ? (this.providers().find((provider) => provider.id === nextProviderId) ?? null)
      : null;
  }

  private async loadUbicaciones(sedeId: string): Promise<void> {
    const requestId = ++this.locationRequestId;
    this.loadingLocations.set(true);
    this.ubicaciones.set([]);
    if (!sedeId) {
      this.loadingLocations.set(false);
      return;
    }

    try {
      const locations = await this.ubicacionService.getUbicacionesBySede(sedeId);
      if (requestId === this.locationRequestId) this.ubicaciones.set(locations);
    } catch (error) {
      if (requestId === this.locationRequestId) {
        this.errorMessage.set(
          error instanceof Error ? error.message : 'No fue posible cargar las áreas de la sede.',
        );
      }
    } finally {
      if (requestId === this.locationRequestId) this.loadingLocations.set(false);
    }
  }

  private nullIfBlank(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized || null;
  }

  private openDialog(section: EquipmentDialogSection): void {
    const form = section === 'maintenance-entry' ? this.maintenanceForm : this.formFor(section);
    this.dialog.open(EquipmentSectionDialogComponent, {
      width: 'min(760px, calc(100vw - 32px))',
      maxWidth: '760px',
      autoFocus: 'first-tabbable',
      data: {
        section,
        form,
        equipmentTypes: this.equipmentTypes(),
        providers: this.providers(),
        sedes: this.sedes(),
        ubicaciones: this.ubicaciones,
        loadingLocations: this.loadingLocations,
        locationError: this.errorMessage,
        imageUrl:
          section === 'general'
            ? (this.equipment()?.imagen_url ?? this.equipment()?.tipo_equipo?.imagen_url ?? null)
            : null,
        onSedeChange: () => void this.onLocationSedeChange(),
        onProviderChange: () => this.onProviderChange(),
        save: (image: File | null) =>
          section === 'maintenance-entry'
            ? this.onMaintenanceSubmit()
            : this.saveSection(section, image),
      },
    });
  }

  private errorText(error: unknown): string {
    return error instanceof Error ? error.message : 'error de almacenamiento';
  }

  private daysUntil(date: string): number {
    const target = new Date(`${date.slice(0, 10)}T00:00:00Z`).getTime();
    const today = new Date();
    const currentDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.ceil((target - currentDay) / 86_400_000);
  }
}
