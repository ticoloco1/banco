export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getIdentitySessionUser } from '@/lib/identitySession';
import { getAssetUrl } from '@/lib/getAssetUrl';
import { isR2Configured, presignPutR2Object, publicUrlForR2Key } from '@/lib/platformR2Server';

const BUCKET = 'platform-assets';
const SAFE_FOLDER_RE = /[^a-z0-9_-]/gi;
const SAFE_NAME_RE = /[^a-z0-9._-]/gi;
const IMAGE_MAX_BYTES = 12 * 1024 * 1024;
const VIDEO_MAX_BYTES = 28 * 1024 * 1024;
const DEFAULT_MAX_BYTES = 12 * 1024 * 1024;

function safeFolder(input: string): string {
  return input.replace(SAFE_FOLDER_RE, '_').slice(0, 64) || 'misc';
}

function safeName(input: string): string {
  const cleaned = input.trim().toLowerCase().replace(SAFE_NAME_RE, '_');
  return cleaned.replace(/^_+|_+$/g, '').slice(0, 120) || 'file';
}

function extFromName(name: string): string {
  const cleaned = name.trim().toLowerCase();
  const idx = cleaned.lastIndexOf('.');
  if (idx <= 0 || idx === cleaned.length - 1) return '';
  return cleaned.slice(idx).replace(/[^.a-z0-9]/g, '');
}

function maxSizeFor(contentType: string): number {
  if (/^video\//i.test(contentType)) return VIDEO_MAX_BYTES;
  if (/^image\//i.test(contentType)) return IMAGE_MAX_BYTES;
  return DEFAULT_MAX_BYTES;
}


export async function POST(req: NextRequest) {
  try {
    const user = await getIdentitySessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Login necessário' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const folder = safeFolder(typeof body.folder === 'string' ? body.folder : 'misc');
    const contentType = typeof body.contentType === 'string' && body.contentType.trim()
      ? body.contentType.trim()
      : 'application/octet-stream';
    const fileName = typeof body.fileName === 'string' ? body.fileName : 'file';
    const fileSize = typeof body.fileSize === 'number' ? body.fileSize : Number(body.fileSize || 0);

    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json({ error: 'fileSize inválido' }, { status: 400 });
    }
    const maxBytes = maxSizeFor(contentType);
    if (fileSize > maxBytes) {
      return NextResponse.json({ error: `Ficheiro excede o limite de ${Math.round(maxBytes / 1024 / 1024)} MB` }, { status: 413 });
    }

    const fileExt = extFromName(fileName);
    const baseName = safeName(fileName.replace(/\.[^.]+$/, ''));
    const objectKey = `${user.id}/${folder}/${Date.now()}-${baseName}${fileExt || ''}`;

    if (isR2Configured()) {
      const putUrl = await presignPutR2Object(objectKey, contentType, 900);
      const publicUrl = publicUrlForR2Key(objectKey);
      return NextResponse.json({
        mode: 'r2',
        putUrl,
        publicUrl,
        path: objectKey,
        contentType,
      });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
      return NextResponse.json({ error: 'Configure R2 ou SUPABASE_SERVICE_ROLE_KEY para uploads' }, { status: 500 });
    }

    return NextResponse.json({
      mode: 'supabase',
      bucket: BUCKET,
      path: objectKey,
      publicUrl: getAssetUrl(BUCKET, objectKey),
      contentType,
    });
  } catch (error) {
    console.error('[platform/upload/presign] POST', error);
    const message = error instanceof Error ? error.message : 'Presign falhou';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
