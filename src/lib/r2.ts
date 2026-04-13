/**
 * Upload público (feed, carros, imóveis) — R2 ou Supabase via /api/platform/upload.
 * O `userId` é ignorado: o servidor usa o utilizador da sessão (evita spoofing).
 */
import { uploadPlatformFileClient } from '@/lib/platformUploadClient';

export async function uploadFile(file: File, folder: string, _userId: string): Promise<string> {
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, '_') || 'misc';
  return uploadPlatformFileClient(file, safeFolder);
}
