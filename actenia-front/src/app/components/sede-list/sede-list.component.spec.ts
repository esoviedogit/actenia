import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SedeService } from '../../services/sede.service';
import { SedeListComponent } from './sede-list.component';

describe('SedeListComponent', () => {
  let component: SedeListComponent;
  let fixture: ComponentFixture<SedeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SedeListComponent],
      providers: [
        provideRouter([]),
        {
          provide: SedeService,
          useValue: { getSedes: () => Promise.resolve([]) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SedeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads and displays an empty state when there are no sedes', () => {
    expect(component.sedes()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Aún no tienes sedes registradas');
  });

  it('renders the sede returned by the async service', async () => {
    const sede = {
      id: 'sede-1',
      nombre: 'principal',
      ciudad: 'Bucaramanga',
      direccion: 'Cra 26#36-27',
      empresa: 'Fundacion Cardiovascular',
      user_id: '74046f42-2a82-4fb0-b50b-832c5293dda5',
    };
    const sedeService = TestBed.inject(SedeService) as unknown as {
      getSedes: ReturnType<typeof vi.fn>;
    };
    sedeService.getSedes = vi.fn().mockResolvedValue([sede]);

    await component.loadSedes();
    fixture.detectChanges();

    expect(component.sedes()).toEqual([sede]);
    expect(fixture.nativeElement.textContent).toContain('principal');
    expect(fixture.nativeElement.textContent).toContain('Bucaramanga');
  });
});
