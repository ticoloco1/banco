import type { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getMiniSiteStripeForUser, releaseMiniSiteSlugFromSeller } from '@/lib/stripeConnectSite';
import { PLATFORM_USD, boostPositionsFromAmountUsd } from '@/lib/platformPricing';
import { IA_TOPUP_MIN_FACE_USD, iaTopupChargeUsd } from '@/lib/aiUsdBudget';
import { marketingSetupFeeUsd } from '@/lib/pricing_config';
import {
  isValidEvmAddress,
  mintTrustBankSlugCertificateIfConfigured,
} from '@/lib/slugNftThirdwebMint';
import { getUserPolygonWallet } from '@/lib/walletSlugGate';

/** Contexto opcional vindo do checkout (ex.: carteira Polygon para NFT do slug). */
export type FulfillmentContext = {
  polygonWallet?: string | null;
};

async function resolvePolygonForSlugNft(
  db: SupabaseClient,
  userId: string,
  ctx: FulfillmentContext | undefined,
): Promise<string | null> {
  const w = ctx?.polygonWallet?.trim();
  if (w && isValidEvmAddress(w)) return w.toLowerCase();
  return await getUserPolygonWallet(db, userId);
}

async function maybeMintSlugCertificateNft(
  db: SupabaseClient,
  ctx: FulfillmentContext | undefined,
  paymentRef: string,
  userId: string,
  slug: string,
) {
  const w = ctx?.polygonWallet?.trim();
  if (!w || !isValidEvmAddress(w)) return;
  const r = await mintTrustBankSlugCertificateIfConfigured(db, {
    slug,
    recipient: w,
    userId,
    paymentRef,
  });
  if (!r.ok && r.reason !== 'mint_not_configured') {
    console.warn('[Fulfill] slug NFT:', r);
  }
}

/**
 * Revenue splits (USD) configurados por plano do criador.
 * - Pro ativo: vídeo 80/20, CV 50/50.
 * - Free/freemium: vídeo 60/40, CV no mini-site 100% criador.
 */
export const PAYMENT_SPLITS = {
  video: { creator: 0.8, platform: 0.2 },
  cv: { creator: 0.5, platform: 0.5 },
  cv_directory: { creator: 0, platform: 1 },
  slug: { creator: 0.9, platform: 0.1 },
  subscription: { creator: 0, platform: 1 },
  /** Jackpot pool discontinued — full boost amount treated as platform revenue in fulfillment. */
  boost: { creator: 0, platform: 1 },
  credits: { creator: 0, platform: 1 },
  classified: { creator: 0, platform: 1 },
  classified_property_highlight: { creator: 0, platform: 1 },
  brand_ad: { creator: 0.8, platform: 0.2 },
  directory_company: { creator: 0, platform: 1 },
  profile_loop_video: { creator: 0, platform: 1 },
  feed_subscription: { creator: 0, platform: 1 },
  marketing_campaign_setup: { creator: 0, platform: 1 },
} as const;

export type FulfillmentKind =
  | 'video'
  | 'cv'
  | 'cv_directory'
  | 'boost'
  | 'credits'
  | 'subscription'
  | 'slug_bid'
  | 'slug'
  | 'slug_renewal'
  | 'slug_highlight'
  | 'slug_market'
  | 'slug_auction_settle'
  | 'classified'
  | 'classified_property_highlight'
  | 'brand_ad'
  | 'directory_company'
  | 'ai_budget_topup'
  | 'mystic_service'
  | 'profile_loop_video'
  | 'feed_subscription'
  | 'marketing_campaign_setup';

export type FulfillmentLine = {
  kind: FulfillmentKind;
  userId: string;
  amountUsd: number;
  itemId?: string | null;
  planId?: string;
  billingPeriod?: string;
  targetType?: string;
  /** Valor útil em USD creditado em ai_paid_usd_balance (top-up IA). */
  faceValueUsd?: number;
  mysticService?: 'tarot' | 'lottery_premium';
  /** Passe de feed no diretório (7 ou 365 dias). */
  feedPassDays?: 7 | 365;
};

function getStripeAdmin(): Stripe | null {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k) return null;
  return new Stripe(k);
}

async function transferCreatorUsd(
  stripe: Stripe,
  destinationAccountId: string,
  amountUsd: number,
  metadata: Record<string, string>,
) {
  const cents = Math.round(amountUsd * 100);
  if (cents < 1) return;
  await stripe.transfers.create({
    amount: cents,
    currency: 'usd',
    destination: destinationAccountId,
    metadata,
  });
}

async function getSiteForVideo(db: SupabaseClient, videoId: string) {
  const { data: video } = await db.from('mini_site_videos').select('site_id').eq('id', videoId).maybeSingle();
  if (!video) return null;
  const { data: site } = await db
    .from('mini_sites')
    .select('id, stripe_connect_account_id, stripe_connect_charges_enabled')
    .eq('id', (video as { site_id: string }).site_id)
    .maybeSingle();
  return site as { id: string; stripe_connect_account_id: string | null; stripe_connect_charges_enabled: boolean | null } | null;
}

function priceApproxEqual(paid: number, expected: number) {
  return Math.abs(paid - expected) < 0.05;
}

async function creatorHasActiveProSubscription(db: SupabaseClient, creatorUserId: string | null | undefined): Promise<boolean> {
  if (!creatorUserId) return false;
  const { data } = await db
    .from('subscriptions' as any)
    .select('status, expires_at')
    .eq('user_id', creatorUserId)
    .maybeSingle();
  if (!data) return false;
  const row = data as { status?: string; expires_at?: string | null };
  if (row.status === 'cancelled') return false;
  if (!row.expires_at) return false;
  return new Date(row.expires_at) > new Date();
}

async function getMiniSiteOwnerUserId(db: SupabaseClient, siteId: string): Promise<string | null> {
  const { data: site } = await db.from('mini_sites').select('user_id').eq('id', siteId).maybeSingle();
  return (site as { user_id?: string } | null)?.user_id ?? null;
}


/**
 * Apply one paid line (Stripe webhook or tests).
 */
export async function fulfillLine(
  db: SupabaseClient,
  line: FulfillmentLine,
  paymentRef: string,
  ctx?: FulfillmentContext,
): Promise<void> {
  const { kind, userId, amountUsd, itemId, planId, billingPeriod, targetType, faceValueUsd, mysticService } = line;

  switch (kind) {
    case 'video': {
      if (!itemId) return;
      const siteRow = await getSiteForVideo(db, itemId);
      const ownerId = siteRow?.id ? await getMiniSiteOwnerUserId(db, siteRow.id) : null;
      const pro = await creatorHasActiveProSubscription(db, ownerId);
      const creatorPct = pro ? PAYMENT_SPLITS.video.creator : 0.6;
      const creatorShare = amountUsd * creatorPct;
      await db.from('paywall_unlocks' as any).upsert(
        {
          user_id: userId,
          video_id: itemId,
          amount_paid: creatorShare,
          source: 'video',
          expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        },
        { onConflict: 'user_id,video_id' },
      );
      const stripe = getStripeAdmin();
      if (stripe && siteRow?.stripe_connect_account_id && siteRow?.stripe_connect_charges_enabled) {
        try {
          await transferCreatorUsd(stripe, siteRow.stripe_connect_account_id, creatorShare, {
            kind: 'video_paywall',
            video_id: itemId,
            ref: paymentRef.slice(0, 80),
          });
        } catch (err) {
          console.error('[Fulfill] Stripe transfer (video)', err);
        }
      }
      break;
    }
    case 'cv': {
      if (!itemId) return;
      const ownerId = await getMiniSiteOwnerUserId(db, itemId);
      const pro = await creatorHasActiveProSubscription(db, ownerId);
      const creatorPct = pro ? PAYMENT_SPLITS.cv.creator : 0;
      const creatorShare = amountUsd * creatorPct;
      await db.from('cv_unlocks' as any).upsert(
        {
          unlocker_id: userId,
          site_id: itemId,
          amount_paid: creatorShare,
          source: 'direct',
        },
        { onConflict: 'unlocker_id,site_id' },
      );
      const { data: siteRow } = await db
        .from('mini_sites')
        .select('stripe_connect_account_id, stripe_connect_charges_enabled')
        .eq('id', itemId)
        .maybeSingle();
      const row = siteRow as { stripe_connect_account_id: string | null; stripe_connect_charges_enabled: boolean | null } | null;
      const stripe = getStripeAdmin();
      if (stripe && row?.stripe_connect_account_id && row?.stripe_connect_charges_enabled) {
        try {
          await transferCreatorUsd(stripe, row.stripe_connect_account_id, creatorShare, {
            kind: 'cv_unlock',
            site_id: itemId,
            ref: paymentRef.slice(0, 80),
          });
        } catch (err) {
          console.error('[Fulfill] Stripe transfer (cv)', err);
        }
      }
      break;
    }
    case 'cv_directory': {
      if (!itemId) return;
      await db.from('cv_unlocks' as any).insert({
        unlocker_id: userId,
        site_id: itemId,
        amount_paid: 0,
        source: 'directory',
      });
      break;
    }
    case 'boost': {
      if (!itemId) return;
      const positions = boostPositionsFromAmountUsd(amountUsd);

      const { data: boost } = await db.from('boosts' as any).insert({
        target_type: targetType || 'site',
        target_id: itemId,
        booster_id: userId,
        amount: amountUsd,
        positions_gained: positions,
      }).select('id').maybeSingle();

      if ((targetType || 'site') === 'site' && itemId) {
        await db.from('site_boosts' as any).insert({
          site_id: itemId,
          user_id: userId,
          amount: positions,
        });
      }

      if (targetType === 'classified') {
        const { data: listing } = await db.from('classified_listings').select('boost_score').eq('id', itemId).maybeSingle();
        if (listing !== null) {
          await db
            .from('classified_listings')
            .update({ boost_score: ((listing as any)?.boost_score || 0) + amountUsd })
            .eq('id', itemId);
        }
      }

      break;
    }
    case 'ai_budget_topup': {
      if (!itemId) return;
      const face = Number(faceValueUsd ?? 0);
      if (!Number.isFinite(face) || face < IA_TOPUP_MIN_FACE_USD || face > 50_000) {
        console.warn('[Fulfill] ai_budget_topup: invalid face', face);
        return;
      }
      if (!priceApproxEqual(amountUsd, iaTopupChargeUsd(face))) {
        console.warn('[Fulfill] ai_budget_topup: amount does not match pack price', amountUsd, face);
        return;
      }
      const { data: site } = await db
        .from('mini_sites')
        .select('user_id, ai_paid_usd_balance')
        .eq('id', itemId)
        .maybeSingle();
      const row = site as { user_id?: string; ai_paid_usd_balance?: number | null } | null;
      if (!row || row.user_id !== userId) {
        console.warn('[Fulfill] ai_budget_topup: site missing or not owner', itemId);
        return;
      }
      const cur = Number(row.ai_paid_usd_balance);
      const paid0 = Number.isFinite(cur) ? cur : 0;
      await db
        .from('mini_sites')
        .update({ ai_paid_usd_balance: paid0 + face })
        .eq('id', itemId)
        .eq('user_id', userId);
      break;
    }
    case 'credits': {
      const creditsBase = Math.floor(amountUsd * 100);
      const bonus =
        creditsBase >= 10000 ? Math.floor(creditsBase * 0.15) : creditsBase >= 5000 ? Math.floor(creditsBase * 0.1) : creditsBase >= 1000 ? Math.floor(creditsBase * 0.05) : 0;
      const total = creditsBase + bonus;

      const { data: wallet } = await db.from('credit_wallets' as any).select('balance, total_purchased').eq('user_id', userId).maybeSingle();

      await db.from('credit_wallets' as any).upsert(
        {
          user_id: userId,
          balance: ((wallet as any)?.balance || 0) + total,
          total_purchased: ((wallet as any)?.total_purchased || 0) + creditsBase,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

      await db.from('credit_transactions' as any).insert({
        user_id: userId,
        type: 'purchase',
        amount: total,
        usdc_amount: amountUsd,
        description: `${creditsBase} credits${bonus > 0 ? ` + ${bonus} bonus` : ''}`,
        ref_id: paymentRef,
      });
      break;
    }
    case 'subscription': {
      const billing = (billingPeriod || 'monthly') as string;
      const days = billing === 'yearly' || billing === 'annual' ? 365 : 30;
      const resolvedPlan = planId || 'pro';
      await db.from('subscriptions' as any).upsert(
        {
          user_id: userId,
          plan: resolvedPlan,
          status: 'active',
          expires_at: new Date(Date.now() + days * 24 * 3600 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      await db.from('mini_sites').update({ published: true }).eq('user_id', userId);
      /** Pro + IA (`pro_ia`) ou legado `studio`: crédito IA USD extra por ciclo. Env: IA_STUDIO_BONUS_USD_PER_CYCLE */
      if (resolvedPlan === 'studio' || resolvedPlan === 'pro_ia') {
        const bonus = parseFloat(process.env.IA_STUDIO_BONUS_USD_PER_CYCLE || '5');
        if (Number.isFinite(bonus) && bonus > 0) {
          const { data: sites } = await db
            .from('mini_sites' as any)
            .select('id, ai_free_usd_remaining')
            .eq('user_id', userId);
          for (const s of sites || []) {
            const cur = Number((s as { ai_free_usd_remaining?: unknown }).ai_free_usd_remaining);
            const base = Number.isFinite(cur) ? cur : 0;
            await db
              .from('mini_sites' as any)
              .update({ ai_free_usd_remaining: base + bonus })
              .eq('id', (s as { id: string }).id);
          }
        }
      }
      break;
    }
    case 'slug_bid': {
      /** Legado: lances passam por POST /api/slug-auction/bid (sem pagamento). Carrinho antigo: aplica lance uma vez. */
      if (!itemId) return;
      const { data: auction } = await db
        .from('slug_auctions' as any)
        .select('id, current_bid, min_bid, min_increment, bid_count, status, ends_at')
        .eq('id', itemId)
        .maybeSingle();
      if (auction && (auction as any).status === 'active' && new Date((auction as any).ends_at) > new Date()) {
        const current = Number((auction as any).current_bid || 0);
        const minBid = Number((auction as any).min_bid || 0);
        const increment = Number((auction as any).min_increment || 5);
        const required = Math.max(minBid, current + increment);
        const nextBid = Math.max(required, amountUsd);
        await db
          .from('slug_auctions' as any)
          .update({
            current_bid: nextBid,
            bid_count: Number((auction as any).bid_count || 0) + 1,
            winner_id: userId,
          })
          .eq('id', itemId);
      }
      break;
    }
    case 'slug_renewal': {
      if (!itemId) return;
      const { data: row } = await db
        .from('slug_registrations' as any)
        .select('user_id, expires_at')
        .eq('slug', itemId)
        .maybeSingle();
      if (!row || (row as any).user_id !== userId) {
        console.warn('[Fulfill] slug_renewal: not owner or missing', itemId);
        return;
      }
      const curMs = (row as any).expires_at ? new Date((row as any).expires_at).getTime() : Date.now();
      const base = Math.max(Date.now(), curMs);
      const newExp = new Date(base + 365 * 24 * 3600 * 1000).toISOString();
      await db
        .from('slug_registrations' as any)
        .update({ expires_at: newExp, status: 'active' })
        .eq('slug', itemId)
        .eq('user_id', userId);
      break;
    }
    case 'slug_highlight': {
      if (!itemId) return;
      if (!priceApproxEqual(amountUsd, PLATFORM_USD.slugHighlight30d)) {
        console.warn('[Fulfill] slug_highlight: price mismatch', amountUsd);
        return;
      }
      const [slugId, colorRaw] = String(itemId).split('::');
      const safeColor = /^([0-9a-f]{6})$/i.test(String(colorRaw || ''))
        ? `#${String(colorRaw).toLowerCase()}`
        : '#f59e0b';
      const { data: row } = await db
        .from('slug_registrations' as any)
        .select('id,user_id,for_sale')
        .eq('id', slugId)
        .maybeSingle();
      const reg = row as { id: string; user_id: string; for_sale?: boolean } | null;
      if (!reg || reg.user_id !== userId) {
        console.warn('[Fulfill] slug_highlight: not found or not owner');
        return;
      }
      const until = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
      await db
        .from('slug_registrations' as any)
        .update({
          highlight_until: until,
          highlight_color: safeColor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', slugId);
      break;
    }
    case 'slug_market': {
      if (!itemId) return;
      const { data: row } = await db
        .from('slug_registrations' as any)
        .select('user_id, for_sale, sale_price, slug, status')
        .eq('slug', itemId)
        .eq('for_sale', true)
        .maybeSingle();
      if (!row || (row as any).status === 'auction') {
        console.warn('[Fulfill] slug_market: not listed or is auction', itemId);
        return;
      }
      const sellerId = (row as any).user_id as string;
      if (sellerId === userId) {
        console.warn('[Fulfill] slug_market: buyer is seller');
        return;
      }
      const sp = Number((row as any).sale_price);
      if (!Number.isFinite(sp) || sp <= 0 || !priceApproxEqual(amountUsd, sp)) {
        console.warn('[Fulfill] slug_market: price mismatch', amountUsd, sp);
        return;
      }
      const recipientMarket = await resolvePolygonForSlugNft(db, userId, ctx);
      if (!recipientMarket) {
        console.warn('[Fulfill] slug_market: no valid Polygon wallet for buyer');
        return;
      }
      const effCtxMarket: FulfillmentContext = { ...ctx, polygonWallet: recipientMarket };
      await db
        .from('slug_registrations' as any)
        .update({
          user_id: userId,
          for_sale: false,
          sale_price: null,
          status: 'active',
        })
        .eq('slug', itemId);
      await releaseMiniSiteSlugFromSeller(db, sellerId, itemId);

      const sellerShare = amountUsd * PAYMENT_SPLITS.slug.creator;
      const siteRow = await getMiniSiteStripeForUser(db, sellerId);
      const stripe = getStripeAdmin();
      if (stripe && siteRow?.stripe_connect_account_id && siteRow?.stripe_connect_charges_enabled) {
        try {
          await transferCreatorUsd(stripe, siteRow.stripe_connect_account_id, sellerShare, {
            kind: 'slug_market',
            slug: itemId,
            ref: paymentRef.slice(0, 80),
          });
        } catch (err) {
          console.error('[Fulfill] Stripe transfer (slug_market)', err);
        }
      }
      await maybeMintSlugCertificateNft(db, effCtxMarket, paymentRef, userId, itemId);
      break;
    }
    case 'slug_auction_settle': {
      if (!itemId) return;
      const { data: auction } = await db
        .from('slug_auctions' as any)
        .select('id, slug, seller_id, winner_id, current_bid, status, slug_registration_id, min_bid')
        .eq('id', itemId)
        .maybeSingle();
      if (!auction || (auction as any).status !== 'ended') {
        console.warn('[Fulfill] slug_auction_settle: not ended', itemId);
        return;
      }
      if ((auction as any).winner_id !== userId) {
        console.warn('[Fulfill] slug_auction_settle: not winner');
        return;
      }
      const finalBid = Number((auction as any).current_bid || 0);
      if (finalBid <= 0 || !priceApproxEqual(amountUsd, finalBid)) {
        console.warn('[Fulfill] slug_auction_settle: amount mismatch', amountUsd, finalBid);
        return;
      }
      const slugStr = (auction as any).slug as string;
      const sellerId = (auction as any).seller_id as string;
      if (!slugStr || !sellerId) return;

      const recipientAuction = await resolvePolygonForSlugNft(db, userId, ctx);
      if (!recipientAuction) {
        console.warn('[Fulfill] slug_auction_settle: no valid Polygon wallet for winner');
        return;
      }
      const effCtxAuction: FulfillmentContext = { ...ctx, polygonWallet: recipientAuction };

      await db
        .from('slug_registrations' as any)
        .update({
          user_id: userId,
          for_sale: false,
          sale_price: null,
          status: 'active',
        })
        .eq('slug', slugStr);
      await releaseMiniSiteSlugFromSeller(db, sellerId, slugStr);

      const sellerShare = amountUsd * PAYMENT_SPLITS.slug.creator;
      const siteRow = await getMiniSiteStripeForUser(db, sellerId);
      const stripe = getStripeAdmin();
      if (stripe && siteRow?.stripe_connect_account_id && siteRow?.stripe_connect_charges_enabled) {
        try {
          await transferCreatorUsd(stripe, siteRow.stripe_connect_account_id, sellerShare, {
            kind: 'slug_auction',
            slug: slugStr,
            ref: paymentRef.slice(0, 80),
          });
        } catch (err) {
          console.error('[Fulfill] Stripe transfer (slug_auction_settle)', err);
        }
      }

      await db.from('slug_auctions' as any).update({ status: 'settled' }).eq('id', itemId);
      await maybeMintSlugCertificateNft(db, effCtxAuction, paymentRef, userId, slugStr);
      break;
    }
    case 'slug': {
      if (!itemId) return;
      const recipientSlug = await resolvePolygonForSlugNft(db, userId, ctx);
      if (!recipientSlug) {
        console.warn('[Fulfill] slug: no valid Polygon wallet');
        return;
      }
      const effCtxSlug: FulfillmentContext = { ...ctx, polygonWallet: recipientSlug };
      await db.from('slug_registrations' as any).upsert(
        {
          user_id: userId,
          slug: itemId,
          status: 'active',
          expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        },
        { onConflict: 'slug', ignoreDuplicates: false },
      );
      const { data: prem } = await db.from('premium_slugs' as any).select('id').eq('slug', itemId).maybeSingle();
      if (prem) {
        await db.from('premium_slugs' as any).update({ sold_to: userId, active: false }).eq('slug', itemId);
      }
      await maybeMintSlugCertificateNft(db, effCtxSlug, paymentRef, userId, itemId);
      break;
    }
    case 'classified': {
      if (!itemId) return;
      await db.from('classified_listings').update({ status: 'active' }).eq('id', itemId);
      break;
    }
    case 'classified_property_highlight': {
      if (!itemId) return;
      const expected = PLATFORM_USD.propertyDirectoryHighlight30d;
      if (!priceApproxEqual(amountUsd, expected)) {
        console.warn('[Fulfill] classified_property_highlight: amount mismatch', amountUsd, expected);
        return;
      }
      const [listingId, colorRaw] = String(itemId).split('::');
      const safeColor = /^([0-9a-f]{6})$/i.test(String(colorRaw || ''))
        ? `#${String(colorRaw).toLowerCase()}`
        : '#f59e0b';
      const { data: row } = await db
        .from('classified_listings')
        .select('id,user_id,type,highlight_until')
        .eq('id', listingId)
        .maybeSingle();
      const cl = row as {
        id: string;
        user_id: string;
        type: string;
        highlight_until: string | null;
      } | null;
      if (!cl || cl.user_id !== userId || cl.type !== 'imovel') {
        console.warn('[Fulfill] classified_property_highlight: not owner or not a property listing');
        return;
      }
      const curMs = cl.highlight_until ? new Date(cl.highlight_until).getTime() : 0;
      const base = Math.max(Date.now(), curMs);
      const until = new Date(base + 30 * 24 * 3600 * 1000).toISOString();
      await db
        .from('classified_listings')
        .update({
          highlight_until: until,
          highlight_color: safeColor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', listingId);
      break;
    }
    case 'brand_ad': {
      if (!itemId) return;
      const platformPct = PAYMENT_SPLITS.brand_ad.platform;

      const { data: proposal } = await db
        .from('ad_proposals' as any)
        .select(
          'id,status,duration_days,advertiser_user_id,magic_brand_color,magic_product_label,magic_tone,magic_script,body,title',
        )
        .eq('id', itemId)
        .maybeSingle();

      if (!proposal || (proposal as any).advertiser_user_id !== userId) {
        console.warn('[Fulfill] brand_ad: missing proposal or wrong advertiser');
        break;
      }
      if ((proposal as any).status !== 'fully_accepted') {
        console.warn('[Fulfill] brand_ad: proposal not fully_accepted');
        break;
      }

      await db
        .from('ad_proposals' as any)
        .update({
          payment_status: 'paid_escrow',
          paid_amount_usdc: amountUsd,
          helio_tx_ref: paymentRef || null,
          paid_at: new Date().toISOString(),
          status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      const { data: targets } = await db
        .from('ad_proposal_targets' as any)
        .select('id, site_id, bid_amount_usdc, message_to_owner, ad_slots')
        .eq('proposal_id', itemId)
        .eq('owner_status', 'accepted');

      const durationDays = Math.max(1, Number((proposal as any).duration_days) || 7);
      const endsAt = new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString();

      for (const t of targets || []) {
        const bid = Number((t as any).bid_amount_usdc || 0);
        const creatorShare = bid * (1 - platformPct);
        await db
          .from('ad_proposal_targets' as any)
          .update({
            creator_share_usdc: creatorShare,
            creator_payout_status: 'pending_release',
          })
          .eq('id', (t as any).id);

        const pr = proposal as any;
        const slotRaw = typeof (t as any).message_to_owner === 'string' ? (t as any).message_to_owner : '';
        const slotLegacy = slotRaw.startsWith('SLOTS:')
          ? slotRaw.replace('SLOTS:', '').split(',').map((s: string) => s.trim()).filter(Boolean)
          : [];
        const slotJson = Array.isArray((t as any).ad_slots) ? (t as any).ad_slots : [];
        const slotList = slotJson.length ? slotJson : slotLegacy;
        const wantsTicker = slotList.includes('ticker_header');
        const magicBoost = {
          brandColor: pr.magic_brand_color || null,
          productLabel: pr.magic_product_label || null,
          tone: pr.magic_tone === 'wild_monkey' ? 'wild_monkey' : 'professional',
          scriptRaw: (typeof pr.magic_script === 'string' && pr.magic_script.trim()
            ? pr.magic_script
            : pr.body || '') || '',
          title: pr.title || null,
          placements: slotList,
          polishedScript: null as string | null,
          ttsPublicUrl: null as string | null,
        };

        await db.from('ad_campaigns' as any).insert({
          proposal_id: itemId,
          target_id: (t as any).id,
          site_id: (t as any).site_id,
          starts_at: new Date().toISOString(),
          ends_at: endsAt,
          delete_locked_until: endsAt,
          ticker_items: wantsTicker
            ? [{ label: pr.title || 'Sponsored', url: null }]
            : [],
          status: 'active',
          magic_boost: magicBoost,
        });
      }

      await db.from('ad_proposals' as any).update({ status: 'live', updated_at: new Date().toISOString() }).eq('id', itemId);
      break;
    }
    case 'mystic_service': {
      if (!itemId || !mysticService) return;
      const ref = paymentRef.slice(0, 200);
      const { data: existing } = await db
        .from('mystic_entitlements' as any)
        .select('id')
        .eq('buyer_id', userId)
        .eq('site_id', itemId)
        .eq('service', mysticService)
        .eq('payment_ref', ref)
        .maybeSingle();
      if (existing) break;
      /** Cobrança directa na conta Connect do criador: não há transfer desde a plataforma. */
      await db.from('mystic_entitlements' as any).insert({
        buyer_id: userId,
        site_id: itemId,
        service: mysticService,
        uses_remaining: 1,
        payment_ref: ref,
      });
      break;
    }
    case 'directory_company': {
      const billing = (billingPeriod || 'monthly') as string;
      const days = billing === 'yearly' || billing === 'annual' ? 365 : 30;
      const { data: row } = await db.from('company_cv_directory_access' as any).select('expires_at').eq('user_id', userId).maybeSingle();
      const base = row?.expires_at && new Date((row as any).expires_at) > new Date() ? new Date((row as any).expires_at) : new Date();
      const expires = new Date(base.getTime() + days * 24 * 3600 * 1000);
      await db.from('company_cv_directory_access' as any).upsert(
        {
          user_id: userId,
          expires_at: expires.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      break;
    }
    case 'profile_loop_video': {
      if (!itemId) return;
      const billing = (billingPeriod || 'monthly') as string;
      const days = billing === 'yearly' || billing === 'annual' ? 365 : 30;
      const monthly = PLATFORM_USD.profileLoopVideoExtendedMonthly;
      const yearly = PLATFORM_USD.profileLoopVideoExtendedYearly;
      const expected = billing === 'yearly' || billing === 'annual' ? yearly : monthly;
      if (!priceApproxEqual(amountUsd, expected)) {
        console.warn('[Fulfill] profile_loop_video: price mismatch', amountUsd, expected);
        return;
      }
      const { data: site } = await db
        .from('mini_sites' as any)
        .select('user_id, profile_loop_video_extended_until')
        .eq('id', itemId)
        .maybeSingle();
      if (!site || (site as { user_id?: string }).user_id !== userId) {
        console.warn('[Fulfill] profile_loop_video: site or owner', itemId);
        return;
      }
      const cur = (site as { profile_loop_video_extended_until?: string | null }).profile_loop_video_extended_until;
      const base = cur && new Date(cur) > new Date() ? new Date(cur) : new Date();
      const until = new Date(base.getTime() + days * 24 * 3600 * 1000);
      await db
        .from('mini_sites' as any)
        .update({
          profile_loop_video_extended_until: until.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .eq('user_id', userId);
      break;
    }
    case 'feed_subscription': {
      if (!itemId) return;
      const days = line.feedPassDays === 365 ? 365 : 7;
      const expected =
        days === 365 ? PLATFORM_USD.feedDirectory365d : PLATFORM_USD.feedDirectory7d;
      if (!priceApproxEqual(amountUsd, expected)) {
        console.warn('[Fulfill] feed_subscription: price mismatch', amountUsd, expected);
        return;
      }
      const { data: site } = await db
        .from('mini_sites' as any)
        .select('user_id, feed_paid_until')
        .eq('id', itemId)
        .maybeSingle();
      if (!site || (site as { user_id?: string }).user_id !== userId) {
        console.warn('[Fulfill] feed_subscription: site or owner', itemId);
        return;
      }
      const cur = (site as { feed_paid_until?: string | null }).feed_paid_until;
      const base = cur && new Date(cur) > new Date() ? new Date(cur) : new Date();
      const until = new Date(base.getTime() + days * 24 * 3600 * 1000);
      await db
        .from('mini_sites' as any)
        .update({
          feed_paid_until: until.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .eq('user_id', userId);
      break;
    }
    case 'marketing_campaign_setup': {
      if (!itemId) return;
      const budget = Number(faceValueUsd ?? 0);
      if (!Number.isFinite(budget) || budget < 0) {
        console.warn('[Fulfill] marketing_campaign_setup: invalid budget', faceValueUsd);
        return;
      }
      const expected = marketingSetupFeeUsd() + budget;
      if (!priceApproxEqual(amountUsd, expected)) {
        console.warn('[Fulfill] marketing_campaign_setup: price mismatch', amountUsd, expected);
        return;
      }
      const { data: row } = await db
        .from('marketing_campaigns' as any)
        .select('id, brand_id, total_budget')
        .eq('id', itemId)
        .maybeSingle();
      if (!row || (row as { brand_id?: string }).brand_id !== userId) {
        console.warn('[Fulfill] marketing_campaign_setup: campaign or owner', itemId);
        return;
      }
      const current = Number((row as { total_budget?: number | string }).total_budget || 0);
      await db
        .from('marketing_campaigns' as any)
        .update({
          total_budget: Math.max(0, current) + budget,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .eq('brand_id', userId);
      break;
    }
    default:
      console.warn('[Fulfill] unknown kind', kind);
  }
}
