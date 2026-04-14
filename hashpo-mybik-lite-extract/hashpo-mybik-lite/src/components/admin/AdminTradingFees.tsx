import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { DollarSign, Percent } from "lucide-react";
import { toast } from "sonner";

const AdminTradingFees = () => {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const [brokeragePct, setBrokeragePct] = useState("0.5");
  const [treasuryPct, setTreasuryPct] = useState("70");
  const [buybackPct, setBuybackPct] = useState("30");

  useEffect(() => {
    if (settings) {
      setBrokeragePct(String((settings as any).brokerage_fee_pct ?? 0.5));
      setTreasuryPct(String((settings as any).brokerage_to_treasury_pct ?? 70));
      setBuybackPct(String((settings as any).brokerage_to_buyback_pct ?? 30));
    }
  }, [settings]);

  const handleSave = () => {
    const brokerage = parseFloat(brokeragePct);
    const treasury = parseFloat(treasuryPct);
    const buyback = parseFloat(buybackPct);

    if (brokerage < 0 || brokerage > 2) {
      toast.error("Brokerage fee must be between 0% and 2%");
      return;
    }
    if (Math.abs(treasury + buyback - 100) > 0.01) {
      toast.error("Treasury + Buyback must equal 100%");
      return;
    }

    updateSettings.mutate({
      brokerage_fee_pct: brokerage,
      brokerage_to_treasury_pct: treasury,
      brokerage_to_buyback_pct: buyback,
    } as any);
    toast.success("Trading fees updated! Changes apply to new trades only.");
  };

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg p-4 bg-card space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-card-foreground uppercase">Brokerage Fee Configuration</h2>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Fee is charged to the taker on every executed share trade. Changes apply only to NEW trades.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Brokerage Fee (%)</label>
            <p className="text-[9px] text-muted-foreground mb-1">Range: 0% – 2%</p>
            <input
              type="number"
              step="0.01"
              min="0"
              max="2"
              value={brokeragePct}
              onChange={(e) => setBrokeragePct(e.target.value)}
              className="w-full bg-secondary text-foreground text-sm font-mono border border-border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">To HASHPO Treasury (%)</label>
            <p className="text-[9px] text-muted-foreground mb-1">Default: 70%</p>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              value={treasuryPct}
              onChange={(e) => {
                setTreasuryPct(e.target.value);
                setBuybackPct(String(100 - (parseFloat(e.target.value) || 0)));
              }}
              className="w-full bg-secondary text-foreground text-sm font-mono border border-border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">To Video Buyback Pool (%)</label>
            <p className="text-[9px] text-muted-foreground mb-1">Default: 30%</p>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              value={buybackPct}
              onChange={(e) => {
                setBuybackPct(e.target.value);
                setTreasuryPct(String(100 - (parseFloat(e.target.value) || 0)));
              }}
              className="w-full bg-secondary text-foreground text-sm font-mono border border-border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleSave} className="bg-primary text-primary-foreground px-4 py-2 rounded text-xs font-bold hover:bg-primary/90 transition-colors">
            Save Fee Settings
          </button>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Percent className="w-3 h-3" />
            <span>Current: {(settings as any)?.brokerage_fee_pct ?? 0.5}% per trade</span>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <h3 className="text-xs font-bold text-card-foreground uppercase mb-3">Fee Breakdown Preview</h3>
        <p className="text-[10px] text-muted-foreground mb-2">Example: $1,000 trade</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-secondary rounded p-3">
            <p className="text-lg font-mono font-bold text-foreground">${(1000 * parseFloat(brokeragePct || "0") / 100).toFixed(2)}</p>
            <p className="text-[9px] text-muted-foreground">Total Fee</p>
          </div>
          <div className="bg-secondary rounded p-3">
            <p className="text-lg font-mono font-bold text-[hsl(var(--ticker-up))]">
              ${(1000 * parseFloat(brokeragePct || "0") / 100 * parseFloat(treasuryPct || "0") / 100).toFixed(2)}
            </p>
            <p className="text-[9px] text-muted-foreground">To Treasury</p>
          </div>
          <div className="bg-secondary rounded p-3">
            <p className="text-lg font-mono font-bold text-primary">
              ${(1000 * parseFloat(brokeragePct || "0") / 100 * parseFloat(buybackPct || "0") / 100).toFixed(2)}
            </p>
            <p className="text-[9px] text-muted-foreground">To Buyback</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTradingFees;
