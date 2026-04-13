import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export {
  slugPrice,
  slugRegistrationDueUsd,
  slugLengthTierUsd,
  isSlugReservedAdminOnly,
  SLUG_EXTRA_REGISTRATION_USD,
  SLUG_RENEWAL_ANNUAL_USD,
} from './slugPolicy';

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

/** IDs de vídeo atuais do YouTube têm 11 caracteres (base64-like). */
const YOUTUBE_VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function isValidYouTubeVideoId(id: string): boolean {
  return YOUTUBE_VIDEO_ID_RE.test(id.trim());
}

function isYouTubeHostname(host: string): boolean {
  const h = host.toLowerCase();
  return h === 'youtu.be' || h === 'www.youtu.be' || h === 'youtube.com' || h.endsWith('.youtube.com');
}

/**
 * Extrai o ID só a partir de URL real do YouTube (youtube.com / youtu.be).
 * Rejeita texto solto ou domínios que não sejam YouTube (o fallback antigo `|| url` aceitava qualquer coisa).
 */
export function extractYouTubeId(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  let normalized = trimmed.replace(/^\/\//, 'https://');
  if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

  let u: URL;
  try {
    u = new URL(normalized);
  } catch {
    return '';
  }

  if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
  if (!isYouTubeHostname(u.hostname)) return '';

  if (u.hostname.toLowerCase() === 'youtu.be' || u.hostname.toLowerCase() === 'www.youtu.be') {
    const id = u.pathname.replace(/^\//, '').split('/')[0]?.split('?')[0] ?? '';
    return isValidYouTubeVideoId(id) ? id : '';
  }

  const v = u.searchParams.get('v');
  if (v && isValidYouTubeVideoId(v)) return v;

  const parts = u.pathname.split('/').filter(Boolean);
  const after = (key: string) => {
    const i = parts.indexOf(key);
    const raw = i >= 0 ? parts[i + 1] : '';
    return raw ? raw.split('?')[0] : '';
  };

  for (const key of ['embed', 'shorts', 'live', 'v']) {
    const id = after(key);
    if (id && isValidYouTubeVideoId(id)) return id;
  }

  return '';
}

/** Paywall ativo só quando o valor da linha é claramente verdadeiro (evita strings truthy acidentais). */
export function isDbPaywallEnabled(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    return s === 'true' || s === 't' || s === '1';
  }
  return false;
}

export function isValidHttpUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export type SupportedVideoSource =
  | { kind: 'yt'; id: string; provider: 'youtube' }
  | { kind: 'embed'; embedUrl: string; provider: 'vimeo' | 'rumble' };

/**
 * Embed-only policy (no direct hosted file delivery by platform).
 * Accepts: YouTube, Vimeo, Rumble URLs and normalizes to safe embed URL.
 */
export function parseSupportedVideoSource(raw: string): SupportedVideoSource | null {
  const t = raw.trim();
  if (!t) return null;

  const ytId = extractYouTubeId(t);
  if (ytId) return { kind: 'yt', id: ytId, provider: 'youtube' };

  let u: URL;
  try {
    const n = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    u = new URL(n);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  const path = u.pathname;

  // Vimeo: vimeo.com/{id} or player.vimeo.com/video/{id}
  if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com') {
    const id =
      path.match(/^\/(?:video\/)?(\d+)/)?.[1] ||
      path.match(/\/(\d+)/)?.[1] ||
      '';
    if (id) return { kind: 'embed', provider: 'vimeo', embedUrl: `https://player.vimeo.com/video/${id}` };
    return null;
  }

  // Rumble: rumble.com/vxxxx... or rumble.com/embed/vxxxx...
  if (host === 'rumble.com' || host === 'www.rumble.com') {
    const embedId =
      path.match(/^\/embed\/([a-z0-9]+)/i)?.[1] ||
      path.match(/^\/(v[a-z0-9]+)(?:[-./]|$)/i)?.[1] ||
      '';
    if (embedId) return { kind: 'embed', provider: 'rumble', embedUrl: `https://rumble.com/embed/${embedId}/` };
    return null;
  }

  return null;
}

/** For teaser/preview embeds shown before unlock. */
export function parsePreviewEmbedUrl(raw: string): string | null {
  const src = parseSupportedVideoSource(raw);
  if (!src) return null;
  if (src.kind === 'yt') return `https://www.youtube-nocookie.com/embed/${src.id}`;
  return src.embedUrl;
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
