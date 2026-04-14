import { useState, useEffect } from "react";
import {
  useIndexSettings,
  useUpdateIndexSettings,
  useFuturesContracts,
  useUpdateFuturesContract,
  useRiskLimits,
  useUpdateRiskLimits,
} from "@/hooks/useExchange";
import { Activity, Shield, BarChart3, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const AdminIndexDerivatives = () => {
  const { data: indexSettings } = useIndexSettings();
  const updateIndex = useUpdateIndexSettings();
  const { data: contracts } = useFuturesContracts();
  const updateContract = useUpdateFuturesContract();
  const { data: riskLimits } = useRiskLimits();
  const updateRisk = useUpdateRiskLimits();

  // Index form state
  const [indexForm, setIndexForm] = useState({
    enabled: true,
    min_age_days: 30,
    min_avg_monthly_revenue: 50,
    min_trading_volume_30d: 500,
    weight_market_cap: 50,
    weight_revenue: 30,
    weight_volume: 10,
    weight_engagement: 10,
    update_interval_seconds: 300,
    divisor: 1,
  });

  // Risk form state
  const [riskForm, setRiskForm] = useState({
    max_position_per_user: 10000,
    global_exposure_limit: 1000000,
    circuit_breaker_pct: 10,
    circuit_breaker_window_minutes: 5,
    trading_paused: false,
    mock_mode: true,
  });

  useEffect(() => {
    if (indexSettings) {
      setIndexForm({
        enabled: indexSettings.enabled,
        min_age_days: indexSettings.min_age_days,
        min_avg_monthly_revenue: Number(indexSettings.min_avg_monthly_revenue),
        min_trading_volume_30d: Number(indexSettings.min_trading_volume_30d),
        weight_market_cap: Number(indexSettings.weight_market_cap),
        weight_revenue: Number(indexSettings.weight_revenue),
        weight_volume: Number(indexSettings.weight_volume),
        weight_engagement: Number(indexSettings.weight_engagement),
        update_interval_seconds: indexSettings.update_interval_seconds,
        divisor: Number(indexSettings.divisor),
      });
    }
  }, [indexSettings]);

  useEffect(() => {
    if (riskLimits) {
      setRiskForm({
        max_position_per_user: Number(riskLimits.max_position_per_user),
        global_exposure_limit: Number(riskLimits.global_exposure_limit),
        circuit_breaker_pct: Number(riskLimits.circuit_breaker_pct),
        circuit_breaker_window_minutes: riskLimits.circuit_breaker_window_minutes,
        trading_paused: riskLimits.trading_paused,
        mock_mode: riskLimits.mock_mode,
      });
    }
  }, [riskLimits]);

  const handleSaveIndex = () => {
    const totalWeight = indexForm.weight_market_cap + indexForm.weight_revenue + indexForm.weight_volume + indexForm.weight_engagement;
    if (Math.abs(totalWeight - 100) > 0.01) {
      toast.error(`Weights must total 100%. Current: ${totalWeight}%`);
      return;
    }
    updateIndex.mutate(indexForm as any);
    toast.success("Index settings updated!");
  };

  const handleSaveRisk = () => {
    updateRisk.mutate(riskForm as any);
    toast.success("Risk limits updated!");
  };

  const handleToggleContract = (id: string, enabled: boolean) => {
    updateContract.mutate({ id, enabled: !enabled });
    toast.success(`Contract ${enabled ? "disabled" : "enabled"}`);
  };

  const handleToggleShort = (id: string, shortEnabled: boolean) => {
    updateContract.mutate({ id, short_enabled: !shortEnabled });
    toast.success(`Short trading ${shortEnabled ? "disabled" : "enabled"}`);
  };

  const NumberInput = ({ label, value, onChange, step = "1", min, max }: { label: string; value: number; onChange: (v: number) => void; step?: string; min?: string; max?: string }) => (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input type="number" step={step} min={min} max={max} value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-full bg-secondary text-foreground text-sm font-mono border border-border rounded px-3 py-2" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Index Settings */}
      <div className="border border-border rounded-lg p-4 bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-card-foreground uppercase">Index Settings (HPI)</h2>
          </div>
          <button
            onClick={() => { setIndexForm(f => ({ ...f, enabled: !f.enabled })); }}
            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors ${indexForm.enabled ? "bg-[hsl(var(--ticker-up))] text-white" : "bg-muted text-muted-foreground"}`}
          >
            {indexForm.enabled ? "ENABLED" : "DISABLED"}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumberInput label="Min Age (days)" value={indexForm.min_age_days} onChange={(v) => setIndexForm(f => ({ ...f, min_age_days: v }))} />
          <NumberInput label="Min Monthly Rev ($)" value={indexForm.min_avg_monthly_revenue} onChange={(v) => setIndexForm(f => ({ ...f, min_avg_monthly_revenue: v }))} />
          <NumberInput label="Min Volume 30d ($)" value={indexForm.min_trading_volume_30d} onChange={(v) => setIndexForm(f => ({ ...f, min_trading_volume_30d: v }))} />
          <NumberInput label="Update Interval (s)" value={indexForm.update_interval_seconds} onChange={(v) => setIndexForm(f => ({ ...f, update_interval_seconds: v }))} />
        </div>

        <div>
          <p className="text-xs font-bold text-card-foreground mb-2">Weight Distribution (must = 100%)</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumberInput label="Market Cap %" value={indexForm.weight_market_cap} onChange={(v) => setIndexForm(f => ({ ...f, weight_market_cap: v }))} />
            <NumberInput label="Revenue %" value={indexForm.weight_revenue} onChange={(v) => setIndexForm(f => ({ ...f, weight_revenue: v }))} />
            <NumberInput label="Volume %" value={indexForm.weight_volume} onChange={(v) => setIndexForm(f => ({ ...f, weight_volume: v }))} />
            <NumberInput label="Engagement %" value={indexForm.weight_engagement} onChange={(v) => setIndexForm(f => ({ ...f, weight_engagement: v }))} />
          </div>
          <p className="text-[9px] text-muted-foreground mt-1">
            Total: {indexForm.weight_market_cap + indexForm.weight_revenue + indexForm.weight_volume + indexForm.weight_engagement}%
          </p>
        </div>

        <NumberInput label="Divisor" value={indexForm.divisor} onChange={(v) => setIndexForm(f => ({ ...f, divisor: v }))} step="0.001" />

        <button onClick={handleSaveIndex} className="bg-primary text-primary-foreground px-4 py-2 rounded text-xs font-bold hover:bg-primary/90">
          Save Index Settings
        </button>
      </div>

      {/* Futures Contracts */}
      <div className="border border-border rounded-lg p-4 bg-card space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-card-foreground uppercase">Futures Contracts</h2>
        </div>

        <div className="space-y-3">
          {(contracts || []).map((c: any) => (
            <div key={c.id} className="border border-border rounded-lg p-3 bg-secondary/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-foreground text-sm">{c.symbol}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleShort(c.id, c.short_enabled)}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded transition-colors ${c.short_enabled ? "bg-[hsl(var(--ticker-down))] text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    Short: {c.short_enabled ? "ON" : "OFF"}
                  </button>
                  <button
                    onClick={() => handleToggleContract(c.id, c.enabled)}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded transition-colors ${c.enabled ? "bg-[hsl(var(--ticker-up))] text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    {c.enabled ? "ACTIVE" : "PAUSED"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-[10px]">
                <div><span className="text-muted-foreground block">Expiry</span><span className="font-mono text-foreground">{new Date(c.expiry_date).toLocaleDateString()}</span></div>
                <div><span className="text-muted-foreground block">Multiplier</span><span className="font-mono text-foreground">{Number(c.contract_multiplier)}</span></div>
                <div><span className="text-muted-foreground block">Init Margin</span><span className="font-mono text-foreground">{Number(c.initial_margin_pct)}%</span></div>
                <div><span className="text-muted-foreground block">Maint Margin</span><span className="font-mono text-foreground">{Number(c.maintenance_margin_pct)}%</span></div>
                <div><span className="text-muted-foreground block">Fee Open</span><span className="font-mono text-foreground">{Number(c.fee_open_pct)}%</span></div>
                <div><span className="text-muted-foreground block">Max Leverage</span><span className="font-mono text-foreground">{c.max_leverage}x</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Limits */}
      <div className="border border-border rounded-lg p-4 bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-card-foreground uppercase">Risk Limits & Circuit Breakers</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setRiskForm(f => ({ ...f, mock_mode: !f.mock_mode }))}
              className={`px-2 py-0.5 text-[9px] font-bold rounded transition-colors ${riskForm.mock_mode ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}
            >
              {riskForm.mock_mode ? "MOCK MODE" : "LIVE MODE"}
            </button>
            <button
              onClick={() => setRiskForm(f => ({ ...f, trading_paused: !f.trading_paused }))}
              className={`px-2 py-0.5 text-[9px] font-bold rounded transition-colors ${riskForm.trading_paused ? "bg-destructive text-destructive-foreground" : "bg-[hsl(var(--ticker-up))] text-white"}`}
            >
              {riskForm.trading_paused ? "⚠ PAUSED" : "TRADING ACTIVE"}
            </button>
          </div>
        </div>

        {riskForm.trading_paused && (
          <div className="bg-destructive/10 border border-destructive/30 rounded p-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <p className="text-[10px] text-destructive font-bold">Futures trading is currently PAUSED for all users.</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumberInput label="Max Position/User ($)" value={riskForm.max_position_per_user} onChange={(v) => setRiskForm(f => ({ ...f, max_position_per_user: v }))} />
          <NumberInput label="Global Exposure ($)" value={riskForm.global_exposure_limit} onChange={(v) => setRiskForm(f => ({ ...f, global_exposure_limit: v }))} />
          <NumberInput label="Circuit Breaker (%)" value={riskForm.circuit_breaker_pct} onChange={(v) => setRiskForm(f => ({ ...f, circuit_breaker_pct: v }))} step="0.5" />
          <NumberInput label="CB Window (min)" value={riskForm.circuit_breaker_window_minutes} onChange={(v) => setRiskForm(f => ({ ...f, circuit_breaker_window_minutes: v }))} />
        </div>

        <button onClick={handleSaveRisk} className="bg-primary text-primary-foreground px-4 py-2 rounded text-xs font-bold hover:bg-primary/90">
          Save Risk Settings
        </button>
      </div>
    </div>
  );
};

export default AdminIndexDerivatives;
