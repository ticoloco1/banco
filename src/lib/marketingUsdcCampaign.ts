import { getAddress, isAddress } from 'viem';
import { getServiceDb, treasuryAddress, usdcUnitsFromUsd, verifyUsdcTransferToTreasury } from '@/lib/videoUsdcPaywall';

export function marketingDb() {
  return getServiceDb();
}

export function parseCampaignPayerWallet(raw: string): string {
  const w = String(raw || '').trim();
  if (!isAddress(w)) throw new Error('Invalid wallet');
  return getAddress(w).toLowerCase();
}

export async function confirmCampaignUsdcPayment(params: {
  intentId: string;
  txHash: `0x${string}`;
  payerWallet: string;
}) {
  const db = marketingDb();
  const { data: row } = await db
    .from('marketing_campaign_usdc_intents' as any)
    .select('id,campaign_id,brand_id,payer_wallet,amount_units,amount_usd,status')
    .eq('id', params.intentId)
    .maybeSingle();
  if (!row) throw new Error('Intent not found');
  const i = row as any;
  if (String(i.payer_wallet).toLowerCase() !== String(params.payerWallet).toLowerCase()) {
    throw new Error('Wallet mismatch');
  }
  if (i.status === 'paid') return { alreadyPaid: true, campaignId: i.campaign_id as string };

  const ok = await verifyUsdcTransferToTreasury({
    txHash: params.txHash,
    from: String(params.payerWallet),
    expectedAmount: BigInt(String(i.amount_units)),
  });
  if (!ok) throw new Error('USDC transfer not confirmed');

  await db
    .from('marketing_campaign_usdc_intents' as any)
    .update({ status: 'paid', tx_hash: params.txHash.toLowerCase(), paid_at: new Date().toISOString() })
    .eq('id', params.intentId);

  const { data: c } = await db
    .from('marketing_campaigns' as any)
    .select('total_budget')
    .eq('id', i.campaign_id)
    .maybeSingle();
  const cur = Number((c as any)?.total_budget || 0);
  await db
    .from('marketing_campaigns' as any)
    .update({ total_budget: Math.max(0, cur) + Number(i.amount_usd || 0), updated_at: new Date().toISOString() })
    .eq('id', i.campaign_id);
  return { ok: true, campaignId: i.campaign_id as string };
}

export function campaignTreasuryWallet() {
  return treasuryAddress().toLowerCase();
}

export function campaignAmountUnits(amountUsd: number) {
  return usdcUnitsFromUsd(amountUsd).toString();
}
