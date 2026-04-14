/**
 * Normaliza slug: apenas letras minúsculas, números e hífen.
 * Usado no editor, marketplace e validação.
 */
export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Tamanho mínimo para slug (ex.: 1 caractere para premium, 3 para padrão) */
export const SLUG_MIN_LENGTH = 1;

/** Verifica se o slug é válido após normalização */
export function isValidSlug(slug: string): boolean {
  const n = normalizeSlug(slug);
  return n.length >= SLUG_MIN_LENGTH && !/^-/.test(n) && !/-$/.test(n);
}
