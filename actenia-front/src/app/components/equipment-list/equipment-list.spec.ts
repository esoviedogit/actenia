import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EquipmentService } from '../../services/equipment.service';
import { EquipmentRecord } from '../../models/equipment.model';
import { EquipmentListComponent } from './equipment-list';

describe('EquipmentListComponent', () => {
  let component: EquipmentListComponent;
  let fixture: ComponentFixture<EquipmentListComponent>;
  let listEquipment: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentListComponent],
      providers: [
        provideRouter([]),
        {
          provide: EquipmentService,
          useValue: {
            list: (listEquipment = vi.fn().mockResolvedValue([])),
            delete: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('creates and loads an empty inventory', () => {
    expect(component).toBeTruthy();
    expect(component.equipos()).toEqual([]);
    expect(component.loading()).toBe(false);
  });

  it('renders the equipment returned by the service after loading', async () => {
    const equipment = {
      id: 'asset-1',
      numero_inventario: 'ACT-001',
      nombre: 'BIOFEEDBACK',
      marca: 'IBRAMED',
      modelo: 'NEURODYM EVOLUTION',
      serial: '0824340006',
      estado: 'EN USO',
      sede: { nombre: 'principal' },
      ubicacion: { nombre: '101', piso: 1 },
      tipo_equipo: { nombre: 'BIOFEEDBACK' },
      requiere_calibracion: true,
      fecha_proximo_mantenimiento: '2026-11-11',
      fecha_proxima_calibracion: '2026-11-18',
    } as EquipmentRecord;
    listEquipment.mockResolvedValue([equipment]);

    await component.loadEquipment();
    fixture.detectChanges();

    expect(component.filteredEquipment()).toEqual([equipment]);
    expect(fixture.nativeElement.textContent).toContain('ACT-001');
    expect(fixture.nativeElement.textContent).toContain('BIOFEEDBACK');
    expect(fixture.nativeElement.textContent).toContain('principal');
  });
});
