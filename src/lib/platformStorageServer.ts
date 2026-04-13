import { createClient } from '@supabase/supabase-js';
import { getAssetUrl } from '@/lib/getAssetUrl';
import { isR2Configured, putR2Object, publicUrlForR2Key } from '@/lib/platformR2Server';

const BUCKET = 'platform-assets';

/**
 * Grava bytes no R2 (se configurado) ou no bucket Supabase `platform-assets`.
 * Devolve URL pública para guardar em BD (getAssetUrl deixa URLs absolutas R2/HTTPS como estão).
 */
export async function putPlatformObject(
  objectKey: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const key = objectKey.replace(/^\/+/, '');
  if (!key || key.includes('..')) throw new Error('Invalid object key');

  if (isR2Configured()) {
    await putR2Object(key, body, contentType);
    const url = publicUrlForR2Key(key);
    if (!url) throw new Error('NEXT_PUBLIC_R2_PUBLIC_BASE_URL missing');
    return url;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sr = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !sr) {
    throw new Error('Configure R2 (R2_*) ou Supabase SUPABASE_SERVICE_ROLE_KEY para uploads.');
  }
  const db = createClient(url, sr);
  const { error } = await db.storage.from(BUCKET).upload(key, body, {
    contentType: contentType || 'application/octet-stream',
    upsert: true,
  });
  if (error) throw new Error(error.message);
  const pub = db.storage.from(BUCKET).getPublicUrl(key);
  return getAssetUrl(pub.data.publicUrl);
}

export { isR2Configured } from '@/lib/platformR2Server';
