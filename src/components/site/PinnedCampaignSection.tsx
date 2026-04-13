'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export type PinnedCampaignPublicConfig = {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  brandName?: string;
  ctaLabel?: string;
  campaignId?: string | null;
};

type Props = {
  siteSlug: string;
  config: PinnedCampaignPublicConfig;
  accentColor: string;
  textColor: string;
  textMuted: string;
  borderColor: string;
  bgCard: string;
  radius: number;
  /** i18n */
  T: (key: string) => string;
};

/** Lead-to-wallet: captura email + carteira e envia para API (BD + webhook NFT Factory). */
export function PinnedCampaignSection({
  siteSlug,
  config,
  accentColor,
  textColor,
  textMuted,
  borderColor,
  bgCard,
  radius,
  T,
}: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [wallet, setWallet] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const brand =
    (config.brandName && config.brandName.trim()) ||
    (config.title && config.title.trim()) ||
    siteSlug;
  const title = (config.title && config.title.trim()) || T('pinned_campaign_default_title');
  const subtitle =
    (config.subtitle && config.subtitle.trim()) || T('pinned_campaign_default_sub');
  const cta = (config.ctaLabel && config.ctaLabel.trim()) || T('pinned_campaign_cta_default');

  const handleClaim = async () => {
    if (!user?.id) {
      toast.error(T('auth_signin'));
      return;
    }
    if (!name.trim() || !email.trim() || !city.trim() || !wallet.trim()) {
      toast.error(T('pinned_campaign_fill_all'));
      return;
    }
    if (!consent) {
      toast.error(T('pinned_campaign_legal_hint'));
      return;
    }
    setBusy(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch('/api/platform/marketing-campaigns/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          campaignId: config.campaignId || null,
          name: name.trim(),
          email: email.trim(),
          city: city.trim(),
          wallet: wallet.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err =
          data.error === 'kyc_required'
            ? T('pinned_campaign_kyc_required')
            : data.error === 'already_claimed'
              ? T('pinned_campaign_already_claimed')
              : data.error === 'campaign_budget_exhausted'
                ? T('pinned_campaign_budget_exhausted')
                : data.error === 'campaign_unavailable'
                  ? T('pinned_campaign_err_disabled')
                  :
          data.error === 'invalid_wallet'
            ? T('pinned_campaign_err_wallet')
            : data.error === 'invalid_email'
              ? T('pinned_campaign_err_email')
              : data.error === 'campaign_disabled'
                ? T('pinned_campaign_err_disabled')
                : T('pinned_campaign_err_generic');
        toast.error(err);
        return;
      }
      toast.success(T('pinned_campaign_success').replace('{brand}', brand));
      setName('');
      setEmail('');
      setCity('');
      setWallet('');
      setConsent(false);
    } catch {
      toast.error(T('pinned_campaign_err_generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="border p-5 sm:p-6 shadow-xl"
      style={{
        borderRadius: radius,
        borderColor,
        background: `linear-gradient(135deg, ${bgCard} 0%, rgba(0,0,0,0.35) 100%)`,
        boxShadow: `0 20px 50px -12px ${accentColor}22`,
      }}
    >
      <div
        className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest"
        style={{ borderColor, color: accentColor }}
      >
        NFT Factory · Lead-to-Wallet
      </div>
      <h3 className="mb-2 text-xl font-black sm:text-2xl" style={{ color: textColor }}>
        {title}
      </h3>
      <p className="mb-6 text-sm leading-relaxed" style={{ color: textMuted }}>
        {subtitle}
      </p>

      <div className="space-y-3">
        <input
          type="text"
          autoComplete="name"
          placeholder={T('co_name_ph')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          style={{ borderColor, background: 'rgba(0,0,0,0.35)', color: textColor }}
        />
        <input
          type="email"
          autoComplete="email"
          placeholder={T('pinned_campaign_ph_email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          style={{
            borderColor,
            background: 'rgba(0,0,0,0.35)',
            color: textColor,
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 2px ${accentColor}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = '';
          }}
        />
        <input
          type="text"
          autoComplete="address-level2"
          placeholder={T('pinned_campaign_city_ph')}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          style={{ borderColor, background: 'rgba(0,0,0,0.35)', color: textColor }}
        />
        <input
          type="text"
          autoComplete="off"
          placeholder={T('pinned_campaign_ph_wallet')}
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          className="w-full rounded-xl border px-4 py-3 font-mono text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          style={{
            borderColor,
            background: 'rgba(0,0,0,0.35)',
            color: textColor,
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 2px ${accentColor}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = '';
          }}
        />
        <label className="flex items-start gap-2 text-[11px]" style={{ color: textMuted }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>{T('pinned_campaign_consent')}</span>
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleClaim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black uppercase tracking-widest text-black transition hover:opacity-90 disabled:opacity-50"
          style={{ background: '#fafafa' }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {cta}
        </button>
      </div>
      <p className="mt-4 text-[10px] leading-relaxed opacity-70" style={{ color: textMuted }}>
        {T('pinned_campaign_legal_hint')}
      </p>
    </div>
  );
}
