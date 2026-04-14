// Stripe product and price IDs — created via Stripe dashboard / API
// All prices are one-time unless noted

export const STRIPE_PRICES = {
  // Subdomain registrations (one-time)
  subdomain_1_letter: {
    product_id: "prod_U7lEDgfMa1IVDv",
    price_id: "price_1T9Vhp6Q9SupCEmjo4XeGFR6",
    amount: 2000_00, // $2,000
    label: "1 Letter",
  },
  subdomain_2_letters: {
    product_id: "prod_U7lF0FBYzAc33f",
    price_id: "price_1T9VjA6Q9SupCEmjpqyItFk4",
    amount: 1500_00, // $1,500
    label: "2 Letters",
  },
  subdomain_3_letters: {
    product_id: "prod_U7lGHb9rEotVLS",
    price_id: "price_1T9Vjb6Q9SupCEmj7t0F1eOB",
    amount: 1000_00, // $1,000
    label: "3 Letters",
  },
  subdomain_4_letters: {
    product_id: "prod_U7lGgDZmLe1MoC",
    price_id: "price_1T9Vk06Q9SupCEmjtpk16uCT",
    amount: 500_00, // $500
    label: "4 Letters",
  },

  // Boosts (one-time)
  boost_zap: {
    product_id: "prod_U7lGeGsFAHGOK9",
    price_id: "price_1T9VkA6Q9SupCEmjJJPwXJkn",
    amount: 50, // $0.50
    label: "Zap",
  },
  boost_directory: {
    product_id: "prod_U7lGhoYm13hhq8",
    price_id: "price_1T9VkB6Q9SupCEmjNPBBVshX",
    amount: 150, // $1.50
    label: "Directory Highlight (24h)",
  },
  boost_homepage: {
    product_id: "prod_U7lGtHtfpUsHDN",
    price_id: "price_1T9VkB6Q9SupCEmjgAn0VrKY",
    amount: 100000, // $1,000
    label: "Homepage Top (7 days)",
  },
  // Slug Marketplace: 1 posição $1.50, home categoria 7d $1000, manutenção $450/dia
  boost_slug_1_position: {
    product_id: "prod_U7lGhoYm13hhq8",
    price_id: "price_1T9VkB6Q9SupCEmjNPBBVshX",
    amount: 150, // $1.50
    label: "Subir 1 posição (24h)",
  },
  boost_slug_category_home_7d: {
    product_id: "prod_SLUG_HOME7D",
    price_id: "price_SLUG_HOME7D",
    amount: 100000, // $1,000
    label: "Home da categoria (7 dias)",
  },
  boost_slug_maintenance_daily: {
    product_id: "prod_SLUG_MAINT",
    price_id: "price_SLUG_MAINT",
    amount: 45000, // $450
    label: "Manutenção home ($450/dia)",
  },

  // CV Unlock (one-time)
  cv_unlock: {
    product_id: "prod_U7lGpcXmKbePqa",
    price_id: "price_1T9VkD6Q9SupCEmjjTxVC0kb",
    amount: 2000, // $20
    label: "CV Unlock",
  },

  // Espaço extra: US$ 1,00 por espaço por mês. Crie no Stripe: Products → Add product, preço US$ 1 one-time; copie price_id e product_id para cá.
  extra_property_space: {
    product_id: "prod_EXTRA_PROPERTY",
    price_id: "price_EXTRA_PROPERTY",
    amount: 100, // $1.00
    label: "1 espaço extra (imóveis) — 30 dias",
  },
  extra_classified_space: {
    product_id: "prod_EXTRA_CLASSIFIED",
    price_id: "price_EXTRA_CLASSIFIED",
    amount: 100, // $1.00
    label: "1 espaço extra (classificados) — 30 dias",
  },

  // IA: pacotes de interações (cobrar na hora)
  ai_pack_1000: {
    product_id: "prod_AI_1000",
    price_id: "price_AI_1000",
    amount: 500, // $5.00
    label: "1.000 interações IA",
    interactions: 1000,
  },
  ai_pack_10000: {
    product_id: "prod_AI_10000",
    price_id: "price_AI_10000",
    amount: 5000, // $50.00
    label: "10.000 interações IA",
    interactions: 10000,
  },

  // Corporate Subscription (monthly recurring)
  corporate_subscription: {
    product_id: "prod_U7lGVir5fqF2Z6",
    price_id: "price_1T9VkE6Q9SupCEmjC0qET8Fj",
    amount: 39900, // $399/month
    label: "Corporate Plan",
    recurring: true,
  },
} as const;

/** Helper to get subdomain price by slug length */
export function getSubdomainPriceByLength(length: number) {
  if (length === 1) return STRIPE_PRICES.subdomain_1_letter;
  if (length === 2) return STRIPE_PRICES.subdomain_2_letters;
  if (length === 3) return STRIPE_PRICES.subdomain_3_letters;
  if (length === 4) return STRIPE_PRICES.subdomain_4_letters;
  return null; // 5+ letters are free (only $12/year registration)
}

/** Default prices by slug length (for admin reference) */
export const SLUG_PRICES_BY_LENGTH: Record<number, number> = {
  1: 2000,
  2: 1500,
  3: 1000,
  4: 500,
  5: 250,
  6: 100,
  7: 50,
};

/** Annual registration/renewal fee for all slugs */
export const SLUG_ANNUAL_FEE = 12;

/** Platform fee on slug P2P sales */
export const SLUG_PLATFORM_FEE_PCT = 5;
