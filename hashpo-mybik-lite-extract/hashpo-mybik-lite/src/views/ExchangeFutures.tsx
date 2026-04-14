import { useState, useMemo } from "react";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import {
  useFuturesContracts,
  useFuturesPositions,
  useFuturesOrders,
  useRiskLimits,
  generateMockCandles,
  generateMockFuturesOrderbook,
  generateMockRecentTrades,
} from "@/hooks/useExchange";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart } from "recharts";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ExchangeFutures = () => {
  const { user, kycVerified } = useAuth();
  const { data: contracts } = useFuturesContracts();
  const { data: positions } = useFuturesPositions();
  const { data: orders } = useFuturesOrders();
  const { data: riskLimits } = useRiskLimits();

  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);

  // Order form
  const [side, setSide] = useState<"long" | "short">("long");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const selectedContract = useMemo(() => {
    if (!contracts || !selectedContractId) return contracts?.[0] || null;
    return contracts.find((c: any) => c.id === selectedContractId) || contracts[0] || null;
  }, [contracts, selectedContractId]);

  const basePrice = selectedContract ? Number(selectedContract.last_price) || 1000 : 1000;
  const candles = useMemo(() => generateMockCandles(basePrice), [basePrice]);
  const orderbook = useMemo(() => generateMockFuturesOrderbook(basePrice), [basePrice]);
  const recentTrades = useMemo(() => generateMockRecentTrades(basePrice), [basePrice]);

  const maxBid = Math.max(...orderbook.bids.map((o) => o.total));
  const maxAsk = Math.max(...orderbook.asks.map((o) => o.total));

  const handlePlaceOrder = () => {
    if (!user) { toast.error("Connect wallet to trade"); return; }
    if (!kycVerified) { toast.error("KYC verification required"); return; }
    if (!riskAccepted) { setShowRiskModal(true); return; }
    if (!quantity || Number(quantity) <= 0) { toast.error("Enter a valid quantity"); return; }

    const execPrice = orderType === "market" ? basePrice : Number(price) || basePrice;
    const qty = Number(quantity);
    const margin = execPrice * qty * (Number(selectedContract?.initial_margin_pct || 10) / 100);
    const fee = execPrice * qty * (Number(selectedContract?.fee_open_pct || 0.1) / 100);

    toast.success(`${side.toUpperCase()} order placed: ${qty} contracts @ ${execPrice.toFixed(2)} | Margin: $${margin.toFixed(2)} | Fee: $${fee.toFixed(2)}`);
    setQuantity("");
  };

  const estimatedMargin = (() => {
    const execPrice = orderType === "market" ? basePrice : Number(price) || basePrice;
    const qty = Number(quantity) || 0;
    return execPrice * qty * (Number(selectedContract?.initial_margin_pct || 10) / 100);
  })();

  const estimatedFee = (() => {
    const execPrice = orderType === "market" ? basePrice : Number(price) || basePrice;
    const qty = Number(quantity) || 0;
    return execPrice * qty * (Number(selectedContract?.fee_open_pct || 0.1) / 100);
  })();

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Futures Trading" description="Trade perpetual futures contracts on creator content assets with up to 10x leverage on HASHPO." />
      <Header />

      {/* Risk Modal */}
      {showRiskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm">Risk Disclaimer</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Futures are high risk. Losses can exceed your initial margin. This is not regulated investment advice.
              You may lose all deposited funds. Only trade with capital you can afford to lose.
            </p>
            <label className="flex items-start gap-2 text-xs text-foreground">
              <input type="checkbox" checked={riskAccepted} onChange={(e) => setRiskAccepted(e.target.checked)} className="mt-0.5" />
              I understand leveraged trading risk and accept full responsibility.
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowRiskModal(false)} className="flex-1 bg-secondary text-foreground py-2 rounded text-xs font-bold">Cancel</button>
              <button
                onClick={() => { if (riskAccepted) { setShowRiskModal(false); handlePlaceOrder(); } }}
                disabled={!riskAccepted}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded text-xs font-bold disabled:opacity-40"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/exchange" className="text-xs text-primary hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to Exchange
          </Link>
          {riskLimits?.trading_paused && (
            <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-1 rounded">⚠ TRADING PAUSED</span>
          )}
        </div>

        {/* Contract selector */}
        <div className="flex gap-2">
          {(contracts || []).map((c: any) => (
            <button
              key={c.id}
              onClick={() => setSelectedContractId(c.id)}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-colors ${
                (selectedContract?.id === c.id) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.symbol}
            </button>
          ))}
        </div>

        {selectedContract && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
            {/* Left: Chart + Order Book + Trades */}
            <div className="space-y-4">
              {/* Candlestick Chart (simplified as bar+line) */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-foreground font-mono">{selectedContract.symbol}</h3>
                  <span className="text-lg font-mono font-extrabold text-foreground">{basePrice.toFixed(2)}</span>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={candles}>
                      <XAxis dataKey="date" tick={{ fontSize: 8 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis domain={["auto", "auto"]} tick={{ fontSize: 8 }} width={45} />
                      <Tooltip contentStyle={{ fontSize: 10, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="volume" fill="hsl(var(--muted))" opacity={0.3} yAxisId="volume" />
                      <Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Order Book */}
                <div className="bg-card border border-border rounded-lg p-3">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Order Book</h4>
                  <div className="flex text-[9px] font-mono text-muted-foreground uppercase mb-1 justify-between px-1">
                    <span>Price</span><span>Qty</span><span>Total</span>
                  </div>
                  {/* Asks */}
                  <div className="space-y-0.5 mb-1">
                    {[...orderbook.asks].reverse().map((o, i) => (
                      <div key={`a-${i}`} className="relative flex justify-between text-[10px] font-mono py-0.5 px-1 rounded">
                        <div className="absolute inset-0 bg-[hsl(var(--ticker-down))]/10 rounded" style={{ width: `${(o.total / maxAsk) * 100}%`, right: 0, left: "auto" }} />
                        <span className="text-[hsl(var(--ticker-down))] font-bold relative z-10">{o.price.toFixed(2)}</span>
                        <span className="relative z-10 text-foreground">{o.qty}</span>
                        <span className="relative z-10 text-muted-foreground">{o.total}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center py-1 border-y border-border">
                    <span className="text-sm font-mono font-extrabold text-foreground">{basePrice.toFixed(2)}</span>
                  </div>
                  {/* Bids */}
                  <div className="space-y-0.5 mt-1">
                    {orderbook.bids.map((o, i) => (
                      <div key={`b-${i}`} className="relative flex justify-between text-[10px] font-mono py-0.5 px-1 rounded">
                        <div className="absolute inset-0 bg-[hsl(var(--ticker-up))]/10 rounded" style={{ width: `${(o.total / maxBid) * 100}%`, right: 0, left: "auto" }} />
                        <span className="text-[hsl(var(--ticker-up))] font-bold relative z-10">{o.price.toFixed(2)}</span>
                        <span className="relative z-10 text-foreground">{o.qty}</span>
                        <span className="relative z-10 text-muted-foreground">{o.total}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Trades */}
                <div className="bg-card border border-border rounded-lg p-3">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Recent Trades</h4>
                  <div className="flex text-[9px] font-mono text-muted-foreground uppercase mb-1 justify-between px-1">
                    <span>Time</span><span>Price</span><span>Size</span>
                  </div>
                  <div className="space-y-0.5 max-h-64 overflow-y-auto">
                    {recentTrades.map((t, i) => (
                      <div key={i} className="flex justify-between text-[10px] font-mono py-0.5 px-1">
                        <span className="text-muted-foreground">{t.time}</span>
                        <span className={t.side === "buy" ? "text-[hsl(var(--ticker-up))] font-bold" : "text-[hsl(var(--ticker-down))] font-bold"}>{t.price.toFixed(2)}</span>
                        <span className="text-foreground">{t.size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Order Entry + Positions */}
            <div className="space-y-4">
              {/* Order Entry */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="flex">
                  <button onClick={() => setSide("long")} className={`flex-1 py-2.5 text-sm font-bold transition-colors ${side === "long" ? "bg-[hsl(var(--ticker-up))] text-white" : "bg-secondary text-muted-foreground"}`}>
                    Long
                  </button>
                  {selectedContract.short_enabled && (
                    <button onClick={() => setSide("short")} className={`flex-1 py-2.5 text-sm font-bold transition-colors ${side === "short" ? "bg-[hsl(var(--ticker-down))] text-white" : "bg-secondary text-muted-foreground"}`}>
                      Short
                    </button>
                  )}
                </div>

                <div className="p-3 space-y-3">
                  {/* Order type */}
                  <div className="flex gap-1 bg-secondary rounded p-0.5">
                    {(["market", "limit"] as const).map((t) => (
                      <button key={t} onClick={() => setOrderType(t)} className={`flex-1 py-1 rounded text-[10px] font-bold uppercase transition-colors ${orderType === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                        {t}
                      </button>
                    ))}
                  </div>

                  {orderType === "limit" && (
                    <div>
                      <label className="text-[9px] text-muted-foreground uppercase font-bold mb-1 block">Price</label>
                      <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={basePrice.toFixed(2)} className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground" />
                    </div>
                  )}

                  <div>
                    <label className="text-[9px] text-muted-foreground uppercase font-bold mb-1 block">Quantity (Contracts)</label>
                    <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground" />
                  </div>

                  <div className="space-y-1 text-[10px] border-t border-border pt-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Est. Margin</span><span className="font-mono font-bold text-foreground">${estimatedMargin.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Est. Fee</span><span className="font-mono font-bold text-foreground">${estimatedFee.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Leverage</span><span className="font-mono font-bold text-foreground">1x</span></div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={riskLimits?.trading_paused}
                    className={`w-full py-2.5 rounded-md font-bold text-sm text-white transition-colors disabled:opacity-40 ${side === "long" ? "bg-[hsl(var(--ticker-up))] hover:bg-[hsl(var(--ticker-up))]/90" : "bg-[hsl(var(--ticker-down))] hover:bg-[hsl(var(--ticker-down))]/90"}`}
                  >
                    {riskLimits?.trading_paused ? "Trading Paused" : `Place ${side.toUpperCase()} Order`}
                  </button>
                </div>
              </div>

              {/* Positions & Orders */}
              <div className="bg-card border border-border rounded-lg p-3">
                <Tabs defaultValue="positions" className="space-y-2">
                  <TabsList className="bg-secondary h-7">
                    <TabsTrigger value="positions" className="text-[10px]">Positions</TabsTrigger>
                    <TabsTrigger value="orders" className="text-[10px]">Orders</TabsTrigger>
                  </TabsList>

                  <TabsContent value="positions">
                    {(positions || []).length === 0 ? (
                      <p className="text-[10px] text-muted-foreground text-center py-4">No open positions</p>
                    ) : (
                      <div className="space-y-2">
                        {(positions || []).map((p: any) => (
                          <div key={p.id} className="border border-border rounded p-2 text-[10px] space-y-1">
                            <div className="flex justify-between">
                              <span className="font-mono font-bold text-foreground">{p.futures_contracts?.symbol}</span>
                              <span className={`font-bold ${p.side === "long" ? "text-[hsl(var(--ticker-up))]" : "text-[hsl(var(--ticker-down))]"}`}>{p.side.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Entry: ${Number(p.entry_price).toFixed(2)}</span>
                              <span>Qty: {Number(p.quantity)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">uPnL:</span>
                              <span className={`font-bold ${Number(p.unrealized_pnl) >= 0 ? "text-[hsl(var(--ticker-up))]" : "text-[hsl(var(--ticker-down))]"}`}>
                                ${Number(p.unrealized_pnl).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="orders">
                    {(orders || []).length === 0 ? (
                      <p className="text-[10px] text-muted-foreground text-center py-4">No orders</p>
                    ) : (
                      <div className="space-y-1">
                        {(orders || []).map((o: any) => (
                          <div key={o.id} className="flex justify-between text-[10px] font-mono border-b border-border/50 py-1">
                            <span className="text-foreground">{o.futures_contracts?.symbol}</span>
                            <span className={o.side === "long" ? "text-[hsl(var(--ticker-up))]" : "text-[hsl(var(--ticker-down))]"}>{o.side}</span>
                            <span className="text-muted-foreground">{o.order_type}</span>
                            <span className="text-foreground">{Number(o.quantity)}</span>
                            <span className={`font-bold ${o.status === "filled" ? "text-[hsl(var(--ticker-up))]" : "text-muted-foreground"}`}>{o.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Risk Disclaimer */}
              <div className="bg-destructive/5 border border-destructive/20 rounded p-2">
                <p className="text-[8px] text-destructive font-mono text-center">
                  ⚠ Futures are high risk. Losses can exceed expectations. Not regulated investment advice.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExchangeFutures;
