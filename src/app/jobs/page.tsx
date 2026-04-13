export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Vagas de Emprego — Conecte seu Perfil com Oportunidades',
  description: 'Encontre vagas de emprego remotas e presenciais. Conecte o seu mini site profissional TrustBank com empresas que valorizam o seu talento.',
};

const JOBS = [
  { id: '1', company: 'TechBR Startup', logo: '🚀', role: 'Desenvolvedor Full Stack', location: 'Remoto · Brasil', type: 'CLT', salary: '$5.000–$8.000 USD/mês', tags: ['React', 'Node.js', 'PostgreSQL'], desc: 'Buscamos dev Full Stack para produto SaaS em crescimento. Experiência com React e Node.js obrigatória.', remote: true, featured: true },
  { id: '2', company: 'DesignFlow Agency', logo: '🎨', role: 'UI/UX Designer Senior', location: 'São Paulo · Híbrido', type: 'PJ', salary: '$3.000–$5.000 USD/mês', tags: ['Figma', 'Design System', 'Mobile'], desc: 'Agência de design procura designer com portfolio forte. Projetos para clientes internacionais.', remote: false, featured: false },
  { id: '3', company: 'ContentX Media', logo: '📹', role: 'Video Creator & Editor', location: 'Remoto · Global', type: 'Freelance', salary: '$1.000–$3.000 USD/projeto', tags: ['Video Editing', 'YouTube', 'Content Strategy'], desc: 'Criamos conteúdo para marcas globais. Procuramos criador com experiência em monetização e paywall.', remote: true, featured: true },
  { id: '4', company: 'FinTrack Solutions', logo: '💰', role: 'Product Manager', location: 'Remoto · LATAM', type: 'CLT', salary: '$7.000–$12.000 USD/mês', tags: ['Agile', 'Fintech', 'B2B SaaS'], desc: 'Fintech busca PM com experiência em produtos de pagamento. Inglês fluente obrigatório.', remote: true, featured: false },
  { id: '5', company: 'GrowthHackers Co', logo: '📊', role: 'Growth Marketer', location: 'Remoto · Brasil', type: 'PJ', salary: '$2.500–$4.500 USD/mês', tags: ['SEO', 'Paid Ads', 'Analytics'], desc: 'Startup de tecnologia busca profissional de Growth com foco em aquisição orgânica e paga.', remote: true, featured: false },
  { id: '6', company: 'AI Ventures BR', logo: '🤖', role: 'AI Engineer / LLM Specialist', location: 'Remoto · Global', type: 'PJ', salary: '$10.000–$18.000 USD/mês', tags: ['Python', 'LLM', 'RAG', 'API'], desc: 'Empresa de IA busca especialista em modelos de linguagem para projetos enterprise.', remote: true, featured: true },
];

function JobCard({ job, accent }: { job: typeof JOBS[0]; accent?: boolean }) {
  return (
    <div style={{ background: 'var(--bg2)', border: `1px solid ${accent ? 'rgba(245,158,11,0.35)' : 'var(--border)'}`, borderRadius: 14, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{job.logo}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>{job.role}</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>{job.company}</p>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)', flexShrink: 0 }}>{job.salary}</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 10 }}>{job.desc}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: job.remote ? 'rgba(16,185,129,0.1)' : 'var(--bg3)', color: job.remote ? 'var(--green)' : 'var(--text2)', border: `1px solid ${job.remote ? 'rgba(16,185,129,0.25)' : 'var(--border)'}` }}>
            {job.remote ? '🌍 Remoto' : `📍 ${job.location}`}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>{job.type}</span>
          {job.tags.map(t => (
            <span key={t} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: 'rgba(129,140,248,0.08)', color: 'var(--accent)', border: '1px solid rgba(129,140,248,0.2)' }}>{t}</span>
          ))}
          <span style={{ marginLeft: 'auto', background: 'var(--accent)', color: '#fff', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 700 }}>Candidatar</span>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const featured = JOBS.filter(j => j.featured);
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ padding: '52px 24px 36px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: 18 }}>💼 Vagas &amp; Oportunidades</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 10 }}>Vagas para profissionais digitais</h1>
        <p style={{ color: 'var(--text2)', fontSize: 15, maxWidth: 500, margin: '0 auto 20px', lineHeight: 1.65 }}>Conecte o seu mini site com empresas que valorizam o seu talento. CVs com paywall têm prioridade.</p>
        <Link href="/cv" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: 'var(--green)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Ver Diretório de CVs →</Link>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px', flex: 1, width: '100%' }}>
        {featured.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: 'var(--gold)', color: '#000', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>★ DESTAQUE</span>Vagas em Destaque
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{featured.map(j => <JobCard key={j.id} job={j} accent />)}</div>
          </div>
        )}
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>Todas as Vagas ({JOBS.length})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{JOBS.map(j => <JobCard key={j.id} job={j} />)}</div>
        <div style={{ marginTop: 48, background: 'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(59,130,246,0.06))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: 28, textAlign: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>🏢 Quer publicar uma vaga?</h3>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>Conecte-se com profissionais que têm mini sites e CVs verificados no TrustBank.</p>
          <Link href="/auth" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', background: 'var(--green)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 800 }}>Criar Conta Empresa →</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
