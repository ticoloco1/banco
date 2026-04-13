export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { notFound } from 'next/navigation';

const POSTS: Record<string, {
  title: string; excerpt: string; category: string; date: string; readTime: string;
  tags: string[]; seoKeywords: string; gradient: string; content: string;
}> = {
  'como-criar-mini-site-profissional': {
    title: 'Como criar um mini site profissional em 10 minutos',
    excerpt: 'Guia completo para criar o seu mini site no TrustBank sem saber programar.',
    category: 'Tutorial', date: '2026-04-10', readTime: '7 min',
    tags: ['Mini Site', 'Tutorial', 'Iniciante'],
    seoKeywords: 'mini site profissional, criar site grátis, link in bio',
    gradient: 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
    content: `
## O que é um mini site no TrustBank?

O mini site é o teu espaço digital pessoal: uma página com o teu slug (ex: **/seunome.trustbank.xyz**) onde podes colocar todos os teus links, foto, bio, vídeos com paywall, CV profissional e feed de conteúdos.

## Passo 1: Criar a conta

Acede a [trustbank.xyz/auth](/auth) e faz login com Google. É rápido e seguro — não precisas de cartão de crédito para criar a conta.

## Passo 2: Escolher o teu slug

O slug é o teu endereço. Vai ao [Slugs Market](/slugs) e verifica se o slug que queres está disponível. Slugs com 16+ caracteres são **gratuitos**. Slugs curtos como **/dev** ou **/ceo** têm preço premium.

## Passo 3: Configurar o editor

No [Editor](/editor) podes:
- Fazer upload da foto de perfil e banner
- Escrever a tua bio
- Adicionar links para redes sociais (Instagram, YouTube, LinkedIn, TikTok, X...)
- Escolher entre **30+ temas** premium
- Ativar o feed de posts

## Passo 4: Ativar o Stripe Connect

Para receber pagamentos de paywall e desbloqueio de CV, conecta a tua conta bancária via **Stripe Connect** nas definições do editor. É o mesmo sistema que Uber e Shopify usam para pagar os seus parceiros.

## Passo 5: Publicar e partilhar

Clica em "Publicar" e o teu mini site fica em direto em **slug.trustbank.xyz**. Partilha o link nas redes sociais, email e onde quiseres.

## Dicas de otimização

- Use uma foto profissional de alta qualidade
- Escreve uma bio clara e direta (máx. 160 caracteres)
- Coloca os links mais importantes no topo
- Ativa o SEO nas definições para aparecer no Google
    `,
  },
  'paywall-videos-stripe-como-funciona': {
    title: 'Paywall de vídeos com Stripe: o guia definitivo',
    excerpt: 'Como configurar paywall nos seus vídeos YouTube e receber em USD via Stripe.',
    category: 'Monetização', date: '2026-04-08', readTime: '9 min',
    tags: ['Paywall', 'Stripe', 'Vídeos', 'USD'],
    seoKeywords: 'paywall vídeo, monetizar YouTube, Stripe Connect creator',
    gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)',
    content: `
## Como funciona o paywall de vídeos

O paywall permite que os teus visitantes paguem para assistir aos teus vídeos. Funciona com:
- **Vídeos do YouTube** — embed com paywall por cima
- **Upload direto** — carrega diretamente para a plataforma
- **Preço livre** — tu defines o preço (sugestão: $6.99 USD)

## Split de receita

- **Plano Pro:** tu recebes **80%**, a plataforma fica com 20%
- **Plano Free:** tu recebes **60%**, a plataforma fica com 40%

## Configurar o Stripe Connect

1. Vai ao [Editor](/editor) → Monetização → Stripe Connect
2. Segue as instruções para conectar a tua conta bancária
3. Após aprovação (normalmente 1-2 dias úteis), podes receber pagamentos

## Adicionar um vídeo com paywall

1. No editor, vai à secção de Vídeos
2. Cola o link do YouTube ou faz upload do ficheiro
3. Ativa a opção "Paywall" e define o preço em USD
4. Publica — o vídeo aparece bloqueado para quem não pagou

## Melhores práticas

- Mostra um **preview gratuito** de 30-60 segundos para converter visitantes
- Define preços entre **$2.99 e $19.99** — o sweet spot para conversão
- Usa títulos e thumbnails atrativos
- Promove nos stories e redes sociais com link direto
    `,
  },
  'slug-premium-quanto-vale': {
    title: 'Quanto vale o teu slug? Guia de preços 2026',
    excerpt: 'Descobre o valor do teu slug e como maximizar o investimento no marketplace.',
    category: 'Slugs', date: '2026-04-05', readTime: '6 min',
    tags: ['Slugs', 'Marketplace', 'Investimento'],
    seoKeywords: 'slug premium, comprar slug, marketplace slug',
    gradient: 'linear-gradient(135deg,#92400e,#f59e0b)',
    content: `
## Tabela de preços de slugs

| Chars | Preço USD | Tier |
|-------|-----------|------|
| 1 char | $5.000 | Ultra Rare |
| 2 chars | $4.500 | Ultra Rare |
| 3 chars | $4.000 | Legendary |
| 4 chars | $3.500 | Legendary |
| 5 chars | $3.000 | Premium |
| 6 chars | $2.500 | Premium |
| 7 chars | $2.000 | Premium |
| 8 chars | $1.500 | Popular |
| 9-10 chars | $800-$1.000 | Popular |
| 11-15 chars | $160-$650 | Standard |
| 16+ chars | GRÁTIS | Free |

## Por que os slugs curtos valem mais?

Tal como domínios .com curtos, slugs curtos são **escassos e memoráveis**. Quem tem **/ceo** ou **/art** tem uma vantagem enorme em branding e reconhecimento.

## Como vender o teu slug

No [dashboard](/dashboard) podes colocar o teu slug à venda com o preço que defines. Quando alguém compra, o pagamento vai diretamente para a tua conta via Stripe.

## Wildcards — registos em massa

Para marcas e agências que querem registar múltiplos slugs com padrão (ex: /brand1, /brand2), oferecemos planos wildcard. Contacta-nos para mais informação.
    `,
  },
  'cv-profissional-com-paywall': {
    title: 'CV profissional com paywall: receba quando te contratam',
    excerpt: 'Configure o CV com paywall e receba por cada empresa que acessa o teu currículo.',
    category: 'CV & Carreira', date: '2026-04-03', readTime: '5 min',
    tags: ['CV', 'Carreira', 'Paywall'],
    seoKeywords: 'CV com paywall, currículo profissional, receber por CV',
    gradient: 'linear-gradient(135deg,#065f46,#10b981)',
    content: `
## O conceito do CV com paywall

No TrustBank, podes colocar o teu currículo completo atrás de um paywall. Empresas e recrutadores pagam um valor (que tu defines) para ver o teu CV completo — experiências detalhadas, contatos, portfolio privado.

## Como configurar

1. Vai ao [Editor](/editor) → CV
2. Preenche todos os campos: experiência, formação, competências, idiomas
3. Ativa "CV Protegido" e define o preço (sugestão: $20 USD)
4. Publica

## Split de receita

- **Tu recebes:** 50%
- **Plataforma:** 50%

## O que o recrutador vê antes de pagar

- Nome e cargo atual
- Headline profissional
- Localização
- Skills principais (em resumo)
- Preview "fuzzy" das últimas experiências

## Estratégia de preço

- **$5-$15 USD:** Para quem está começando, mais acessível
- **$20-$50 USD:** Mid-level, sénior
- **$50-$200 USD:** Executivos, especialistas muito procurados

Quanto maior a tua especialização e escassez no mercado, maior podes cobrar.

## Dica de marketing

Partilha o link do teu mini site (/s/seunome) nas candidaturas. Os recrutadores que estão realmente interessados vão pagar para ver o CV completo — um filtro natural de qualidade.
    `,
  },
  'feed-7-dias-contagem-regressiva': {
    title: 'Feed com contagem regressiva: aumente o engajamento',
    excerpt: 'Use o feed de 7 dias com countdown e fotos para criar urgência e engajamento.',
    category: 'Feed & Conteúdo', date: '2026-04-01', readTime: '4 min',
    tags: ['Feed', 'Engajamento', 'Fotos'],
    seoKeywords: 'feed mini site, countdown urgência, post com fotos vídeo',
    gradient: 'linear-gradient(135deg,#1e3a5f,#0ea5e9)',
    content: `
## O feed de 7 dias

O feed do TrustBank aparece no [diretório global](/explore/feed) e no teu mini site. Cada post pode durar **7 dias** ou **365 dias** (plano anual).

## O que podes incluir num post

- **Texto:** até 2.000 caracteres
- **Fotos:** até 3 fotos em grid (1, 2 ou 3 colunas)
- **Vídeo:** embed do YouTube, Vimeo ou upload direto
- **Countdown:** contagem regressiva automática até o post expirar

## Preços do feed

- **Plano Pro — 7 dias:** GRÁTIS
- **Plano Free — 7 dias:** $3 USD
- **Plano Pro — 365 dias (pinado):** $10 USD
- **Plano Free — 365 dias:** $20 USD

## Como criar urgência com o countdown

O countdown aparece no canto do post mostrando dias, horas, minutos e segundos até o post expirar. Isso cria **urgência psicológica** nos visitantes — um técnica usada em e-commerce para aumentar conversões em 15-30%.

## Dicas de conteúdo

- **Lançamentos:** "Novo vídeo disponível por 7 dias — link abaixo"
- **Promoções:** "50% de desconto só até domingo"  
- **Eventos:** "Workshop ao vivo em 48 horas"
- **Portfolio:** "Novo projeto — vê nos comentários"
    `,
  },
  'stripe-connect-receber-usd-brasil': {
    title: 'Como receber em USD do Brasil com Stripe Connect',
    excerpt: 'Passo a passo para configurar o Stripe Connect e receber pagamentos internacionais.',
    category: 'Pagamentos', date: '2026-03-28', readTime: '8 min',
    tags: ['Stripe', 'USD', 'Brasil'],
    seoKeywords: 'receber USD Brasil, Stripe Connect Brasil, pagamento internacional freelancer',
    gradient: 'linear-gradient(135deg,#4c1d95,#7c3aed)',
    content: `
## O que é o Stripe Connect?

O Stripe Connect é o sistema que permite que plataformas como o TrustBank paguem diretamente os seus utilizadores. É o mesmo sistema usado pelo Uber, Shopify, Airbnb e outras plataformas globais.

## Documentos necessários (Brasil)

- CPF ou CNPJ
- Dados bancários (conta corrente brasileira)
- Comprovante de residência (para verificação de identidade)
- Telefone para verificação SMS

## Passo a passo de configuração

1. **Acede ao Editor** → Configurações → Conectar Stripe
2. **Clica em "Criar conta Stripe"** — serás redirecionado para o Stripe
3. **Preenche os dados** — nome, CPF/CNPJ, data de nascimento, endereço
4. **Dados bancários** — agência, conta, banco
5. **Verificação** — o Stripe pode pedir selfie ou documento
6. **Aguarda aprovação** — normalmente 1-3 dias úteis

## Como os saques funcionam

Após cada venda, o valor (menos a comissão da plataforma) fica disponível na tua conta Stripe. O saque para o banco brasileiro acontece automaticamente em **7 dias úteis**.

## Taxa de câmbio

O Stripe converte automaticamente USD → BRL na taxa do dia da transferência. Não há taxas extras além da taxa normal do Stripe (2.9% + $0.30 por transação).

## Limites e impostos

Rendimentos de plataformas digitais internacionais devem ser declarados no Imposto de Renda. Consulta um contador para mais informações sobre a tributação específica para a tua situação.
    `,
  },
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = POSTS[params.slug];
  if (!post) return { title: 'Post não encontrado' };
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.seoKeywords,
    openGraph: { title: post.title, description: post.excerpt, type: 'article', publishedTime: post.date },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt },
  };
}

export function generateStaticParams() {
  return Object.keys(POSTS).map(slug => ({ slug }));
}

function renderContent(md: string) {
  const lines = md.trim().split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '28px 0 12px' }}>{line.slice(3)}</h2>);
    } else if (line.startsWith('- ')) {
      elements.push(<li key={key++} style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginLeft: 20 }}>{line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}</li>);
    } else if (line.startsWith('| ')) {
      // skip table lines for simplicity
    } else if (line.trim() === '') {
      elements.push(<div key={key++} style={{ height: 12 }} />);
    } else {
      const text = line.replace(/\*\*(.*?)\*\*/g, (_, m) => m).replace(/\*(.*?)\*/g, (_, m) => m);
      elements.push(<p key={key++} style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.75, margin: '0 0 8px' }}>{text}</p>);
    }
  }
  return elements;
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = POSTS[params.slug];
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    keywords: post.seoKeywords,
    author: { '@type': 'Organization', name: 'TrustBank' },
    publisher: { '@type': 'Organization', name: 'TrustBank' },
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${params.slug}`,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />

      {/* Hero */}
      <div style={{ height: 240, background: post.gradient, display: 'flex', alignItems: 'flex-end', padding: '0 0 32px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px', width: '100%' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>{post.category}</span>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.3 }}>{post.title}</h1>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 80px', flex: 1, width: '100%' }}>
        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>
            📅 {new Date(post.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>· ⏱️ {post.readTime}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {post.tags.map(t => (
              <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* SEO bar */}
        <div className="seo-meta-bar" style={{ marginBottom: 28 }}>
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>🔍 SEO otimizado</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Keywords: <em>{post.seoKeywords}</em></span>
        </div>

        {/* Content */}
        <div style={{ lineHeight: 1.75 }}>
          {renderContent(post.content)}
        </div>

        {/* Back + CTA */}
        <div style={{ marginTop: 48, display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 28 }}>
          <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            ← Voltar ao Blog
          </Link>
          <Link href="/auth" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'var(--gold)', color: '#000', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 800 }}>
            Criar Conta Grátis →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
