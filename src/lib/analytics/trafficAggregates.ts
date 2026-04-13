export type NamedCount = { name: string; value: number };

export function countByField(
  rows: Record<string, unknown>[],
  field: string,
  emptyLabel: string,
  topN: number,
): NamedCount[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const raw = r[field];
    const k = typeof raw === 'string' && raw.trim() ? raw.trim() : emptyLabel;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, value]) => ({ name, value }));
}

export function countClickKeys(
  clicks: { click_key?: string | null }[],
): NamedCount[] {
  const m = new Map<string, number>();
  for (const c of clicks) {
    const k = (c.click_key || '—').trim() || '—';
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

export function formatDurationSeconds(total: number): string {
  const s = Math.max(0, Math.floor(total));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m < 60) return `${m}m ${sec}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
}
