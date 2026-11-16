import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase-services/supabase/supabase';

const EQUIPMENT_IMAGE_BUCKET = 'equipment-images';
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

@Injectable({ providedIn: 'root' })
export class EquipmentImageService {
  constructor(private readonly supabase: SupabaseService) {}

  async upload(file: File, category: 'assets' | 'types'): Promise<string> {
    const userId = await this.requireUserId();
    const extension = IMAGE_EXTENSIONS[file.type];
    if (!extension) throw new Error('El formato debe ser JPG, PNG, WebP, GIF o AVIF.');
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('La imagen no puede superar los 5 MB.');
    }

    const path = `${userId}/${category}/${crypto.randomUUID()}.${extension}`;
    const { error } = await this.supabase.client.storage
      .from(EQUIPMENT_IMAGE_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });

    if (error) throw error;
    return this.supabase.client.storage.from(EQUIPMENT_IMAGE_BUCKET).getPublicUrl(path).data
      .publicUrl;
  }

  async remove(publicUrl: string): Promise<void> {
    const userId = await this.requireUserId();
    const marker = `/storage/v1/object/public/${EQUIPMENT_IMAGE_BUCKET}/`;
    const pathname = new URL(publicUrl).pathname;
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex < 0) throw new Error('La URL no pertenece al almacenamiento de imágenes.');

    const path = decodeURIComponent(pathname.slice(markerIndex + marker.length));
    if (!path.startsWith(`${userId}/`)) {
      throw new Error('No puedes eliminar imágenes de otro usuario.');
    }

    const { error } = await this.supabase.client.storage
      .from(EQUIPMENT_IMAGE_BUCKET)
      .remove([path]);
    if (error) throw error;
  }

  private async requireUserId(): Promise<string> {
    const { data, error } = await this.supabase.client.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Debes iniciar sesión para gestionar imágenes de activos.');
    return data.user.id;
  }
}
