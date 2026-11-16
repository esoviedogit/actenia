import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { EquipmentService } from '../../services/equipment.service';
import { SedeService } from '../../services/sede.service';
import { UbicacionService } from '../../services/ubicacion.service';
import { EquipmentTypeService } from '../../services/equipment-type.service';
import { EquipmentFormComponent } from './equipment-form';

describe('EquipmentFormComponent', () => {
  let component: EquipmentFormComponent;
  let fixture: ComponentFixture<EquipmentFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentFormComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
        {
          provide: EquipmentService,
          useValue: {
            getCatalogs: () =>
              Promise.resolve({
                proveedores: [],
              }),
          },
        },
        {
          provide: SedeService,
          useValue: { getSedes: () => Promise.resolve([]) },
        },
        {
          provide: UbicacionService,
          useValue: { getUbicacionesBySede: () => Promise.resolve([]) },
        },
        {
          provide: EquipmentTypeService,
          useValue: { getEquipmentTypes: () => Promise.resolve([]) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('creates with risk classification and inventory validation', () => {
    expect(component).toBeTruthy();
    expect(component.equipmentForm.get('numero_inventario')?.hasError('required')).toBe(true);
    expect(component.equipmentForm.get('clasificacion_riesgo_invima')?.value).toBeNull();
    expect(component.equipmentForm.get('tipo_bateria')).toBeNull();
    expect(component.equipmentForm.get('especificaciones_electricas.tipo_bateria')).toBeTruthy();
    expect(component.loadingForm()).toBe(false);
  });

  it('loads only the selected sede locations and clears the previous selection', async () => {
    const ubicacionService = TestBed.inject(UbicacionService);
    const firstArea = {
      id: 'area-1',
      nombre: 'Terapia Física',
      sede_id: 'sede-1',
    };
    vi.spyOn(ubicacionService, 'getUbicacionesBySede').mockResolvedValue([firstArea]);

    component.equipmentForm.patchValue({
      sede_id: 'sede-1',
      consultorio_id: 'old-area',
    });
    await component.onSedeChange();

    expect(ubicacionService.getUbicacionesBySede).toHaveBeenCalledWith('sede-1');
    expect(component.ubicaciones()).toEqual([firstArea]);
    expect(component.equipmentForm.get('consultorio_id')?.value).toBe('');
  });
});
