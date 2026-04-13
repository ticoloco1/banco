import Link from 'next/link';
import { Header } from '@/components/layout/Header';

export const metadata = {
  title: 'Analytics público TrustBank — Media kit',
  description:
    'Módulo de analytics multi-tenant para mini-sites: geo na edge, sessões, heatmap de cliques e PDF para anunciantes.',
};

export default function MediaKitAnalyticsPage() {
  return (
    <>
      <Header />
      <article className="max-w-3xl mx-auto px-4 py-14 space-y-8 text-[var(--text)]">
        <p className="text-sm font-bold text-brand uppercase tracking-wider">Media kit · Parceiros & Cursor</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Analytics integrado no TrustBank</h1>
        <p className="text-[var(--text2)] leading-relaxed">
          O TrustBank inclui um pipeline de analytics <strong>first-party</strong>: os dados ficam na vossa base
          PostgreSQL (Supabase), com separação por mini-site, sem depender de pixels de terceiros para o núcleo do
          relatório.
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-black">O que é medido</h2>
          <ul className="list-disc pl-5 space-y-2 text-[var(--text2)]">
            <li>
              <strong className="text-[var(--text)]">Geolocalização aproximada</strong> — cidade e estado/região a
              partir dos headers da edge (ex.: <code className="text-brand text-xs">x-vercel-ip-city</code>,{' '}
              <code className="text-brand text-xs">x-vercel-ip-country-region</code>, Cloudflare).
            </li>
            <li>
              <strong className="text-[var(--text)]">Sessão</strong> — página de entrada, última página (saída),
              tempo de permanência e se o visitante abriu o fluxo de checkout (carrinho).
            </li>
            <li>
              <strong className="text-[var(--text)]">Heatmap de intenção</strong> — cliques em elementos marcados com{' '}
              <code className="text-brand text-xs">data-tb-analytics=&quot;…&quot;</code> (ex.: Planos, Paywall).
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black">Multi-tenancy</h2>
          <p className="text-[var(--text2)] leading-relaxed">
            Cada mini-site grava sessões e cliques com <code className="text-brand text-xs">site_id</code>. A
            plataforma usa o mesmo mecanismo com <code className="text-brand text-xs">scope: platform</code> para o
            tráfego do domínio principal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black">Para anunciantes</h2>
          <p className="text-[var(--text2)] leading-relaxed">
            Donos do mini-site acedem a <code className="text-brand text-xs">/stats/[slug]</code> com gráficos
            (Recharts) e podem <strong>exportar PDF de performance</strong> como anexo em propostas comerciais.
          </p>
        </section>

        <section className="rounded-2xl border border-[var(--border)] p-6 bg-[var(--bg2)]/40">
          <h2 className="text-lg font-black mb-2">Integração técnica (resumo)</h2>
          <p className="text-sm text-[var(--text2)] mb-3">
            Ingestão: <code className="text-brand">POST /api/public/traffic-analytics</code> (JSON). O cliente envia{' '}
            <code className="text-brand">session_start</code>, <code className="text-brand">session_end</code> e{' '}
            <code className="text-brand">click</code>; o servidor preenche geo a partir dos headers.
          </p>
          <Link href="/" className="text-brand font-bold hover:underline">
            ← Voltar ao início
          </Link>
        </section>
      </article>
    </>
  );
}
