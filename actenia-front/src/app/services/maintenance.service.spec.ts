import { MaintenanceService } from './maintenance.service';
import { SupabaseService } from './supabase-services/supabase/supabase';

describe('MaintenanceService', () => {
  it('records an execution with the authenticated user and scheduled period', async () => {
    const query = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    query.insert.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.single.mockResolvedValue({
      data: {
        id: 'execution-1',
        equipo_id: 'asset-1',
        user_id: 'user-123',
        tipo_mantenimiento_id: 'type-preventive',
        fecha: '2025-05-05',
        descripcion: '',
        observaciones: '',
        estado: 'Realizado',
        mes_programado: 'MAYO',
        anio: 2025,
        costo: null,
        proxima_fecha: null,
      },
      error: null,
    });
    const supabase = {
      client: {
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({ data: { user: { id: 'user-123' } }, error: null }),
          ),
        },
        from: vi.fn(() => query),
      },
    } as unknown as SupabaseService;

    const service = new MaintenanceService(supabase);
    await service.recordExecution({
      equipo_id: 'asset-1',
      tipo_mantenimiento_id: 'type-preventive',
      fecha: '2025-05-05',
      mes_programado: 'MAYO',
      anio: 2025,
    });

    expect(supabase.client.from).toHaveBeenCalledWith('mantenimientos_equipos');
    expect(query.insert).toHaveBeenCalledWith({
      equipo_id: 'asset-1',
      tipo_mantenimiento_id: 'type-preventive',
      fecha: '2025-05-05',
      descripcion: '',
      observaciones: '',
      estado: 'Realizado',
      mes_programado: 'MAYO',
      anio: 2025,
      costo: null,
      proxima_fecha: null,
      user_id: 'user-123',
    });
  });

  it('loads executions by authenticated user and selected year', async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      order: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.gte.mockReturnValue(query);
    query.lte.mockReturnValue(query);
    query.order.mockResolvedValue({ data: [], error: null });
    const supabase = {
      client: {
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({ data: { user: { id: 'user-123' } }, error: null }),
          ),
        },
        from: vi.fn(() => query),
      },
    } as unknown as SupabaseService;

    await expect(new MaintenanceService(supabase).listForYear(2025)).resolves.toEqual([]);

    expect(query.select).toHaveBeenCalledWith(
      'id, equipo_id, user_id, tipo_mantenimiento_id, tipo_mantenimiento:tipos_mantenimiento_maestro(id, nombre), equipo:equipos(id, nombre, numero_inventario), fecha, descripcion, observaciones, estado, mes_programado, anio, costo, proxima_fecha',
    );
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(query.gte).toHaveBeenCalledWith('fecha', '2025-01-01');
    expect(query.lte).toHaveBeenCalledWith('fecha', '2025-12-31');
  });

  it('joins equipment details and adds the current responsible label to global history', async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockResolvedValue({
      data: [
        {
          id: 'execution-1',
          equipo_id: 'asset-1',
          user_id: 'user-123',
          tipo_mantenimiento_id: 'type-preventive',
          tipo_mantenimiento: {
            id: 'type-preventive',
            nombre: 'Preventivo',
          },
          fecha: '2025-05-05',
          descripcion: 'Revisión funcional',
          observaciones: 'Revisión funcional',
          estado: 'Realizado',
          mes_programado: 'MAYO',
          anio: 2025,
          costo: null,
          proxima_fecha: null,
          equipo: {
            id: 'asset-1',
            nombre: 'Monitor',
            numero_inventario: 'INV-100',
          },
        },
      ],
      error: null,
    });
    const supabase = {
      client: {
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({
              data: {
                user: {
                  id: 'user-123',
                  email: 'responsable@example.com',
                  user_metadata: { full_name: 'Ana Responsable' },
                },
              },
              error: null,
            }),
          ),
        },
        from: vi.fn(() => query),
      },
    } as unknown as SupabaseService;

    const records = await new MaintenanceService(supabase).listGlobal();

    expect(query.select).toHaveBeenCalledWith(
      'id, equipo_id, user_id, tipo_mantenimiento_id, tipo_mantenimiento:tipos_mantenimiento_maestro(id, nombre), equipo:equipos(id, nombre, numero_inventario), fecha, descripcion, observaciones, estado, mes_programado, anio, costo, proxima_fecha',
    );
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(records[0]).toMatchObject({
      observaciones: 'Revisión funcional',
      responsable: 'Ana Responsable',
      equipo: { numero_inventario: 'INV-100', nombre: 'Monitor' },
    });
  });

  it('updates a maintenance history record for the authenticated user', async () => {
    const query = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    query.update.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.single.mockResolvedValue({ data: { id: 'execution-1' }, error: null });
    const supabase = {
      client: {
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({ data: { user: { id: 'user-123' } }, error: null }),
          ),
        },
        from: vi.fn(() => query),
      },
    } as unknown as SupabaseService;

    await new MaintenanceService(supabase).updateExecution('execution-1', {
      equipo_id: 'asset-1',
      tipo_mantenimiento_id: 'type-calibration',
      fecha: '2025-05-21',
      observaciones: 'Calibración anual',
      mes_programado: 'MAYO',
      anio: 2025,
    });

    expect(query.eq).toHaveBeenCalledWith('id', 'execution-1');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        fecha: '2025-05-21',
        descripcion: 'Calibración anual',
        observaciones: 'Calibración anual',
        estado: 'Realizado',
        tipo_mantenimiento_id: 'type-calibration',
        costo: null,
        proxima_fecha: null,
      }),
    );
  });

  it('deletes only the authenticated user maintenance record', async () => {
    const query = {
      delete: vi.fn(),
      eq: vi.fn(),
    };
    query.delete.mockReturnValue(query);
    query.eq.mockReturnValueOnce(query).mockResolvedValueOnce({ error: null });
    const supabase = {
      client: {
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({ data: { user: { id: 'user-123' } }, error: null }),
          ),
        },
        from: vi.fn(() => query),
      },
    } as unknown as SupabaseService;

    await new MaintenanceService(supabase).deleteExecution('execution-1');

    expect(query.eq).toHaveBeenNthCalledWith(1, 'id', 'execution-1');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'user_id', 'user-123');
  });

  it('rejects execution dates outside the scheduled month and year', async () => {
    const supabase = {
      client: {
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({ data: { user: { id: 'user-123' } }, error: null }),
          ),
        },
        from: vi.fn(),
      },
    } as unknown as SupabaseService;

    await expect(
      new MaintenanceService(supabase).recordExecution({
        equipo_id: 'asset-1',
        tipo_mantenimiento_id: 'type-preventive',
        fecha: '2025-06-05',
        mes_programado: 'MAYO',
        anio: 2025,
      }),
    ).rejects.toThrow('La fecha debe coincidir con el mes y año del cronograma.');
  });
});
