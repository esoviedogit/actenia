import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Sede } from '../../models/sede.model';
import { SedeService } from '../../services/sede.service';
import { UbicacionService } from '../../services/ubicacion.service';

@Component({
  selector: 'app-ubicacion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './ubicacion-form.component.html',
  styleUrl: './ubicacion-form.component.css',
})
export class UbicacionFormComponent implements OnInit {
  readonly ubicacionForm: FormGroup;
  readonly sedes = signal<Sede[]>([]);
  readonly ubicacionId: string | null;
  readonly loading = signal(false);
  readonly loadingForm = signal(true);
  readonly errorMessage = signal('');

  constructor(
    private readonly fb: FormBuilder,
    private readonly sedeService: SedeService,
    private readonly ubicacionService: UbicacionService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.ubicacionId = this.route.snapshot.paramMap.get('id');
    this.ubicacionForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      piso: ['', Validators.maxLength(100)],
      codigo_servicio: ['', Validators.maxLength(50)],
      sede_id: ['', Validators.required],
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      this.sedes.set(await this.sedeService.getSedes());
      if (this.ubicacionId) {
        const ubicacion = await this.ubicacionService.getUbicacionById(this.ubicacionId);
        this.ubicacionForm.patchValue(ubicacion);
      }
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No fue posible cargar el formulario.',
      );
    } finally {
      this.loadingForm.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    if (this.ubicacionForm.invalid) {
      this.ubicacionForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      const ubicacion = this.ubicacionForm.getRawValue();
      if (this.ubicacionId) {
        await this.ubicacionService.updateUbicacion(this.ubicacionId, ubicacion);
      } else {
        await this.ubicacionService.createUbicacion(ubicacion);
      }
      await this.router.navigate(['/ubicaciones']);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No fue posible guardar la ubicación.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
