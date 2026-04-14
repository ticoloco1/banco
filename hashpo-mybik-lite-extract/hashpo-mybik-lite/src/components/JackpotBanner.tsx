import { useJackpotPool } from "@/hooks/useBoosts";
import { Zap } from "lucide-react";

const JackpotBanner = () => {
  const pool = useJackpotPool();
  const amount = pool?.total_amount ?? 0;

  return (
    <div className="bg-black border-b border-border flex items-center justify-center gap-3 py-2 px-4">
      <Zap className="w-4 h-4" style={{ color: "#39FF14" }} />
      <span className="font-mono font-extrabold text-sm tracking-wide" style={{ color: "#39FF14" }}>
        JACKPOT POOL
      </span>
      <span
        className="font-mono font-extrabold text-xl tabular-nums"
        style={{ color: "#39FF14", textShadow: "0 0 10px #39FF14, 0 0 20px #39FF1466" }}
      >
        ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="font-mono text-xs opacity-60" style={{ color: "#39FF14" }}>
        USDC
      </span>
    </div>
  );
};

export default JackpotBanner;
