import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then((module) => module.LoginComponent),
  },
  {
    path: 'equipment-list',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/equipment-list/equipment-list').then(
        (module) => module.EquipmentListComponent,
      ),
  },
  {
    path: 'equipment-detail/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/equipment-detail/equipment-detail.component').then(
        (module) => module.EquipmentDetailComponent,
      ),
  },
  {
    path: 'equipment-form',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/equipment-form/equipment-form').then(
        (module) => module.EquipmentFormComponent,
      ),
  },
  {
    path: 'equipment-form/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/equipment-form/equipment-form').then(
        (module) => module.EquipmentFormComponent,
      ),
  },
  {
    path: 'tipos-equipo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/equipment-type-list/equipment-type-list.component').then(
        (module) => module.EquipmentTypeListComponent,
      ),
  },
  {
    path: 'tipos-equipo/nuevo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/equipment-type-form/equipment-type-form.component').then(
        (module) => module.EquipmentTypeFormComponent,
      ),
  },
  {
    path: 'tipos-equipo/editar/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/equipment-type-form/equipment-type-form.component').then(
        (module) => module.EquipmentTypeFormComponent,
      ),
  },
  {
    path: 'sedes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/sede-list/sede-list.component').then(
        (module) => module.SedeListComponent,
      ),
  },
  {
    path: 'sedes/nueva',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/sede-form/sede-form.component').then(
        (module) => module.SedeFormComponent,
      ),
  },
  {
    path: 'sedes/editar/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/sede-form/sede-form.component').then(
        (module) => module.SedeFormComponent,
      ),
  },
  {
    path: 'ubicaciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/ubicacion-list/ubicacion-list.component').then(
        (module) => module.UbicacionListComponent,
      ),
  },
  {
    path: 'ubicaciones/nueva',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/ubicacion-form/ubicacion-form.component').then(
        (module) => module.UbicacionFormComponent,
      ),
  },
  {
    path: 'ubicaciones/editar/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/ubicacion-form/ubicacion-form.component').then(
        (module) => module.UbicacionFormComponent,
      ),
  },
  {
    path: 'proveedores',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/proveedor-list/proveedor-list.component').then(
        (module) => module.ProveedorListComponent,
      ),
  },
  {
    path: 'proveedores/nuevo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/proveedor-form/proveedor-form.component').then(
        (module) => module.ProveedorFormComponent,
      ),
  },
  {
    path: 'proveedores/editar/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/proveedor-form/proveedor-form.component').then(
        (module) => module.ProveedorFormComponent,
      ),
  },
  { path: 'ubicaciones/:id', redirectTo: 'ubicaciones/editar/:id' },
  { path: '', redirectTo: 'equipment-list', pathMatch: 'full' },
  { path: '**', redirectTo: 'equipment-list' },
];
