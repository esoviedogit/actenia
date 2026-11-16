import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { SedeService } from '../../services/sede.service';
import { SedeFormComponent } from './sede-form.component';

describe('SedeFormComponent', () => {
  let component: SedeFormComponent;
  let fixture: ComponentFixture<SedeFormComponent>;
  let routeId: string | null;
  let sedeService: {
    getSedeById: ReturnType<typeof vi.fn>;
    updateSede: ReturnType<typeof vi.fn>;
    createSede: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    routeId = null;
    sedeService = {
      getSedeById: vi.fn(),
      updateSede: vi.fn(),
      createSede: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [SedeFormComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (name: string) => (name === 'id' ? routeId : null),
              },
            },
          },
        },
        { provide: SedeService, useValue: sedeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SedeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('requires both the sede name and city', () => {
    expect(component.sedeForm.get('nombre')?.hasError('required')).toBe(true);
    expect(component.sedeForm.get('ciudad')?.hasError('required')).toBe(true);
    expect(component.sedeForm.get('codigo_habilitacion')?.valid).toBe(true);
  });

  it('loads the selected sede and leaves the loading state after the request', async () => {
    routeId = 'sede-1';
    sedeService.getSedeById.mockResolvedValue({
      id: 'sede-1',
      nombre: 'Sede Central',
      ciudad: 'Bogotá',
      direccion: 'Calle 1',
      telefono: '123456',
      codigo_habilitacion: null,
      empresa: 'Actenia IPS',
      user_id: 'user-1',
    });

    const editFixture = TestBed.createComponent(SedeFormComponent);
    const editComponent = editFixture.componentInstance;
    editFixture.detectChanges();
    await editFixture.whenStable();
    editFixture.detectChanges();

    expect(sedeService.getSedeById).toHaveBeenCalledWith('sede-1');
    expect(editComponent.loadingSede()).toBe(false);
    expect(editComponent.sedeForm.get('nombre')?.value).toBe('Sede Central');
    expect(editFixture.nativeElement.textContent).not.toContain('Cargando sede...');

    editComponent.sedeForm.patchValue({ nombre: 'Sede Norte', ciudad: 'Medellín' });
    await editComponent.onSubmit();

    expect(sedeService.updateSede).toHaveBeenCalledWith(
      'sede-1',
      expect.objectContaining({ nombre: 'Sede Norte', ciudad: 'Medellín' }),
    );
  });
});
