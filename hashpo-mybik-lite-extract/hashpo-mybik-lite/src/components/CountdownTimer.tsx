import { useState, useEffect } from "react";

interface CountdownTimerProps { expiresAt: string; }

export default function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("00:00:00:00"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(d).padStart(2,"0")}:${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="inline-flex items-center gap-1.5 mt-1">
      <div className="font-mono text-[11px] font-bold tracking-wider px-2 py-0.5 rounded"
        style={{ color: "#39ff14", backgroundColor: "rgba(0,0,0,0.6)", textShadow: "0 0 6px #39ff14, 0 0 12px #39ff14", border: "1px solid rgba(57,255,20,0.3)" }}>
        ⏱ {timeLeft}
      </div>
    </div>
  );
}
