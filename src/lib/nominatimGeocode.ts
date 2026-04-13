/**
 * Geocodificação gratuita via Nominatim (OpenStreetMap).
 * Política de utilização: máx. 1 req/s; User-Agent identificável.
 */
const UA = 'TrustBank-Classified/1.0 (https://trustbank.xyz)';

export type NominatimHit = { lat: number; lng: number; display_name: string };

export async function nominatimGeocode(query: string): Promise<NominatimHit | null> {
  const q = query.trim();
  if (q.length < 3) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const arr = (await res.json()) as { lat?: string; lon?: string; display_name?: string }[];
    const row = arr?.[0];
    if (!row?.lat || !row?.lon) return null;
    const lat = parseFloat(row.lat);
    const lng = parseFloat(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, display_name: String(row.display_name || q) };
  } catch {
    return null;
  }
}
