'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type Listing = {
  id: string;
  nft_name?: string | null;
  nft_image?: string | null;
  contract_address: string;
  token_id: string;
  price_usdc: number;
  original_ad_link_url?: string | null;
  original_ad_video_url?: string | null;
};

export default function SecondaryMarketPage() {
  const [rows, setRows] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState('');
  const [listContract, setListContract] = useState('');
  const [listTokenId, setListTokenId] = useState('');
  const [listPriceUsdc, setListPriceUsdc] = useState('');
  const [listName, setListName] = useState('');
  const [listImage, setListImage] = useState('');
  const [listAdLink, setListAdLink] = useState('');
  const [listAdVideo, setListAdVideo] = useState('');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [rarity, setRarity] = useState('');
  const [redeemLinkUrl, setRedeemLinkUrl] = useState('');
  const [usageRules, setUsageRules] = useState('');
  const [discountPercent, setDiscountPercent] = useState('20');
  const [campaignSecret, setCampaignSecret] = useState('');

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/nft/secondary/listings');
      const data = await res.json().catch(() => ({}));
      setRows(Array.isArray(data.listings) ? data.listings : []);
      setLoading(false);
    })();
  }, []);

  async function buy(listingId: string) {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;
    if (!userId) {
      alert('Login first');
      return;
    }
    if (!wallet.trim()) {
      alert('Set buyer wallet first');
      return;
    }
    const res = await fetch('/api/nft/secondary/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, buyerUserId: userId, buyerWallet: wallet.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.error || 'Buy failed');
      return;
    }
    alert(`Bought! tx=${data.txHash}`);
    setRows((prev) => prev.filter((x) => x.id !== listingId));
  }

  async function createListing() {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;
    if (!userId) {
      alert('Login first');
      return;
    }
    if (!wallet.trim()) {
      alert('Set seller wallet first');
      return;
    }
    const price = Number(listPriceUsdc || 0);
    const res = await fetch('/api/nft/secondary/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerUserId: userId,
        sellerWallet: wallet.trim(),
        contractAddress: listContract.trim(),
        tokenId: listTokenId.trim(),
        priceUsdc: price,
        nftName: listName.trim(),
        nftImage: listImage.trim(),
        nftMetadata: {
          originalAdLinkUrl: listAdLink.trim() || null,
          originalAdVideoUrl: listAdVideo.trim() || null,
          redeemLinkUrl: redeemLinkUrl.trim() || null,
          usageRules: usageRules.trim() || null,
        },
        brandLogoUrl: brandLogoUrl.trim() || null,
        serialNumber: serialNumber.trim() || null,
        rarity: rarity.trim() || null,
        redeemLinkUrl: redeemLinkUrl.trim() || null,
        usageRules: usageRules.trim() || null,
        discountPercent: Number(discountPercent || 0) || 20,
        campaignSecret: campaignSecret.trim() || null,
        originalAdLinkUrl: listAdLink.trim() || null,
        originalAdVideoUrl: listAdVideo.trim() || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.listing) {
      alert(data?.error || 'Create listing failed');
      return;
    }
    setRows((prev) => [data.listing as Listing, ...prev]);
    setListContract('');
    setListTokenId('');
    setListPriceUsdc('');
    setListName('');
    setListImage('');
    setListAdLink('');
    setListAdVideo('');
    setBrandLogoUrl('');
    setSerialNumber('');
    setRarity('');
    setRedeemLinkUrl('');
    setUsageRules('');
    setDiscountPercent('20');
    setCampaignSecret('');
    alert('Listing created.');
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-2xl font-black text-[var(--text)]">Secondary Market</h1>
        <p className="text-sm text-[var(--text2)]">
          Buy collectible NFTs. Original ad banner (link/video) stays attached forever across resales.
        </p>
        <input
          className="input w-full font-mono"
          placeholder="Your wallet (0x...)"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
        />
        <div className="card p-4 space-y-2">
          <p className="font-bold text-[var(--text)]">List collectible NFT</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <input className="input font-mono" placeholder="Contract address" value={listContract} onChange={(e) => setListContract(e.target.value)} />
            <input className="input" placeholder="Token ID" value={listTokenId} onChange={(e) => setListTokenId(e.target.value)} />
            <input className="input" placeholder="Price (USDC)" value={listPriceUsdc} onChange={(e) => setListPriceUsdc(e.target.value)} />
            <input className="input" placeholder="NFT name" value={listName} onChange={(e) => setListName(e.target.value)} />
            <input className="input sm:col-span-2" placeholder="NFT image URL" value={listImage} onChange={(e) => setListImage(e.target.value)} />
            <input className="input sm:col-span-2" placeholder="Original ad link (vitalício)" value={listAdLink} onChange={(e) => setListAdLink(e.target.value)} />
            <input className="input sm:col-span-2" placeholder="Original ad video URL (vitalício)" value={listAdVideo} onChange={(e) => setListAdVideo(e.target.value)} />
            <input className="input" placeholder="Brand logo URL" value={brandLogoUrl} onChange={(e) => setBrandLogoUrl(e.target.value)} />
            <input className="input" placeholder="Serial number (ex: #042/1000)" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
            <input className="input" placeholder="Rarity (Comum, Raro, Lendário)" value={rarity} onChange={(e) => setRarity(e.target.value)} />
            <input className="input" placeholder="Discount % (ex: 20)" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
            <input className="input sm:col-span-2" placeholder="Redeem link (resgate)" value={redeemLinkUrl} onChange={(e) => setRedeemLinkUrl(e.target.value)} />
            <input className="input sm:col-span-2" placeholder="Regras de uso (ex: válido apenas em loja física)" value={usageRules} onChange={(e) => setUsageRules(e.target.value)} />
            <input className="input sm:col-span-2" placeholder="Campaign secret (interno para QR)" value={campaignSecret} onChange={(e) => setCampaignSecret(e.target.value)} />
          </div>
          <button className="btn-primary text-xs" onClick={() => void createListing()}>
            Create listing
          </button>
        </div>
        {loading ? <p className="text-[var(--text2)]">Loading...</p> : null}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((r) => (
            <div key={r.id} className="card p-4 space-y-2">
              {r.nft_image ? <img src={r.nft_image} className="w-full rounded-xl aspect-square object-cover" /> : null}
              <p className="font-bold text-[var(--text)]">{r.nft_name || `NFT #${r.token_id}`}</p>
              <p className="text-xs text-[var(--text2)] font-mono">{r.contract_address}</p>
              <p className="text-sm text-[var(--text)] font-black">${Number(r.price_usdc || 0)} USDC</p>
              {r.original_ad_link_url ? (
                <Link href={r.original_ad_link_url} target="_blank" className="text-xs text-brand underline">
                  Original ad link
                </Link>
              ) : null}
              {r.original_ad_video_url ? (
                <Link href={r.original_ad_video_url} target="_blank" className="text-xs text-brand underline block">
                  Original ad video
                </Link>
              ) : null}
              <button className="btn-primary text-xs" onClick={() => void buy(r.id)}>
                Buy & transfer
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
