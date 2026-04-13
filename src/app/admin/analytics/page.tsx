'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { formatDurationSeconds } from '@/lib/analytics/trafficAggregates';

const OWNER_EMAIL = 'arytcf@gmail.com';

type PlatformSession = {
  id: string;
  city: string | null;
  region: string | null;
  entry_path: string | null;
  exit_path: string | null;
  duration_seconds: number | null;
  opened_checkout: boolean | null;
  started_at: string | null;
};

export default function AdminAnalyticsPage() {
  const { user, loading } = useAuth();
  const [adminAllowed, setAdminAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<PlatformSession[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) {
        setAdminAllowed(false);
        return;
      }
      const email = (user.email || '').toLowerCase();
      if (email === OWNER_EMAIL.toLowerCase()) {
        if (!cancelled) setAdminAllowed(true);
        return;
      }
      const { data } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!cancelled) setAdminAllowed(!!data);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.email]);

  const load = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/traffic-platform?limit=150', { cache: 'no-store' });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        sessions?: PlatformSession[];
        total?: number | null;
      };
      if (!res.ok) {
        setError(j.error || 'Falha ao carregar');
        setRows([]);
        return;
      }
      setRows(j.sessions || []);
      setTotal(typeof j.total === 'number' ? j.total : null);
    } catch {
      setError('Erro de rede');
      setRows([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (adminAllowed !== true) return;
    void load();
  }, [adminAllowed, load]);

  if (loading || adminAllowed === null) {
    return (
      <>
        <Header />
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-brand" />
        </div>
      </>
    );
  }

  if (!user || adminAllowed === false) {
    return (
      <>
        <Header />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-[var(--text)] font-bold">Acesso reservado a administradores da plataforma.</p>
          <Link href="/admin" className="text-brand font-semibold mt-4 inline-block">
            Voltar ao painel admin
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-[var(--text)]">Analytics · Tráfego da plataforma</h1>
            <p className="text-sm text-[var(--text2)] mt-1">
              Sessões do site principal (scope <code className="text-brand">platform</code>). Cidade e estado
              vêm dos headers na edge (Vercel / Cloudflare).
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loadingData}
            className="px-4 py-2 rounded-xl border border-[var(--border)] font-bold text-sm text-[var(--text)] hover:border-brand/40 disabled:opacity-50"
          >
            Atualizar
          </button>
        </div>

        {total !== null && (
          <p className="text-xs text-[var(--text2)] mb-3">
            Total de sessões registadas: <span className="text-[var(--text)] font-bold">{total}</span> (amostra na
            tabela: {rows.length})
          </p>
        )}

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-[var(--border)] overflow-x-auto bg-[var(--bg2)]/30">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-[var(--text2)] border-b border-[var(--border)]">
                <th className="p-3 font-semibold">Cidade</th>
                <th className="p-3 font-semibold">Estado / região</th>
                <th className="p-3 font-semibold">Página de entrada</th>
                <th className="p-3 font-semibold">Permanência</th>
                <th className="p-3 font-semibold">Abriu checkout</th>
                <th className="p-3 font-semibold">Início</th>
              </tr>
            </thead>
            <tbody>
              {loadingData && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[var(--text2)]">
                    Nenhuma sessão ainda. Navega no site com o tracker ativo ou confirma se o SQL{' '}
                    <code className="text-brand">supabase-traffic-analytics.sql</code> foi aplicado.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg2)]/80">
                    <td className="p-3 text-[var(--text)]">{r.city || '—'}</td>
                    <td className="p-3 text-[var(--text)]">{r.region || '—'}</td>
                    <td className="p-3 font-mono text-xs text-[var(--text2)] max-w-[220px] truncate">
                      {r.entry_path || '—'}
                    </td>
                    <td className="p-3 text-[var(--text)]">
                      {formatDurationSeconds(Number(r.duration_seconds) || 0)}
                    </td>
                    <td className="p-3">
                      {r.opened_checkout ? (
                        <span className="text-green-400 font-bold">Sim</span>
                      ) : (
                        <span className="text-[var(--text2)]">Não</span>
                      )}
                    </td>
                    <td className="p-3 text-[var(--text2)] whitespace-nowrap text-xs">
                      {r.started_at ? new Date(r.started_at).toLocaleString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
