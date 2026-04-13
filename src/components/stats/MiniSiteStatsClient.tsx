'use client';

import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDurationSeconds, type NamedCount } from '@/lib/analytics/trafficAggregates';
import { FileDown, ArrowLeft } from 'lucide-react';

const PIE_COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f472b6', '#38bdf8', '#a78bfa', '#fb923c'];

export type SessionRow = {
  id: string;
  city: string | null;
  region: string | null;
  entry_path: string | null;
  exit_path: string | null;
  duration_seconds: number | null;
  opened_checkout: boolean | null;
  started_at: string | null;
};

type Props = {
  slug: string;
  siteName: string;
  topCities: NamedCount[];
  topRegions: NamedCount[];
  clicks: NamedCount[];
  recentSessions: SessionRow[];
};

export function MiniSiteStatsClient({
  slug,
  siteName,
  topCities,
  topRegions,
  clicks,
  recentSessions,
}: Props) {
  const exportPdf = () => {
    window.location.href = `/api/stats/${encodeURIComponent(slug)}/export-pdf`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Painel
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text)] tracking-tight">
            Estatísticas · {siteName}
          </h1>
          <p className="text-sm text-[var(--text2)] mt-1 font-mono">{slug}.trustbank.xyz</p>
        </div>
        <button
          type="button"
          onClick={exportPdf}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-white font-bold px-5 py-3 text-sm hover:opacity-90 shadow-lg shadow-brand/20"
        >
          <FileDown className="w-4 h-4" />
          Gerar PDF de performance
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card p-6 border border-[var(--border)] rounded-2xl bg-[var(--bg2)]/40">
          <h2 className="text-lg font-black text-[var(--text)] mb-4">Top 5 cidades</h2>
          <div className="h-[280px] w-full">
            {topCities.length === 0 ? (
              <p className="text-sm text-[var(--text2)] flex items-center justify-center h-full">
                Sem amostras com cidade (headers de geo podem estar vazios fora da edge).
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCities} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--text2)" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    stroke="var(--text2)"
                    fontSize={11}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="value" name="Sessões" fill="#818cf8" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card p-6 border border-[var(--border)] rounded-2xl bg-[var(--bg2)]/40">
          <h2 className="text-lg font-black text-[var(--text)] mb-4">Top 5 estados / regiões</h2>
          <div className="h-[280px] w-full">
            {topRegions.length === 0 ? (
              <p className="text-sm text-[var(--text2)] flex items-center justify-center h-full">
                Sem dados de região nas sessões analisadas.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topRegions}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                    }
                  >
                    {topRegions.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {clicks.length > 0 && (
        <div className="card p-6 border border-[var(--border)] rounded-2xl">
          <h2 className="text-lg font-black text-[var(--text)] mb-2">Cliques rastreados</h2>
          <p className="text-xs text-[var(--text2)] mb-4">
            Elementos com <code className="text-brand">data-tb-analytics</code> (ex.: Planos, Paywall).
          </p>
          <div className="flex flex-wrap gap-2">
            {clicks.map((c) => (
              <span
                key={c.name}
                className="px-3 py-1.5 rounded-lg bg-brand/15 text-brand text-sm font-bold border border-brand/25"
              >
                {c.name}: {c.value}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6 border border-[var(--border)] rounded-2xl overflow-x-auto">
        <h2 className="text-lg font-black text-[var(--text)] mb-4">Últimas sessões</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--text2)] border-b border-[var(--border)]">
              <th className="pb-3 pr-4 font-semibold">Cidade</th>
              <th className="pb-3 pr-4 font-semibold">Entrada</th>
              <th className="pb-3 pr-4 font-semibold">Permanência</th>
              <th className="pb-3 font-semibold">Checkout</th>
            </tr>
          </thead>
          <tbody>
            {recentSessions.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[var(--text2)]">
                  Ainda não há sessões com o tracker ativo. Publica o site e aguarda visitas.
                </td>
              </tr>
            ) : (
              recentSessions.map((s) => (
                <tr key={s.id} className="border-b border-[var(--border)]/60">
                  <td className="py-3 pr-4 text-[var(--text)]">{s.city || '—'}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-[var(--text2)] max-w-[200px] truncate">
                    {s.entry_path || '—'}
                  </td>
                  <td className="py-3 pr-4 text-[var(--text)]">
                    {formatDurationSeconds(Number(s.duration_seconds) || 0)}
                  </td>
                  <td className="py-3">
                    {s.opened_checkout ? (
                      <span className="text-green-400 font-bold">Sim</span>
                    ) : (
                      <span className="text-[var(--text2)]">Não</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
