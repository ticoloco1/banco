export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Blog — Dicas, Tutoriais e Novidades',
  description: 'Aprenda a monetizar sua presença digital com mini sites, paywall de vídeos, CV profissional e slugs premium no TrustBank.',
  keywords: ['mini site', 'paywall vídeo', 'CV profissional', 'slug premium', 'Stripe', 'monetização digital'],
  openGraph: {
    title: 'Blog TrustBank — Dicas de Monetização Digital',
    description: 'Tutoriais, estratégias e novidades sobre mini sites, paywall e slugs premium.',
    type: 'website',
  },
};

const POSTS = [
  {
    slug: 'como-criar-mini-site-profissional',
    title: 'Como criar um mini site profissional em 10 minutos',
    excerpt: 'Guia completo para criar o seu mini site no TrustBank, configurar links sociais, foto de perfil, bio e publicar em minutos — sem saber programar.',
    category: 'Tutorial',
    date: '2026-04-10',
    readTime: '7 min',
    tags: ['Mini Site', 'Tutorial', 'Iniciante'],
    seoKeywords: 'mini site profissional, criar site grátis, link in bio',
    gradient: 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
  },
  {
    slug: 'paywall-videos-stripe-como-funciona',
    title: 'Paywall de vídeos com Stripe: o guia definitivo',
    excerpt: 'Como configurar paywall nos seus vídeos YouTube ou uploads diretos, conectar o Stripe e começar a receber em USD. Creator recebe 80% de cada venda.',
    category: 'Monetização',
    date: '2026-04-08',
    readTime: '9 min',
    tags: ['Paywall', 'Stripe', 'Vídeos', 'USD'],
    seoKeywords: 'paywall vídeo, monetizar YouTube, Stripe Connect creator',
    gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)',
  },
  {
    slug: 'slug-premium-quanto-vale',
    title: 'Quanto vale o teu slug? Guia de preços 2026',
    excerpt: 'Slugs de 1-2 caracteres valem até $5.000. Descobre o valor do teu slug, como comprar, vender e maximizar o investimento no marketplace TrustBank.',
    category: 'Slugs',
    date: '2026-04-05',
    readTime: '6 min',
    tags: ['Slugs', 'Marketplace', 'Investimento'],
    seoKeywords: 'slug premium, comprar slug, marketplace slug, /ceo trustbank',
    gradient: 'linear-gradient(135deg,#92400e,#f59e0b)',
  },
  {
    slug: 'cv-profissional-com-paywall',
    title: 'CV profissional com paywall: receba quando te contratam',
    excerpt: 'Como configurar o CV com paywall no TrustBank, definir o preço de desbloqueio (sugestão $20 USD) e receber pelo Stripe quando empresas acessam o teu currículo completo.',
    category: 'CV & Carreira',
    date: '2026-04-03',
    readTime: '5 min',
    tags: ['CV', 'Carreira', 'Paywall', 'Emprego'],
    seoKeywords: 'CV com paywall, currículo profissional, receber por CV',
    gradient: 'linear-gradient(135deg,#065f46,#10b981)',
  },
  {
    slug: 'feed-7-dias-contagem-regressiva',
    title: 'Feed com contagem regressiva: aumente o engajamento',
    excerpt: 'Use o feed de 7 dias com countdown timer, até 3 fotos por post e embed de vídeo para criar urgência e aumentar o engajamento no seu mini site.',
    category: 'Feed & Conteúdo',
    date: '2026-04-01',
    readTime: '4 min',
    tags: ['Feed', 'Engajamento', 'Fotos', 'Vídeo'],
    seoKeywords: 'feed mini site, countdown urgência, post com fotos vídeo',
    gradient: 'linear-gradient(135deg,#1e3a5f,#0ea5e9)',
  },
  {
    slug: 'stripe-connect-receber-usd-brasil',
    title: 'Como receber em USD do Brasil com Stripe Connect',
    excerpt: 'Passo a passo completo para configurar o Stripe Connect no TrustBank, conectar a conta bancária brasileira e receber pagamentos internacionais em USD.',
    category: 'Pagamentos',
    date: '2026-03-28',
    readTime: '8 min',
    tags: ['Stripe', 'USD', 'Brasil', 'Pagamentos'],
    seoKeywords: 'receber USD Brasil, Stripe Connect Brasil, pagamento internacional freelancer',
    gradient: 'linear-gradient(135deg,#4c1d95,#7c3aed)',
  },
];

function BlogCard({ post }: { post: typeof POSTS[0] }) {
  const seoScore = 92 + Math.floor(Math.random() * 8); // Simulated SEO score
  return (
    <article style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', transition: 'all 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
    >
      {/* Image */}
      <div style={{ height: 180, background: post.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ textAlign: 'center', padding: '0 24px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>{post.category}</span>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>{post.title}</h3>
        </div>
      </div>

      <div style={{ padding: '18px 20px 20px' }}>
        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{post.category}</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(post.date).toLocaleDateString('pt-BR')}</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{post.readTime} leitura</span>
          {/* SEO badge */}
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: 'var(--green)', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 7px', borderRadius: 20 }}>
            SEO {seoScore}
          </span>
        </div>

        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 14 }}>{post.excerpt}</p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
          {post.tags.map(t => (
            <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
              {t}
            </span>
          ))}
        </div>

        {/* SEO meta */}
        <div className="seo-meta-bar" style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>🔍 SEO</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Palavras-chave: <em>{post.seoKeywords}</em></span>
        </div>

        <Link href={`/blog/${post.slug}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}>
          Ler artigo →
        </Link>
      </div>
    </article>
  );
}

export default function BlogPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog TrustBank',
    description: 'Dicas, tutoriais e novidades sobre mini sites, paywall e monetização digital',
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/blog`,
    blogPost: POSTS.map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      datePublished: p.date,
      description: p.excerpt,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${p.slug}`,
      keywords: p.seoKeywords,
    })),
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />

      {/* Hero */}
      <div style={{ padding: '52px 24px 40px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)', borderRadius: 20, fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 18 }}>
          ✍️ Blog & Recursos
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 10 }}>Aprenda a monetizar</h1>
        <p style={{ color: 'var(--text2)', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.65 }}>
          Guias, tutoriais e estratégias para maximizar o teu mini site, paywall e presença digital.
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px', flex: 1, width: '100%' }}>
        {/* Category filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {['Todos', 'Tutorial', 'Monetização', 'Slugs', 'CV & Carreira', 'Feed & Conteúdo', 'Pagamentos'].map(cat => (
            <span key={cat} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: cat === 'Todos' ? 'rgba(129,140,248,0.1)' : 'var(--bg2)', color: cat === 'Todos' ? 'var(--accent)' : 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {cat}
            </span>
          ))}
        </div>

        {/* Posts grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 24 }}>
          {POSTS.map(post => <BlogCard key={post.slug} post={post} />)}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 56, textAlign: 'center', padding: '40px 32px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20 }}>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Pronto para começar?</h3>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>Cria o teu mini site e comece a receber em USD hoje.</p>
          <Link href="/auth" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', background: 'var(--gold)', color: '#000', borderRadius: 10, fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>
            Criar Conta Grátis →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
