/**
 * Preços em USD — site e checkout alinhados aos EUA (Stripe `currency: 'usd'`).
 * Pro único = `proMonthly` (entrada barata). IA no editor: BYOK (chave própria); sem add-on pago na subscrição.
 * Legado: `proIaAddon*` a 0 — checkout usa só `pro`. `pro_ia` em subs antigas ainda reconhecido.
 * Alinhar `platform_plans` no Supabase com `supabase-plan-pro-pricing.sql`.
 */
export const PLATFORM_USD = {
  /** Pro — alinhar `supabase-plan-pro-pricing.sql` na BD. */
  proMonthly: 29.9,
  /** Anual (~10× mensal). */
  proYearly: 299.9,
  /** Add-on IA na subscrição: desligado (IA com API própria / créditos opcionais). */
  proIaAddonMonthly: 0,
  proIaAddonYearly: 0,
  /** % de referência do paywall de vídeo para criador no plano Pro (Free usa 60%). */
  paywallVideoCreatorPercent: 80,
  /** Sugestão inicial no editor; o criador define o preço do CV. */
  cvUnlockDefault: 20,
  /** Preço sugerido por vídeo com paywall (ativar paywall não tem taxa da plataforma). */
  videoPaywallDefault: 6.99,
  mysticTarotDefault: 6.99,
  mysticLotteryPremiumDefault: 3.99,
  /**
   * Boost no diretório: cada unidade do slider = `boostUsdPerSliderUnit` USD e soma `boostPositionsPerSliderUnit` posições.
   * Ex.: $0,50 → +2 posições; slider máx × 0,5 = até $1000.
   */
  boostUsdPerSliderUnit: 0.5,
  boostPositionsPerSliderUnit: 2,
  boostSliderMax: 2000,
  boostHighlightDays: 7,
  boostDropPositionsAfterHighlight: 150,
  /** A partir do dia 8, opcional: US$/dia para manter destaque nas primeiras posições (comunicar na UI; checkout dedicado pode vir depois). */
  boostTopExtensionUsdPerDay: 50,
  cvDirectoryMonthly: 199,
  cvDirectoryYearly: 1990,
  cvDirectoryExtraCv: 10,
  classifiedListingMonthly: 10,
  /** Destaque no diretório /imoveis — 30 dias, cor escolhida pelo anunciante (Stripe USD). */
  propertyDirectoryHighlight30d: 35,
  /** Post fixado no feed (365 dias) — alinhar UI FeedSection. */
  feedPinPost: 10,
  slugRenewal: 7,
  /** Destaque no diretório de slugs (topo da categoria / busca) — 30 dias. */
  slugHighlight30d: 50,
  /** Add-on mensal: vídeo em loop no perfil — gravação na câmara até ~2 min (grátis ~20 s). */
  profileLoopVideoExtendedMonthly: 5,
  /** Anual (~10× mensal). */
  profileLoopVideoExtendedYearly: 50,

  /**
   * Feed no diretório global (Explorar): visibilidade / publicação.
   * Freemium: “post único” / janela 7 dias; “feed fixado 1 ano” = passe 365 dias.
   */
  feedDirectory7d: 3,
  feedDirectory365d: 20,

  /** NFT Factory: taxa base para gerar arte/metadata com IA (ajusta conforme custo API). */
  nftAiCampaignCreateUsd: 9.99,
  /** Por NFT entregue ou por lead qualificado (airdrop / webhook) — alinha com Stripe min. */
  nftPerMintOrLeadUsd: 1.35,
} as const;

/** Máximo de links no plano grátis (sem subscrição Pro activa). */
export const FREEMIUM_MAX_LINKS = 5;

/** Temas incluídos no free tier (resto pede Pro). */
export const FREEMIUM_THEME_IDS = ['midnight', 'ivory', 'ocean', 'neon', 'forest', 'rose', 'aurora'] as const;

export const STRIPE_MIN_CHARGE_USD = 0.5;

/** Compat: cálculo de posições a partir do valor pago (USD). */
export function boostPositionsFromAmountUsd(amountUsd: number): number {
  const u = PLATFORM_USD.boostUsdPerSliderUnit;
  const p = PLATFORM_USD.boostPositionsPerSliderUnit;
  return Math.max(p, Math.floor(amountUsd / u) * p);
}
