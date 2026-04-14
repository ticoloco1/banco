import { useSettings } from "@/hooks/useSettings";
import SEO from "@/components/SEO";
import Link from "next/link";

const CARDS = [
  {
    icon: "🚀", q: "What is StreamMint?",
    a: <>A platform where creators <strong className="text-foreground">launch video NFTs, sell exclusive content, and build a personal page</strong> — all in one place.</>,
    tag: "⚡ The Big Picture", tagColor: "text-[#ff4500]", borderColor: "border-[#ff4500]/30",
    style: { "--card-border": "rgba(255,69,0,0.4)", "--card-glow": "rgba(255,69,0,0.08)" } as React.CSSProperties,
  },
  {
    icon: "🎬", q: "What's a Video NFT?",
    a: <>A digital token with a <strong className="text-foreground">video baked in forever</strong>. Stored on Arweave — a permanent blockchain — so the video can never be deleted.</>,
    tag: "🔷 NFT", tagColor: "text-[#f5c518]", borderColor: "border-[#f5c518]/30",
    style: { "--card-border": "rgba(245,197,24,0.4)", "--card-glow": "rgba(245,197,24,0.06)" } as React.CSSProperties,
  },
  {
    icon: "🌐", q: "What's the Mini Site?",
    a: <>Every creator gets a <strong className="text-foreground">personal page</strong> — like a Linktree that actually does something. Videos, NFTs, portfolio, and premium content.</>,
    tag: "🌐 Mini Site", tagColor: "text-[#00e5ff]", borderColor: "border-[#00e5ff]/30",
    style: { "--card-border": "rgba(0,229,255,0.4)", "--card-glow": "rgba(0,229,255,0.06)" } as React.CSSProperties,
    showPrice: "minisite",
  },
  {
    icon: "💸", q: "How do creators get paid?",
    a: <>Every sale is settled <strong className="text-foreground">automatically on-chain</strong>. No invoices. No waiting. No middlemen.</>,
    split: { you: "YOU 60–70%", us: "Platform 30–40%" },
    style: { "--card-border": "rgba(0,255,136,0.4)", "--card-glow": "rgba(0,255,136,0.06)" } as React.CSSProperties,
  },
  {
    icon: "📈", q: "Can I make money as a buyer?",
    a: <>Buy a Video NFT early, and if the creator blows up, <strong className="text-foreground">your NFT goes up in value</strong>. Resell it on the marketplace anytime.</>,
    tag: "📈 Speculate", tagColor: "text-[#ff4500]", borderColor: "border-[#ff4500]/30",
    style: { "--card-border": "rgba(255,69,0,0.4)", "--card-glow": "rgba(255,69,0,0.08)" } as React.CSSProperties,
  },
  {
    icon: "🔁", q: "How does reselling work?",
    a: <>List your NFT at any price. When it sells, <strong className="text-foreground">70% goes to you instantly</strong>. The original creator earns royalties automatically.</>,
    split: { you: "SELLER 70%", us: "Platform 30%" },
    style: { "--card-border": "rgba(245,197,24,0.4)", "--card-glow": "rgba(245,197,24,0.06)" } as React.CSSProperties,
  },
  {
    icon: "🔓", q: "What's the Paywall?",
    a: <>Creators lock videos behind a paywall. Pay <strong className="text-foreground">once to unlock</strong> — access lasts 12 hours. No subscription required.</>,
    showPrice: "paywall",
    style: { "--card-border": "rgba(0,229,255,0.4)", "--card-glow": "rgba(0,229,255,0.06)" } as React.CSSProperties,
  },
  {
    icon: "🎞️", q: "What's a video recharge?",
    a: <>Pay a small fee to <strong className="text-foreground">rewatch any video NFT</strong> you hold. The creator earns 50% of every recharge.</>,
    showPrice: "recharge",
    style: { "--card-border": "rgba(0,255,136,0.4)", "--card-glow": "rgba(0,255,136,0.06)" } as React.CSSProperties,
  },
  {
    icon: "🏗️", q: "How do I launch an NFT collection?",
    a: <>Upload your video, set quantity and price. Pay a one-time launch fee — covers Arweave storage and smart contract deployment.</>,
    showPrice: "launch",
    style: { "--card-border": "rgba(255,69,0,0.4)", "--card-glow": "rgba(255,69,0,0.08)" } as React.CSSProperties,
  },
  {
    icon: "🔐", q: "Do I need a crypto wallet?",
    a: <>Yes — connect your existing wallet (MetaMask, Rabby, Coinbase Wallet). <strong className="text-foreground">No new accounts</strong>, no hidden seed phrases.</>,
    tag: "🔐 Self-Custody", tagColor: "text-[#f5c518]", borderColor: "border-[#f5c518]/30",
    style: { "--card-border": "rgba(245,197,24,0.4)", "--card-glow": "rgba(245,197,24,0.06)" } as React.CSSProperties,
  },
  {
    icon: "🎭", q: "What goes on my Mini Site?",
    a: <>Your <strong className="text-foreground">video library</strong> (free + paid), your <strong className="text-foreground">NFT collection</strong>, your <strong className="text-foreground">CV / portfolio</strong>, and social links.</>,
    tag: "🌐 Mini Site", tagColor: "text-[#00e5ff]", borderColor: "border-[#00e5ff]/30",
    style: { "--card-border": "rgba(0,229,255,0.4)", "--card-glow": "rgba(0,229,255,0.06)" } as React.CSSProperties,
  },
  {
    icon: "⛓️", q: "Is this actually on the blockchain?",
    a: <>Yes. NFTs live on <strong className="text-foreground">Polygon</strong> (fast, cheap). Videos on <strong className="text-foreground">Arweave</strong> (permanent). Payments settle on-chain.</>,
    tag: "⛓️ On-Chain", tagColor: "text-[#00ff88]", borderColor: "border-[#00ff88]/30",
    style: { "--card-border": "rgba(0,255,136,0.4)", "--card-glow": "rgba(0,255,136,0.06)" } as React.CSSProperties,
  },
];

const HowItWorks = () => {
  const { data: settings } = useSettings();
  const s = settings as any;

  const prices: Record<string, string> = {
    paywall: `$${s?.paywall_min_embed ?? 0.10}`,
    launch: `$${s?.nft_launch_fee ?? 300}`,
    recharge: `$${s?.recharge_creator_pct ? "2.90" : "2.90"}`,
    minisite: `$${s?.annual_plan_price ?? 80}/yr`,
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#f2f2f8] relative overflow-hidden">
      <SEO title="How It Works" description="Learn how HASHPO lets creators tokenise content, sell shares, and earn dividends — all on Polygon." />
      {/* Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-[#ff4500] opacity-10 blur-[120px] -top-[200px] -left-[200px] animate-pulse" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[#00e5ff] opacity-10 blur-[120px] -bottom-[150px] -right-[150px] animate-pulse" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-[#f5c518] opacity-10 blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>

      <div className="relative z-10 max-w-[1080px] mx-auto px-6 py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#ff4500]/12 border border-[#ff4500]/30 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-[#ff4500] font-bold mb-7 rounded-sm">
            <span className="w-2 h-2 bg-[#ff4500] rounded-full animate-pulse" /> How It Works
          </div>
          <h1 className="font-black text-5xl md:text-7xl leading-[1] tracking-tight mb-6">
            Your content.<br />
            <span className="bg-gradient-to-r from-[#ff4500] to-[#f5c518] bg-clip-text text-transparent">Your rules.</span><br />
            Your earnings.
          </h1>
          <p className="text-lg text-[#8888aa] max-w-[560px] mx-auto leading-relaxed font-medium">
            The first platform where video, NFTs, and a personal mini site live in one place — and you keep the majority of every dollar.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CARDS.map((card, i) => (
            <div
              key={i}
              className="bg-[#0d0d14] border border-[#1e1e2e] rounded-2xl p-7 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group"
              style={{ animationDelay: `${i * 0.05}s`, ...card.style }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] mb-5 bg-white/5 border border-white/10">
                {card.icon}
              </div>
              <h3 className="font-bold text-[17px] leading-tight mb-3 text-[#f2f2f8]">{card.q}</h3>
              <p className="text-sm leading-relaxed text-[#8888aa] font-medium">{card.a}</p>

              {card.split && (
                <div className="inline-flex items-center rounded-lg overflow-hidden mt-4 text-xs font-extrabold tracking-wide">
                  <span className="bg-[#00ff88] text-black px-3 py-1">{card.split.you}</span>
                  <span className="bg-[#13131e] text-[#8888aa] px-2.5 py-1 border border-[#1e1e2e]">{card.split.us}</span>
                </div>
              )}

              {card.showPrice && prices[card.showPrice] && (
                <div className="inline-flex items-center gap-2 mt-4 bg-[#00ff88]/8 border border-[#00ff88]/25 rounded-lg px-3.5 py-2">
                  <span className="text-[11px] text-[#8888aa] font-bold uppercase tracking-widest">from</span>
                  <span className="font-black text-xl text-[#00ff88]">{prices[card.showPrice]}</span>
                </div>
              )}

              {card.tag && (
                <span className={`inline-flex items-center gap-1.5 mt-4 text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${card.tagColor} ${card.borderColor}`}>
                  {card.tag}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 p-12 bg-[#0d0d14] border border-[#1e1e2e] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="font-black text-3xl leading-tight">
              Ready to own the <span className="text-[#ff4500]">future of content?</span>
            </h2>
            <p className="text-[#8888aa] text-sm mt-2 font-medium">Join now — creators and collectors welcome.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/site/edit" className="bg-[#ff4500] text-white px-7 py-3.5 font-extrabold text-sm rounded-xl hover:bg-[#ff5c1a] transition-all hover:-translate-y-0.5">
              Launch My Collection →
            </Link>
            <Link href="/marketplace" className="bg-transparent text-white border border-[#1e1e2e] px-7 py-3.5 font-bold text-sm rounded-xl hover:border-[#8888aa] transition-all">
              Browse NFTs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
