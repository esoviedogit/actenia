import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SedeService } from '../../services/sede.service';

@Component({
  selector: 'app-sede-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sede-form.component.html',
  styleUrl: './sede-form.component.css',
})
export class SedeFormComponent implements OnInit {
  readonly sedeForm: FormGroup;
  readonly sedeId: string | null;
  readonly loading = signal(false);
  readonly loadingSede = signal(false);
  readonly errorMessage = signal('');

  constructor(
    private readonly fb: FormBuilder,
    private readonly sedeService: SedeService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.sedeId = this.route.snapshot.paramMap.get('id');
    this.sedeForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      ciudad: ['', [Validators.required, Validators.maxLength(100)]],
      direccion: ['', Validators.maxLength(500)],
      telefono: ['', Validators.maxLength(50)],
      codigo_habilitacion: [
        '',
        [Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9./-]*$/)],
      ],
      empresa: ['', Validators.maxLength(150)],
    });
  }

  async ngOnInit(): Promise<void> {
    if (!this.sedeId) return;

    this.loadingSede.set(true);
    try {
      const sede = await this.sedeService.getSedeById(this.sedeId);
      this.sedeForm.patchValue(sede);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No fue posible cargar la sede.',
      );
    } finally {
      this.loadingSede.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    if (this.sedeForm.invalid) {
      this.sedeForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      const sede = this.sedeForm.getRawValue();
      if (this.sedeId) {
        await this.sedeService.updateSede(this.sedeId, sede);
      } else {
        await this.sedeService.createSede(sede);
      }
      await this.router.navigate(['/sedes']);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No fue posible guardar la sede.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
