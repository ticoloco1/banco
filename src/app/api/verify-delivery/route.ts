import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

export const dynamic = 'force-dynamic';

function getDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function getSessionUser(req: NextRequest) {
  const db = getDb();
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  const { data } = await db.auth.getUser(token);
  return data.user || null;
}

function attestationSecret(): string | null {
  const s = (process.env.NFT_DELIVERY_ATTESTATION_SECRET || '').trim();
  return s.length >= 16 ? s : null;
}

function signPayload(canonicalJson: string, secret: string): string {
  return createHmac('sha256', secret).update(canonicalJson, 'utf8').digest('hex');
}

/** Documentação rápida (marca usa POST com sessão). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    method: 'POST',
    headers: { Authorization: 'Bearer <access_token>' },
    body: { leadId: 'uuid do lead na campanha' },
    env: ['NFT_DELIVERY_ATTESTATION_SECRET (mín. 16 chars, partilhado com a marca para verificar a assinatura)'],
    note: 'O payload não inclui a chave privada do utilizador nem o endereço em claro.',
  });
}

/**
 * Marca autenticada: recebe prova HMAC de que o lead foi entregue e (se aplicável) visualizado no mini-site.
 */
export async function POST(req: NextRequest) {
  const secret = attestationSecret();
  if (!secret) {
    return NextResponse.json(
      { error: 'server_misconfigured', hint: 'Defina NFT_DELIVERY_ATTESTATION_SECRET' },
      { status: 500 },
    );
  }

  const user = await getSessionUser(req);
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { leadId?: string };
  const leadId = String(body.leadId || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(leadId)) {
    return NextResponse.json({ error: 'invalid_leadId' }, { status: 400 });
  }

  const db = getDb();
  const { data: lead } = await db
    .from('campaign_leads' as any)
    .select('id, campaign_id, user_id, delivery_status, delivered_at, nft_viewed_at, delivery_tx_hash')
    .eq('id', leadId)
    .maybeSingle();
  if (!lead) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { data: campaign } = await db
    .from('marketing_campaigns' as any)
    .select('id, brand_id, title')
    .eq('id', (lead as { campaign_id: string }).campaign_id)
    .maybeSingle();
  const camp = campaign as { brand_id?: string; title?: string } | null;
  if (!camp || camp.brand_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const L = lead as {
    id: string;
    delivery_status: string;
    delivered_at: string | null;
    nft_viewed_at: string | null;
    delivery_tx_hash: string | null;
  };

  const payloadObj = {
    v: 1,
    leadId: L.id,
    campaignId: (lead as { campaign_id: string }).campaign_id,
    campaignTitle: String(camp.title || ''),
    deliveryStatus: L.delivery_status,
    deliveredAt: L.delivered_at,
    viewedOnMiniSiteAt: L.nft_viewed_at,
    deliveryTxOrRef: L.delivery_tx_hash ? 'present' : 'absent',
  };

  const canonicalJson = JSON.stringify(payloadObj);
  const signature = signPayload(canonicalJson, secret);

  return NextResponse.json({
    algorithm: 'HMAC-SHA256',
    payload: payloadObj,
    canonicalJson,
    signature,
    verify: 'A marca recalcula HMAC-SHA256(NFT_DELIVERY_ATTESTATION_SECRET, canonicalJson) e compara com signature (comparação constante no tempo).',
  });
}
