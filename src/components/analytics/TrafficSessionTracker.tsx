'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';
import {
  getOrCreateVisitorId,
  minisiteSessionKeys,
  platformSessionKeys,
} from '@/lib/analytics/trafficSessionStorage';

async function postTraffic(body: Record<string, unknown>) {
  try {
    const res = await fetch('/api/public/traffic-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
    return res.json().catch(() => ({}));
  } catch {
    return {};
  }
}

/**
 * Sessão + cliques (data-tb-analytics) + flag de carrinho/checkout.
 * - platform: site principal (exclui rotas /s/*)
 * - minisite: dentro de /s/[slug], com siteId
 */
export function TrafficSessionTracker({
  mode,
  siteId,
  enabled = true,
}: {
  mode: 'platform' | 'minisite';
  siteId?: string | null;
  enabled?: boolean;
}) {
  const pathname = usePathname() || '/';
  const visitorRef = useRef('');
  const keys = useMemo(
    () => (mode === 'platform' ? platformSessionKeys() : minisiteSessionKeys(siteId || 'unknown')),
    [mode, siteId],
  );

  const skipPlatform = mode === 'platform' && (pathname.startsWith('/s/') || pathname.startsWith('/stats/'));
  const skip = !enabled || pathname.startsWith('/api') || pathname.startsWith('/_next') || skipPlatform;

  useEffect(() => {
    if (skip) return;
    if (typeof window === 'undefined') return;
    if (!visitorRef.current) visitorRef.current = getOrCreateVisitorId();

    const { sid: sidKey, start: startKey, checkout: coKey } = keys;

    let cancelled = false;
    const ensureSession = async () => {
      let sessionId = sessionStorage.getItem(sidKey);
      if (sessionId) return sessionId;
      const entry = `${window.location.pathname}${window.location.search || ''}`.slice(0, 500);
      const payload: Record<string, unknown> = {
        type: 'session_start',
        scope: mode === 'platform' ? 'platform' : 'minisite',
        visitor_id: visitorRef.current,
        entry_path: entry,
      };
      if (mode === 'minisite' && siteId) payload.site_id = siteId;
      const j = (await postTraffic(payload)) as { sessionId?: string };
      if (cancelled || !j.sessionId) return null;
      sessionStorage.setItem(sidKey, j.sessionId);
      sessionStorage.setItem(startKey, String(Date.now()));
      return j.sessionId;
    };

    void ensureSession();

    const onCartOpen = () => {
      try {
        sessionStorage.setItem(coKey, '1');
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('tb-analytics-cart-open', onCartOpen);

    const onClickCapture = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      const el = t?.closest?.('[data-tb-analytics]') as HTMLElement | null;
      if (!el) return;
      const clickKey = el.getAttribute('data-tb-analytics')?.trim();
      if (!clickKey) return;
      const sid = sessionStorage.getItem(sidKey);
      if (!sid || !visitorRef.current) return;
      void postTraffic({
        type: 'click',
        session_id: sid,
        visitor_id: visitorRef.current,
        click_key: clickKey.slice(0, 160),
        page_path: `${window.location.pathname}${window.location.search || ''}`.slice(0, 500),
      });
    };
    document.addEventListener('click', onClickCapture, true);

    const flushSession = () => {
      const sid = sessionStorage.getItem(sidKey);
      const start = Number(sessionStorage.getItem(startKey) || '0');
      if (!sid || !visitorRef.current || !start) return;
      const duration = Math.floor((Date.now() - start) / 1000);
      const checkout = sessionStorage.getItem(coKey) === '1';
      const exitPath =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search || ''}`.slice(0, 500)
          : pathname;
      void postTraffic({
        type: 'session_end',
        session_id: sid,
        visitor_id: visitorRef.current,
        exit_path: exitPath,
        duration_seconds: duration,
        opened_checkout: checkout,
      });
    };

    const onPageHide = () => flushSession();
    window.addEventListener('pagehide', onPageHide);

    return () => {
      cancelled = true;
      window.removeEventListener('tb-analytics-cart-open', onCartOpen);
      document.removeEventListener('click', onClickCapture, true);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [skip, mode, siteId, pathname, keys]);

  return null;
}
