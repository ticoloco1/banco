import { getReservedSlugSet } from './slugReservedLists';
import { isWorldFirstNameSlug } from './worldFirstNames';
import { PLATFORM_USD } from './platformPricing';

/**
 * Tarifa especial nome (lista mundial): só entra se o preço **só por nº de letras**
 * for **menor** que este valor. Hoje os tiers 1–7 são todos ≥ $2000, logo prevalece sempre o preço por letras.
 */
export const SLUG_WORLD_NAME_TIER_USD = 500;

/** 2.º slug e seguintes: registo US$ (com plano / mini-site já existente). */
export const SLUG_EXTRA_REGISTRATION_USD = PLATFORM_USD.slugRenewal;

/** Renovação anual por slug (carrinho). */
export const SLUG_RENEWAL_ANNUAL_USD = PLATFORM_USD.slugRenewal;

export function normalizeSlugKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Slug só pode ser registado pelo admin (país, cidade, termo bancário, etc.). */
export function isSlugReservedAdminOnly(slug: string): boolean {
  const key = normalizeSlugKey(slug);
  if (!key) return true;
  return getReservedSlugSet().has(key);
}

/**
 * Preço só pelo nº de caracteres alfanuméricos (sem hífen).
 * 1–7: ultra-curtos (legado). 8–15: tabela pública. 16+: 0 (só pode aplicar taxa de slug extra no registo).
 */
export function slugLengthTierByLenOnly(len: number): number {
  if (len <= 0) return 0;
  if (len <= 1) return 5000;
  if (len === 2) return 4500;
  if (len === 3) return 4000;
  if (len === 4) return 3500;
  if (len === 5) return 3000;
  if (len === 6) return 2500;
  if (len === 7) return 2000;
  if (len === 8) return 1500;
  if (len === 9) return 1000;
  if (len === 10) return 800;
  if (len === 11) return 650;
  if (len === 12) return 500;
  if (len === 13) return 450;
  if (len === 14) return 300;
  if (len === 15) return 160;
  return 0;
}

/**
 * Preço por comprimento (1–7): **sempre** respeita a tabela por letras se esse valor ≥ $500.
 * Nome na lista mundial: só ajusta para $500 se o tier por letras for menor que $500 (hoje não ocorre em 1–7).
 * 16+ não reservados: 0 nesta função; 2.º slug+ = SLUG_EXTRA no `slugRegistrationDueUsd`.
 */
export function slugLengthTierUsd(slug: string): number {
  const key = normalizeSlugKey(slug);
  const len = key.length;
  if (len <= 0) return 0;
  const byLen = slugLengthTierByLenOnly(len);
  if (len <= 7 && isWorldFirstNameSlug(key) && byLen < SLUG_WORLD_NAME_TIER_USD) {
    return SLUG_WORLD_NAME_TIER_USD;
  }
  return byLen;
}

export { isWorldFirstNameSlug } from './worldFirstNames';

/**
 * Valor a cobrar no registo (não inclui reservados — tratar à parte).
 * @param existingSlugRegistrationCount número de linhas em slug_registrations do utilizador
 */
export function slugRegistrationDueUsd(slug: string, existingSlugRegistrationCount: number): number {
  if (isSlugReservedAdminOnly(slug)) return 0;
  const tier = slugLengthTierUsd(slug);
  if (tier > 0) return tier;
  return existingSlugRegistrationCount > 0 ? SLUG_EXTRA_REGISTRATION_USD : 0;
}

const EXPENSIVE_SLUG_KEYWORDS = [
  'bank', 'banks', 'credit', 'credits', 'loan', 'loans', 'broker', 'brokers',
  'invest', 'investor', 'investors', 'crypto', 'bitcoin', 'btc', 'eth', 'nft',
  'casino', 'bet', 'bets', 'betting', 'casino', 'insurance', 'mortgage',
  'ceo', 'ai', 'web3', 'fintech', 'payment', 'payments',
];

/**
 * Marketplace premium heuristic:
 * - <= 3 chars OR
 * - contains expensive keyword
 */
export function isPremiumMarketplaceSlug(slug: string): boolean {
  const key = normalizeSlugKey(slug);
  if (!key) return false;
  if (key.length <= 3) return true;
  return EXPENSIVE_SLUG_KEYWORDS.some((kw) => key.includes(kw));
}

/** Compat: nome antigo usado no projeto. */
export function slugPrice(slug: string, existingSlugRegistrationCount = 0): number {
  return slugRegistrationDueUsd(slug, existingSlugRegistrationCount);
}
