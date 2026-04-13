/**
 * NFT Factory Marketing — metadata para campanhas e integração via webhook.
 * A mintagem on-chain real (Polygon) deve correr num worker/serviço que consome o webhook ou fila.
 */

export type MarketingBrandPayload = {
  campaignName: string;
  description: string;
  aiGeneratedVisual?: string | null;
  discountValue?: string | number | null;
  endDate?: string | null;
};

export type MarketingNFTMetadata = {
  name: string;
  description: string;
  image?: string | null;
  attributes: { trait_type: string; value: string | number }[];
};

export function buildMarketingNFTMetadata(brandData: MarketingBrandPayload): MarketingNFTMetadata {
  return {
    name: brandData.campaignName,
    description: brandData.description,
    image: brandData.aiGeneratedVisual || undefined,
    attributes: [
      { trait_type: 'Discount', value: brandData.discountValue ?? '—' },
      { trait_type: 'AccessLevel', value: 'VIP_VAULT' },
      { trait_type: 'Expiration', value: brandData.endDate ?? 'TBD' },
    ],
  };
}

export type WebhookMarketingLeadPayload = {
  event: 'marketing_lead_queued';
  leadId: string;
  siteId: string;
  siteSlug: string;
  campaignId: string | null;
  email: string;
  wallet: string;
  brandName: string | null;
  nftMetadata: MarketingNFTMetadata;
  /** Rede alvo sugerida para airdrop em massa */
  chain: 'polygon';
};

export type WebhookNftDispatchResultPayload = {
  event: 'nft_dispatch_result';
  leadId: string;
  campaignId: string | null;
  status: 'sent' | 'failed';
  txHash?: string | null;
  error?: string | null;
};

export async function postNftFactoryWebhook(
  url: string,
  secret: string | undefined,
  body: WebhookMarketingLeadPayload,
): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret) headers['X-TrustBank-Secret'] = secret;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 12_000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: ac.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: t.slice(0, 500) };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : 'webhook_failed',
    };
  }
}

/**
 * Mint em Polygon — placeholder. Implementação real: contrato + relayer + fila.
 */
export async function mintMarketingNFTToPolygon(
  _targetWallets: string[],
  _metadata: MarketingNFTMetadata,
): Promise<{ queued: boolean; detail: string }> {
  return {
    queued: false,
    detail: 'Use NFT_FACTORY_WEBHOOK_URL + worker; on-chain mint not configured in this app.',
  };
}

/** Orquestra metadata + mint em lote (Polygon) — hoje retorna stub; produção usa webhook/worker. */
export async function mintMarketingNFT(brandData: MarketingBrandPayload & { targetWallets?: string[] }) {
  const metadata = buildMarketingNFTMetadata(brandData);
  const wallets = Array.isArray(brandData.targetWallets) ? brandData.targetWallets.filter(Boolean) : [];
  const mint = wallets.length ? await mintMarketingNFTToPolygon(wallets, metadata) : null;
  return { metadata, mint };
}
