'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

type Offer = {
  id: string;
  title: string;
  target_account_type?: string | null;
  placement_type?: string | null;
  price_per_lead: number;
  total_budget: number;
};

export default function NftOffersPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [wallet, setWallet] = useState('');

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/public/nft-offers');
      const data = await res.json().catch(() => ({}));
      setOffers(Array.isArray(data.offers) ? data.offers : []);
      setLoading(false);
    })();
  }, []);

  async function claim(campaignId: string) {
    if (!user?.id) {
      alert('Sign in first');
      return;
    }
    setBusyId(campaignId);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch('/api/platform/marketing-campaigns/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ campaignId, name, email, city, wallet }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Claim failed');
      alert('NFT claim queued.');
      setName('');
      setEmail('');
      setCity('');
      setWallet('');
    } catch (e: any) {
      alert(e?.message || 'Claim failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        <h1 className="text-2xl font-black text-[var(--text)]">NFT Offers Marketplace</h1>
        <p className="text-sm text-[var(--text2)]">
          Opt-in campaigns. If you want an NFT/discount, click Receive and submit KYC + wallet.
        </p>
        <div className="card p-4 grid sm:grid-cols-2 gap-2">
          <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <input className="input font-mono" placeholder="Polygon wallet 0x..." value={wallet} onChange={(e) => setWallet(e.target.value)} />
        </div>
        {loading ? <p className="text-[var(--text2)]">Loading...</p> : null}
        <div className="space-y-3">
          {offers.map((o) => (
            <div key={o.id} className="card p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-[var(--text)]">{o.title}</p>
                <p className="text-xs text-[var(--text2)]">
                  {o.placement_type || 'targeted'} · {o.target_account_type || 'all'} · ${Number(o.price_per_lead || 0)} per lead
                </p>
              </div>
              <button className="btn-primary text-xs" disabled={busyId === o.id} onClick={() => void claim(o.id)}>
                {busyId === o.id ? 'Sending...' : 'Receive NFT'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
