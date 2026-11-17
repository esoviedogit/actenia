import { EquipmentService } from './equipment.service';
import { EquipmentImageService } from './equipment-image.service';
import { SupabaseService } from './supabase-services/supabase/supabase';

describe('EquipmentService', () => {
  const imageService = {
    remove: vi.fn(),
  } as unknown as EquipmentImageService;

  it('updates only the supplied fields for the authenticated owner', async () => {
    const query = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    query.update.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.single.mockResolvedValue({
      data: { id: 'asset-1', estado: 'EN MANTENIMIENTO' },
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
    const service = new EquipmentService(supabase, imageService);

    await service.updateFields('asset-1', { estado: 'EN MANTENIMIENTO' });

    expect(query.update).toHaveBeenCalledWith({ estado: 'EN MANTENIMIENTO' });
    expect(query.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-123');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'id', 'asset-1');
  });

  it('maps the form model to database columns and assigns the session owner', async () => {
    const query = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    query.insert.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.single.mockResolvedValue({
      data: { id: 'asset-1', nombre: 'Impresora recepción' },
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
    const service = new EquipmentService(supabase, imageService);

    await service.createEquipment({
      nombre: ' Impresora recepción ',
      numero_inventario: ' INV-10 ',
      sede_id: 'sede-1',
      ubicacion_id: 'area-1',
      tipo_id: 'type-1',
      serie: ' SN-10 ',
      user_id: 'untrusted-owner',
    });

    expect(supabase.client.from).toHaveBeenCalledWith('equipos');
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Impresora recepción',
        numero_inventario: 'INV-10',
        sede_id: 'sede-1',
        consultorio_id: 'area-1',
        tipo_equipo_id: 'type-1',
        serial: 'SN-10',
        user_id: 'user-123',
      }),
    );
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining('ubicacion:consultorios'));
  });

  it('removes the equipment image before deleting the database record', async () => {
    const imageUrl =
      'https://example.supabase.co/storage/v1/object/public/equipment-images/user-123/assets/file.png';
    const lookupQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    };
    lookupQuery.select.mockReturnValue(lookupQuery);
    lookupQuery.eq.mockReturnValue(lookupQuery);
    lookupQuery.single.mockResolvedValue({
      data: { imagen_url: imageUrl },
      error: null,
    });

    const deleteQuery = {
      delete: vi.fn(),
      eq: vi.fn(),
    };
    deleteQuery.delete.mockReturnValue(deleteQuery);
    deleteQuery.eq.mockReturnValueOnce(deleteQuery).mockResolvedValueOnce({ error: null });
    const supabase = {
      client: {
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({ data: { user: { id: 'user-123' } }, error: null }),
          ),
        },
        from: vi.fn().mockReturnValueOnce(lookupQuery).mockReturnValueOnce(deleteQuery),
      },
    } as unknown as SupabaseService;
    const removeImage = vi.fn(async () => {
      expect(deleteQuery.delete).not.toHaveBeenCalled();
    });
    const images = { remove: removeImage } as unknown as EquipmentImageService;

    await new EquipmentService(supabase, images).delete('asset-1');

    expect(lookupQuery.select).toHaveBeenCalledWith('imagen_url');
    expect(lookupQuery.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-123');
    expect(lookupQuery.eq).toHaveBeenNthCalledWith(2, 'id', 'asset-1');
    expect(removeImage).toHaveBeenCalledWith(imageUrl);
    expect(deleteQuery.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-123');
    expect(deleteQuery.eq).toHaveBeenNthCalledWith(2, 'id', 'asset-1');
  });

  it('keeps the equipment record when image removal fails', async () => {
    const lookupQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    };
    lookupQuery.select.mockReturnValue(lookupQuery);
    lookupQuery.eq.mockReturnValue(lookupQuery);
    lookupQuery.single.mockResolvedValue({
      data: {
        imagen_url:
          'https://example.supabase.co/storage/v1/object/public/equipment-images/user-123/assets/file.png',
      },
      error: null,
    });
    const deleteQuery = { delete: vi.fn() };
    const supabase = {
      client: {
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({ data: { user: { id: 'user-123' } }, error: null }),
          ),
        },
        from: vi.fn().mockReturnValueOnce(lookupQuery).mockReturnValueOnce(deleteQuery),
      },
    } as unknown as SupabaseService;
    const storageError = new Error('Storage unavailable');
    const images = {
      remove: vi.fn().mockRejectedValue(storageError),
    } as unknown as EquipmentImageService;

    await expect(new EquipmentService(supabase, images).delete('asset-1')).rejects.toBe(
      storageError,
    );
    expect(deleteQuery.delete).not.toHaveBeenCalled();
  });
});
