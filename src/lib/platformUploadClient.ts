'use client';

import { supabase } from '@/lib/supabase';
import { getAssetUrl } from '@/lib/getAssetUrl';

/**
 * Upload para armazenamento de objetos (Cloudflare R2 com URL pré-assinada + PUT no browser,
 * ou Supabase Storage no cliente). Os bytes não passam pelo servidor Next/Vercel — adequado
 * para vídeo/imagens sem consumir largura de banda da app.
 * Admin (favicon): POST multipart pequeno em /api/platform/upload com admin=1.
 */
export async function uploadPlatformFileClient(
  file: File,
  folder: string,
  opts?: { admin?: boolean },
): Promise<string> {
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, '_').slice(0, 64) || 'misc';

  if (opts?.admin) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', safeFolder);
    fd.append('admin', '1');
    const res = await fetch('/api/platform/upload', {
      method: 'POST',
      body: fd,
      credentials: 'same-origin',
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok) {
      throw new Error(typeof data.error === 'string' ? data.error : 'Upload falhou');
    }
    if (typeof data.url !== 'string' || !data.url.trim()) {
      throw new Error('Upload falhou');
    }
    return data.url.trim();
  }

  const pres = await fetch('/api/platform/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      folder: safeFolder,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      fileSize: file.size,
    }),
  });
  const data = (await pres.json().catch(() => ({}))) as {
    mode?: string;
    error?: string;
    putUrl?: string;
    publicUrl?: string;
    bucket?: string;
    path?: string;
    contentType?: string;
  };
  if (!pres.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Presign falhou');
  }

  if (data.mode === 'r2' && typeof data.putUrl === 'string' && typeof data.publicUrl === 'string') {
    const put = await fetch(data.putUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    });
    if (!put.ok) {
      throw new Error('Falha ao enviar para o armazenamento (R2). Verifica CORS no bucket R2.');
    }
    return data.publicUrl.trim();
  }

  if (data.mode === 'supabase' && data.path && data.bucket) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('Login necessário');
    }
    if (!data.path.startsWith(`${session.user.id}/`)) {
      throw new Error('Caminho de upload inválido');
    }
    const { error } = await supabase.storage.from(data.bucket).upload(data.path, file, {
      upsert: true,
      contentType: data.contentType || file.type || 'application/octet-stream',
    });
    if (error) throw new Error(error.message);
    const pub = supabase.storage.from(data.bucket).getPublicUrl(data.path);
    return getAssetUrl(pub.data.publicUrl);
  }

  throw new Error('Resposta de presign inválida');
}
