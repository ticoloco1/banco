/**
 * URLs públicas de média: Supabase Storage (proxy opcional) ou URL absoluta (ex. R2 + domínio próprio).
 *
 * DNS (no painel Cloudflare): CNAME `assets` → `<project-ref>.supabase.co`, proxy ativo.
 *
 * Env opcional:
 *   NEXT_PUBLIC_STORAGE_PROXY_ORIGIN=https://assets.trustbank.xyz
 *   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co  (para reescrever URLs antigas)
 *
 * Nota: a API do Supabase usa o segmento **object** (`/storage/v1/object/public/`), não `obj`.
 */

const DEFAULT_PROXY_ORIGIN = '';

/** Caminho oficial da API Storage para buckets públicos. */
const STORAGE_V1_PUBLIC_PREFIX = '/storage/v1/object/public';

function trimOrigin(raw: string): string {
  return raw.replace(/\/+$/, '');
}

function getStorageProxyOrigin(): string {
  const o = process.env.NEXT_PUBLIC_STORAGE_PROXY_ORIGIN?.trim();
  return trimOrigin(o || DEFAULT_PROXY_ORIGIN);
}

function getSupabaseBaseOrigin(): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return base ? trimOrigin(base) : '';
}

function getProjectRef(): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!base) return null;
  try {
    const host = new URL(base).hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function supabaseStorageHost(ref: string): string {
  return `${ref}.supabase.co`;
}

function normalizeBucketPath(bucket: string, path: string): string {
  const b = bucket.replace(/^\/+|\/+$/g, '');
  const p = path.replace(/^\/+/, '');
  if (!b || !p || b.includes('..') || p.includes('..')) return '';
  return `${b}/${p}`;
}

/**
 * Forma preferida: bucket + caminho dentro do bucket (ex.: `platform-assets`, `userId/banners/x.jpg`).
 * Equivale a `https://assets.trustbank.xyz/storage/v1/object/public/{bucket}/{path}`.
 */
export function getAssetUrl(bucket: string, path: string): string;

/**
 * Compatibilidade: URL absoluta (Supabase ou proxy), `bucket/chave/...` numa string, ou URLs externas.
 */
export function getAssetUrl(path: string | null | undefined): string;

export function getAssetUrl(
  bucketOrPath: string | null | undefined,
  pathMaybe?: string,
): string {
  if (bucketOrPath == null) return '';

  if (pathMaybe !== undefined) {
    const url = buildPublicUrlFromBucket(bucketOrPath, pathMaybe);
    return url;
  }

  return resolveSingleArg(String(bucketOrPath).trim());
}

function buildPublicUrlFromBucket(bucket: string, path: string): string {
  const base = getStorageProxyOrigin() || getSupabaseBaseOrigin();
  const combined = normalizeBucketPath(bucket.trim(), path.trim());
  if (!base || !combined) return '';
  return `${base}${STORAGE_V1_PUBLIC_PREFIX}/${combined}`;
}

function resolveSingleArg(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

  const proxy = getStorageProxyOrigin();
  if (proxy && raw.startsWith(proxy)) return raw;

  const ref = getProjectRef();

  if (/^https?:\/\//i.test(raw)) {
    const lower = raw.toLowerCase();
    if (ref) {
      const host = supabaseStorageHost(ref);
      if (lower.includes(`${host}/`) && lower.includes('/storage/v1/')) {
        try {
          const u = new URL(raw);
          if (!proxy) return raw;
          return `${proxy}${u.pathname}${u.search}${u.hash}`;
        } catch {
          return raw.replace(new RegExp(`^https?://${host.replace(/\./g, '\\.')}`, 'i'), proxy);
        }
      }
    }
    return raw;
  }

  const p = raw.replace(/^\/+/, '');
  if (p.includes('..')) return raw;
  const base = proxy || getSupabaseBaseOrigin();
  if (!base) return raw;
  return `${base}${STORAGE_V1_PUBLIC_PREFIX}/${p}`;
}

export function getAssetUrls(paths?: (string | null | undefined)[] | null): string[] {
  if (!paths?.length) return [];
  return paths.map((p) => getAssetUrl(p));
}

/** Reescreve URLs absolutas do host Storage do projeto para o origin do proxy (HTML embeds, etc.). */
export function rewriteSupabaseStorageInHtml(html: string): string {
  if (!html) return html;
  const proxy = getStorageProxyOrigin();
  const ref = getProjectRef();
  if (!proxy || !ref) return html;
  const host = supabaseStorageHost(ref);
  const re = new RegExp(`https?://${host.replace(/\./g, '\\.')}`, 'gi');
  return html.replace(re, proxy);
}

/**
 * Replicate/outros serviços externos podem falhar a buscar imagens atrás do proxy Cloudflare.
 * Se a URL for o nosso proxy de Storage, devolve o URL direto em *.supabase.co (mesmo path).
 */
export function directSupabaseStorageUrlForFetch(url: string): string {
  const raw = String(url).trim();
  if (!raw || !/^https?:\/\//i.test(raw)) return raw;
  const ref = getProjectRef();
  if (!ref) return raw;
  try {
    const u = new URL(raw);
    const proxyBase = getStorageProxyOrigin();
    if (!proxyBase) return raw;
    const pu = new URL(proxyBase.startsWith('http') ? proxyBase : `https://${proxyBase}`);
    if (
      u.hostname.toLowerCase() === pu.hostname.toLowerCase() &&
      u.pathname.includes('/storage/v1/')
    ) {
      return `https://${supabaseStorageHost(ref)}${u.pathname}${u.search}${u.hash}`;
    }
  } catch {
    /* ignore */
  }
  return raw;
}
