import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProveedorService } from '../../services/proveedor.service';

@Component({
  selector: 'app-proveedor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './proveedor-form.component.html',
  styleUrl: './proveedor-form.component.css',
})
export class ProveedorFormComponent implements OnInit {
  readonly proveedorForm: FormGroup;
  readonly proveedorId: string | null;
  readonly loading = signal(false);
  readonly loadingProveedor = signal(false);
  readonly errorMessage = signal('');

  constructor(
    private readonly fb: FormBuilder,
    private readonly proveedorService: ProveedorService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.proveedorId = this.route.snapshot.paramMap.get('id');
    this.proveedorForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      direccion: ['', Validators.maxLength(500)],
      telefono_fijo: ['', Validators.maxLength(50)],
      telefono_celular: ['', Validators.maxLength(50)],
      email: ['', [Validators.email, Validators.maxLength(100)]],
      sitio_web: ['', [Validators.maxLength(255), Validators.pattern(/^$|^https?:\/\/.+/i)]],
    });
  }

  async ngOnInit(): Promise<void> {
    if (!this.proveedorId) return;

    this.loadingProveedor.set(true);
    try {
      const proveedor = await this.proveedorService.getProveedorById(this.proveedorId);
      this.proveedorForm.patchValue(proveedor);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No fue posible cargar el proveedor.',
      );
    } finally {
      this.loadingProveedor.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    if (this.proveedorForm.invalid) {
      this.proveedorForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      const proveedor = this.proveedorForm.getRawValue();
      if (this.proveedorId) {
        await this.proveedorService.updateProveedor(this.proveedorId, proveedor);
      } else {
        await this.proveedorService.createProveedor(proveedor);
      }
      await this.router.navigate(['/proveedores']);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No fue posible guardar el proveedor.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
