import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Cloudflare R2 (API S3). Env no servidor:
 *   R2_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET
 *   NEXT_PUBLIC_R2_PUBLIC_BASE_URL  (sem barra final, ex. https://cdn.teudominio.com)
 *
 * Opcional: R2_ENDPOINT (default https://<ACCOUNT_ID>.r2.cloudflarestorage.com)
 */

function trimSlash(s: string) {
  return s.replace(/\/+$/, '');
}

function firstEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return '';
}

export function isR2Configured(): boolean {
  const account = firstEnv('R2_ACCOUNT_ID');
  const key = firstEnv('R2_ACCESS_KEY_ID');
  const secret = firstEnv('R2_SECRET_ACCESS_KEY');
  const bucket = firstEnv('R2_BUCKET', 'R2_BUCKET_NAME');
  const pub = firstEnv('NEXT_PUBLIC_R2_PUBLIC_BASE_URL', 'R2_PUBLIC_BASE_URL');
  return !!(account && key && secret && bucket && pub);
}

function getS3Client(): S3Client | null {
  if (!isR2Configured()) return null;
  const accountId = firstEnv('R2_ACCOUNT_ID');
  const endpoint =
    process.env.R2_ENDPOINT?.trim() || `https://${accountId}.r2.cloudflarestorage.com`;
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: firstEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: firstEnv('R2_SECRET_ACCESS_KEY'),
    },
  });
}

/** URL HTTPS pública para a chave no bucket (segmentos codificados). */
export function publicUrlForR2Key(objectKey: string): string {
  const base = trimSlash(firstEnv('NEXT_PUBLIC_R2_PUBLIC_BASE_URL', 'R2_PUBLIC_BASE_URL'));
  if (!base) return '';
  const k = objectKey.replace(/^\/+/, '');
  const path = k
    .split('/')
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  return path ? `${base}/${path}` : base;
}

export async function putR2Object(objectKey: string, body: Buffer, contentType: string): Promise<void> {
  const client = getS3Client();
  if (!client) throw new Error('R2 not configured');
  const bucket = firstEnv('R2_BUCKET', 'R2_BUCKET_NAME');
  const key = objectKey.replace(/^\/+/, '');
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType || 'application/octet-stream',
    }),
  );
}

/** URL PUT pré-assinada (browser faz upload directo ao R2, sem passar pelo Next). */
export async function presignPutR2Object(
  objectKey: string,
  contentType: string,
  expiresSeconds = 900,
): Promise<string> {
  const client = getS3Client();
  if (!client) throw new Error('R2 not configured');
  const bucket = firstEnv('R2_BUCKET', 'R2_BUCKET_NAME');
  const key = objectKey.replace(/^\/+/, '');
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType || 'application/octet-stream',
  });
  return getSignedUrl(client, cmd, { expiresIn: Math.min(3600, Math.max(60, expiresSeconds)) });
}
