export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { putPlatformObject } from '@/lib/platformStorageServer';
import { getIdentitySessionUser } from '@/lib/identitySession';
import { isPlatformAdminUser } from '@/lib/platformAdminServer';

const MAX_ADMIN_UPLOAD_BYTES = 5 * 1024 * 1024;
const SAFE_NAME_RE = /[^a-z0-9._-]/gi;
const SAFE_FOLDER_RE = /[^a-z0-9_-]/gi;

function extFromName(name: string): string {
  const cleaned = name.trim().toLowerCase();
  const idx = cleaned.lastIndexOf('.');
  if (idx <= 0 || idx === cleaned.length - 1) return '';
  return cleaned.slice(idx).replace(/[^.a-z0-9]/g, '');
}

function safeFolder(input: string): string {
  return input.replace(SAFE_FOLDER_RE, '_').slice(0, 64) || 'misc';
}

function safeName(input: string): string {
  const cleaned = input.trim().toLowerCase().replace(SAFE_NAME_RE, '_');
  return cleaned.replace(/^_+|_+$/g, '').slice(0, 80) || 'file';
}

function looksLikeImage(contentType: string): boolean {
  return /^image\//i.test(contentType);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getIdentitySessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Login necessário' }, { status: 401 });
    }

    const form = await req.formData();
    const admin = String(form.get('admin') || '').trim() === '1';
    if (!admin) {
      return NextResponse.json({ error: 'Use /api/platform/upload/presign para uploads normais' }, { status: 400 });
    }

    const allowed = await isPlatformAdminUser(user);
    if (!allowed) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const file = form.get('file');
    const folder = safeFolder(String(form.get('folder') || 'misc'));
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Ficheiro em falta' }, { status: 400 });
    }
    if (!file.size) {
      return NextResponse.json({ error: 'Ficheiro vazio' }, { status: 400 });
    }
    if (file.size > MAX_ADMIN_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Ficheiro demasiado grande para upload admin' }, { status: 413 });
    }
    const contentType = (file.type || 'application/octet-stream').trim();
    if (!looksLikeImage(contentType)) {
      return NextResponse.json({ error: 'Apenas imagens são permitidas nesta rota' }, { status: 415 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const fileExt = extFromName(file.name) || '.bin';
    const base = safeName(file.name.replace(/\.[^.]+$/, ''));
    const objectKey = `${folder}/${Date.now()}-${base}${fileExt}`;
    const url = await putPlatformObject(objectKey, bytes, contentType);

    return NextResponse.json({ url, key: objectKey });
  } catch (error) {
    console.error('[platform/upload] POST', error);
    const message = error instanceof Error ? error.message : 'Falha no upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
