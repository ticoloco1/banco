const MAX_SLUG_LEN = 48;

/** Sufixo estável 00–99 para o mesmo utilizador + base (pré-visualização e verificação de disponibilidade). */
function stableSuffix(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (h % 100).toString().padStart(2, '0');
}

/** Slug freemium: mínimo de 11 caracteres alfanuméricos (sem contar hífen). */
export function freemiumSlugEligible(rawClean: string): boolean {
  const key = rawClean.toLowerCase().replace(/[^a-z0-9]/g, '');
  return key.length >= 11;
}

/**
 * Slug grátis: força padrão `base-XX` (hífen + 2 números) para proteger slugs premium.
 * Também exige base com 11+ chars alfanuméricos.
 */
export function deriveFreemiumSlug(rawClean: string, userId: string): string {
  let s = rawClean
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!s || s.length < 2) {
    s = 'site';
  }

  if (!freemiumSlugEligible(s)) return '';

  const nn = stableSuffix(`${userId}:${s}`);
  return `${s}-${nn}`.slice(0, MAX_SLUG_LEN);
}
