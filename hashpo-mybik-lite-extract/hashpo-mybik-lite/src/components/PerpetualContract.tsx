import { Lock, ExternalLink, Shield, FileText } from "lucide-react";
import type { Video } from "@/hooks/useVideos";

interface PerpetualContractProps {
  video: Video;
}

const PerpetualContract = ({ video }: PerpetualContractProps) => {
  if (!video.shares_issued || !video.polygon_hash) return null;

  const platformReserve = Math.round(video.total_shares * 0.05);
  const creatorLocked = Math.round(video.total_shares * 0.35);
  const marketFloat = video.total_shares - platformReserve - creatorLocked;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-bold text-card-foreground uppercase tracking-wide">
          Contract & Proof
        </h3>
      </div>

      {/* On-Chain Details */}
      <div className="bg-secondary rounded-lg p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-mono">Contract Address</span>
          <a
            href={`https://polygonscan.com/tx/${video.polygon_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-primary font-mono hover:underline"
          >
            {video.polygon_hash.slice(0, 10)}...{video.polygon_hash.slice(-8)}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-mono">Transaction Hash</span>
          <a
            href={`https://polygonscan.com/tx/${video.polygon_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-primary font-mono hover:underline"
          >
            View on PolygonScan
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Issuance Date</span>
          <span className="text-[10px] font-mono text-card-foreground">
            {new Date(video.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Status</span>
          <span className="flex items-center gap-1 ticker-badge text-[9px]">
            <Lock className="w-2.5 h-2.5" /> IMMUTABLE
          </span>
        </div>
      </div>

      {/* Share Distribution */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
          Share Distribution — {video.total_shares.toLocaleString()} Total Supply
        </h4>

        <div className="space-y-1.5">
          {/* Market Float */}
          <div className="flex items-center justify-between bg-secondary/50 rounded px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#0ECB81" }} />
              <span className="text-[10px] font-bold text-card-foreground">Market Float</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono font-bold text-card-foreground">{marketFloat.toLocaleString()} shares</span>
              <span className="text-[9px] text-muted-foreground ml-1.5">60%</span>
            </div>
          </div>

          {/* Creator Locked Equity */}
          <div className="flex items-center justify-between bg-secondary/50 rounded px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-card-foreground">Creator Locked Equity</span>
              <span className="text-[7px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-bold">NON-TRANSFERABLE</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono font-bold text-card-foreground">{creatorLocked.toLocaleString()} shares</span>
              <span className="text-[9px] text-muted-foreground ml-1.5">35%</span>
            </div>
          </div>

          {/* Platform Reserve */}
          <div className="flex items-center justify-between bg-secondary/50 rounded px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="text-[10px] font-bold text-card-foreground">Platform Reserve (HASHPO)</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono font-bold text-card-foreground">{platformReserve.toLocaleString()} shares</span>
              <span className="text-[9px] text-muted-foreground ml-1.5">5%</span>
            </div>
          </div>
        </div>

        {/* Visual bar */}
        <div className="w-full h-3 rounded-full overflow-hidden flex">
          <div style={{ width: "60%", background: "#0ECB81" }} />
          <div style={{ width: "35%" }} className="bg-primary" />
          <div style={{ width: "5%" }} className="bg-accent" />
        </div>
      </div>

      {/* Governance & Rights */}
      <div className="border-t border-border pt-3 space-y-2">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase">
          Ownership & Governance
        </h4>
        <ul className="text-[9px] text-muted-foreground leading-relaxed space-y-1">
          <li className="flex items-start gap-1.5">
            <Shield className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
            Share ownership grants <strong>economic rights only</strong> (dividends, resale). No editorial or admin control.
          </li>
          <li className="flex items-start gap-1.5">
            <Lock className="w-3 h-3 mt-0.5 shrink-0 text-destructive" />
            Creator Locked Equity (35%) can <strong>never be sold, transferred, or burned</strong>.
          </li>
          <li className="flex items-start gap-1.5">
            <Shield className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />
            The original creator remains the permanent video administrator.
          </li>
        </ul>
      </div>

      {/* Assignment Terms */}
      <div className="border-t border-border pt-3">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-2">
          Assignment & Anti-Sabotage Terms
        </h4>
        <p className="text-[9px] text-muted-foreground leading-relaxed">
          Upon annual fee default (pre-issuance only), the perpetual license rights are transferred to HASHPO.
          After share issuance, no annual fee exists and the video can <strong>never be removed</strong>.
          The creator may not distribute the full video for free externally in a way that harms the paywall.
          If malicious behavior is detected, creator dividends may be frozen and redirected to investor protection.
          All revenue streams, including paywall income and advertising proceeds, are distributed among shareholders.
          Metadata is permanently locked on the Polygon blockchain.
        </p>
      </div>

      <p className="text-[7px] text-muted-foreground/60 leading-tight">
        HASHPO IS A TECH PLATFORM. CONTENT IS CREATOR RESPONSIBILITY. HIGH RISK ASSET.
        Shares do not represent equity ownership. Trading involves risk of total loss.
      </p>
    </div>
  );
};

export default PerpetualContract;
