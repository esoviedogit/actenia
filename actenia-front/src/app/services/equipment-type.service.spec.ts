import { EquipmentTypeService } from './equipment-type.service';
import { EquipmentImageService } from './equipment-image.service';
import { SupabaseService } from './supabase-services/supabase/supabase';

describe('EquipmentTypeService', () => {
  it('creates a type with validated fields and the authenticated owner', async () => {
    const query = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    query.insert.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.single.mockResolvedValue({
      data: {
        id: 'type-1',
        nombre: 'Bomba de infusión',
        user_id: 'user-123',
        clasificacion_riesgo: 'IIb',
        frecuencia_mantenimiento_meses: 6,
      },
      error: null,
    });

    const supabase = {
      client: {
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({
              data: { user: { id: 'user-123' } },
              error: null,
            }),
          ),
        },
        from: vi.fn(() => query),
      },
    } as unknown as SupabaseService;

    const imageService = {
      upload: vi.fn(),
      remove: vi.fn(),
    } as unknown as EquipmentImageService;
    const service = new EquipmentTypeService(supabase, imageService);
    const created = await service.createEquipmentType({
      nombre: ' Bomba de infusión ',
      clasificacion_riesgo: 'IIb',
      frecuencia_mantenimiento_meses: 6,
    });

    expect(supabase.client.from).toHaveBeenCalledWith('tipos_equipo');
    expect(query.insert).toHaveBeenCalledWith({
      nombre: 'Bomba de infusión',
      clasificacion_riesgo: 'IIb',
      frecuencia_mantenimiento_meses: 6,
      imagen_url: null,
      user_id: 'user-123',
    });
    expect(created.id).toBe('type-1');
  });

  it('rejects invalid maintenance intervals before inserting', async () => {
    const insert = vi.fn();
    const supabase = {
      client: {
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({
              data: { user: { id: 'user-123' } },
              error: null,
            }),
          ),
        },
        from: vi.fn(() => ({ insert })),
      },
    } as unknown as SupabaseService;

    const service = new EquipmentTypeService(supabase, {
      upload: vi.fn(),
      remove: vi.fn(),
    } as unknown as EquipmentImageService);
    await expect(
      service.createEquipmentType({
        nombre: 'Monitor',
        clasificacion_riesgo: 'IIa',
        frecuencia_mantenimiento_meses: 0,
      }),
    ).rejects.toThrow('La frecuencia de mantenimiento debe ser un número entero mayor que cero.');
    expect(insert).not.toHaveBeenCalled();
  });
});
