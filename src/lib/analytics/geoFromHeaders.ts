/**
 * Geolocalização a partir de headers na edge (Vercel, Cloudflare, CloudFront).
 * Cidade e região (estado) quando disponíveis.
 */

function trunc(s: unknown, n: number): string | null {
  if (s == null || s === '') return null;
  const t = String(s).slice(0, n);
  return t || null;
}

function safeDecodeCity(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export type GeoFromRequest = {
  country: string | null;
  city: string | null;
  region: string | null;
  ip: string | null;
};

export function geoFromRequestHeaders(h: Headers): GeoFromRequest {
  const country =
    h.get('x-vercel-ip-country') ||
    h.get('cf-ipcountry') ||
    h.get('cloudfront-viewer-country') ||
    null;

  const city = safeDecodeCity(h.get('x-vercel-ip-city'));

  const region =
    h.get('x-vercel-ip-country-region') ||
    h.get('cf-region') ||
    h.get('cf-region-code') ||
    h.get('cloudfront-viewer-country-region') ||
    null;

  const ip =
    h.get('x-real-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('cf-connecting-ip') ||
    null;

  return {
    country: trunc(country, 8),
    city: trunc(city, 120),
    region: trunc(region, 120),
    ip: trunc(ip, 64),
  };
}
