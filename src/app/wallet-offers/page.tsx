import Link from 'next/link';
import { Header } from '@/components/layout/Header';

export default function WalletOffersGuidePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <h1 className="text-3xl font-black text-[var(--text)]">Wallet Guide: Receive NFT Offers</h1>
        <p className="text-sm text-[var(--text2)]">
          Your Polygon wallet is your on-chain inbox for rewards. On TrustBank, verified users can receive NFTs,
          discount passes, and campaign perks directly to their wallet.
        </p>
        <div className="card p-5 space-y-3">
          <h2 className="font-bold text-[var(--text)]">Why wallet is required</h2>
          <ul className="text-sm text-[var(--text2)] space-y-1">
            <li>- Receive NFT drops and discount tokens automatically.</li>
            <li>- Keep rewards in your own custody.</li>
            <li>- Get targeted campaigns only if you opt in.</li>
          </ul>
        </div>
        <div className="card p-5 space-y-3">
          <h2 className="font-bold text-[var(--text)]">How it works</h2>
          <ol className="text-sm text-[var(--text2)] space-y-1">
            <li>1. Complete KYC (name, city, email, wallet).</li>
            <li>2. Accept NFT/ads consent.</li>
            <li>3. Open NFT Offers and click Receive.</li>
            <li>4. TrustBank executes delivery from platform wallet flow.</li>
          </ol>
        </div>
        <div className="flex gap-2">
          <Link href="/offers/nft" className="btn-primary">Open NFT Offers</Link>
          <Link href="/editor" className="btn-secondary">Complete profile</Link>
        </div>
      </div>
    </div>
  );
}
