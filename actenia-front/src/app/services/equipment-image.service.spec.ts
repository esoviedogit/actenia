import { EquipmentImageService } from './equipment-image.service';
import { SupabaseService } from './supabase-services/supabase/supabase';

describe('EquipmentImageService', () => {
  it('uploads an image into the authenticated owner and category folder', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'file-123' });
    const upload = vi.fn().mockResolvedValue({ error: null });
    const getPublicUrl = vi.fn(() => ({
      data: {
        publicUrl:
          'https://example.supabase.co/storage/v1/object/public/equipment-images/user-123/assets/file-123.png',
      },
    }));
    const bucket = { upload, getPublicUrl };
    const supabase = {
      client: {
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({ data: { user: { id: 'user-123' } }, error: null }),
          ),
        },
        storage: { from: vi.fn(() => bucket) },
      },
    } as unknown as SupabaseService;

    const service = new EquipmentImageService(supabase);
    const image = new File(['image'], 'asset.png', { type: 'image/png' });
    const url = await service.upload(image, 'assets');

    expect(upload).toHaveBeenCalledWith(
      'user-123/assets/file-123.png',
      image,
      expect.objectContaining({ contentType: 'image/png', upsert: false }),
    );
    expect(url).toContain('/equipment-images/user-123/assets/file-123.png');
    vi.unstubAllGlobals();
  });

  it('rejects removing a file owned by another user', async () => {
    const remove = vi.fn();
    const supabase = {
      client: {
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({ data: { user: { id: 'user-123' } }, error: null }),
          ),
        },
        storage: { from: vi.fn(() => ({ remove })) },
      },
    } as unknown as SupabaseService;

    const service = new EquipmentImageService(supabase);
    await expect(
      service.remove(
        'https://example.supabase.co/storage/v1/object/public/equipment-images/other-user/photo.png',
      ),
    ).rejects.toThrow('No puedes eliminar imágenes de otro usuario.');
    expect(remove).not.toHaveBeenCalled();
  });
});
