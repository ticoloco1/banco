'use client';

const VID_KEY = 'tb_traffic_visitor_id';

function randomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `v_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  }
}

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let v = localStorage.getItem(VID_KEY);
    if (!v || v.length < 8) {
      v = randomId();
      localStorage.setItem(VID_KEY, v);
    }
    return v;
  } catch {
    return randomId();
  }
}

export function platformSessionKeys() {
  return { sid: 'tb_traffic_plat_session', start: 'tb_traffic_plat_start', checkout: 'tb_traffic_plat_checkout' };
}

export function minisiteSessionKeys(siteId: string) {
  return {
    sid: `tb_traffic_ms_${siteId}_session`,
    start: `tb_traffic_ms_${siteId}_start`,
    checkout: `tb_traffic_ms_${siteId}_checkout`,
  };
}
