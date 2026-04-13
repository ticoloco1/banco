# TrustBank — Mini Sites & Stripe Paywall

## Configuração rápida

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Edita o ficheiro `.env.local` com as tuas credenciais:
- `NEXT_PUBLIC_SUPABASE_URL` — URL do teu projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Chave anon do Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (servidor apenas)
- `STRIPE_SECRET_KEY` — Chave secreta do Stripe (sk_live_...)
- `STRIPE_WEBHOOK_SECRET` — Webhook secret do Stripe (whsec_...)
- `NEXT_PUBLIC_SITE_URL` — URL do teu site (ex: https://trustbank.vercel.app)
- `R2_*` — Credenciais do Cloudflare R2 (para ficheiros/media)

### 3. Correr em desenvolvimento
```bash
npm run dev
```

### 4. Deploy no Vercel
```bash
npx vercel --prod
```

Ou liga o repositório ao Vercel e faz deploy automático.

## Estrutura do projecto

```
src/
├── app/
│   ├── page.tsx              # Homepage
│   ├── planos/page.tsx       # Planos & Preços (só Pro)
│   ├── slugs/page.tsx        # Slug Marketplace com preços
│   ├── explore/feed/page.tsx # Feed global com countdown 7 dias
│   ├── blog/page.tsx         # Blog com SEO
│   ├── blog/[slug]/page.tsx  # Artigo individual com SEO
│   ├── cv/page.tsx           # Diretório de CVs
│   ├── jobs/page.tsx         # Vagas de emprego
│   ├── s/[slug]/             # Mini sites públicos (30 temas)
│   ├── auth/page.tsx         # Login com Google
│   ├── dashboard/page.tsx    # Dashboard
│   ├── editor/page.tsx       # Editor
│   └── api/                  # API routes
│       ├── checkout/route.ts           # Stripe checkout
│       ├── public/global-feed/route.ts # Feed API
│       └── public/slug-market-*/      # Slugs API
├── components/
│   └── layout/
│       ├── Header.tsx        # Navbar com auth, cart, mobile menu
│       ├── Footer.tsx        # Footer com links
│       ├── CartDrawer.tsx    # Carrinho lateral com Stripe checkout
│       └── Providers.tsx     # Client providers wrapper
├── hooks/useAuth.ts          # Hook de autenticação Supabase
├── store/cart.ts             # Zustand cart store
└── lib/
    ├── supabase.ts           # Supabase client (browser)
    ├── supabaseServer.ts     # Supabase client (servidor)
    ├── platformPricing.ts    # Preços (Pro, slugs, feed...)
    └── getAssetUrl.ts        # Helper para URLs de media (R2/Supabase)
```

## Funcionalidades

- ✅ Mini site público com 30 temas (midnight, ocean, neon, forest...)
- ✅ Paywall de vídeos YouTube + upload direto + Vimeo
- ✅ CV protegido com unlock via Stripe ($20 USD split 50/50)
- ✅ Feed com fotos (3 em grid), embed vídeo e countdown 7 dias
- ✅ Slug marketplace com tabela de preços ($5.000 para 1 char)
- ✅ Blog com 6 artigos SEO-optimizados (metadata, JSON-LD, sitemap)
- ✅ Vagas de emprego
- ✅ Diretório de CVs com filtros
- ✅ Carrinho + Stripe Checkout integrado
- ✅ Login Google via Supabase Auth
- ✅ Header responsivo com mobile menu
- ✅ Sitemap automático e robots.txt
# Deployed: Sun Apr 12 23:59:47 UTC 2026
