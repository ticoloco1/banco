import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "sonner";
import type { Video } from "@/hooks/useVideos";

interface OrderBookProps {
  video: Video;
  onKycRequired: () => void;
}

/** Generate mock order book data around the share price */
const generateOrders = (price: number, side: "buy" | "sell", count = 8) => {
  const orders: { price: number; qty: number; total: number }[] = [];
  let cumQty = 0;
  for (let i = 0; i < count; i++) {
    const offset = (i + 1) * price * (0.005 + Math.random() * 0.01);
    const p = side === "buy" ? price - offset : price + offset;
    const qty = Math.floor(5 + Math.random() * 50);
    cumQty += qty;
    orders.push({ price: Math.max(0.01, p), qty, total: cumQty });
  }
  return orders;
};

const OrderBook = ({ video, onKycRequired }: OrderBookProps) => {
  const { user, kycVerified } = useAuth();
  const { data: settings } = useSettings();
  const tradingPaused = (settings as any)?.trading_paused ?? false;
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [orderType, setOrderType] = useState<"limit" | "market">("market");
  const [limitPrice, setLimitPrice] = useState(video.share_price.toFixed(2));

  const buyOrders = useMemo(() => generateOrders(video.share_price, "buy"), [video.share_price]);
  const sellOrders = useMemo(() => generateOrders(video.share_price, "sell"), [video.share_price]);

  const maxBuyQty = Math.max(...buyOrders.map(o => o.total));
  const maxSellQty = Math.max(...sellOrders.map(o => o.total));

  const handleSubmit = () => {
    if (!user) { toast.error("Connect wallet to trade"); return; }
    if (tradingPaused) { toast.error("⚠️ Trading is paused due to sanctions compliance"); return; }
    if (!kycVerified) { onKycRequired(); return; }
    if (!amount || Number(amount) <= 0) { toast.error("Enter a valid quantity"); return; }
    const qty = Number(amount);
    const price = orderType === "market" ? video.share_price : Number(limitPrice);
    const total = qty * price;
    if (tab === "buy") {
      toast.success(`Buy order placed: ${qty} shares @ $${price.toFixed(2)} = $${total.toFixed(2)} USDC`);
    } else {
      toast.success(`Sell order placed: ${qty} shares @ $${price.toFixed(2)} = $${total.toFixed(2)} USDC`);
    }
    setAmount("");
  };

  const percentages = [25, 50, 75, 100];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Tab header */}
      <div className="flex">
        <button
          onClick={() => setTab("buy")}
          className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
            tab === "buy"
              ? "bg-[#0ECB81] text-white"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setTab("sell")}
          className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
            tab === "sell"
              ? "bg-[#F6465D] text-white"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Sell
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] divide-x divide-border">
        {/* Order Book */}
        <div className="p-3 space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground uppercase mb-1.5">
            <span>Price (USDC)</span>
            <span>Qty</span>
            <span>Total</span>
          </div>

          {/* Sell orders (reversed - highest on top) */}
          <div className="space-y-0.5">
            {[...sellOrders].reverse().map((o, i) => (
              <div key={`sell-${i}`} className="relative flex items-center justify-between text-[10px] font-mono py-0.5 px-1 rounded">
                <div
                  className="absolute inset-0 bg-[#F6465D]/10 rounded"
                  style={{ width: `${(o.total / maxSellQty) * 100}%`, right: 0, left: "auto" }}
                />
                <span className="text-[#F6465D] font-bold relative z-10">${o.price.toFixed(2)}</span>
                <span className="text-foreground relative z-10">{o.qty}</span>
                <span className="text-muted-foreground relative z-10">{o.total}</span>
              </div>
            ))}
          </div>

          {/* Current price */}
          <div className="flex items-center justify-center py-1.5 my-1 border-y border-border">
            <span className="text-lg font-mono font-extrabold text-foreground">${video.share_price.toFixed(2)}</span>
            <span className="text-[9px] text-muted-foreground ml-1">USDC</span>
          </div>

          {/* Buy orders */}
          <div className="space-y-0.5">
            {buyOrders.map((o, i) => (
              <div key={`buy-${i}`} className="relative flex items-center justify-between text-[10px] font-mono py-0.5 px-1 rounded">
                <div
                  className="absolute inset-0 bg-[#0ECB81]/10 rounded"
                  style={{ width: `${(o.total / maxBuyQty) * 100}%`, right: 0, left: "auto" }}
                />
                <span className="text-[#0ECB81] font-bold relative z-10">${o.price.toFixed(2)}</span>
                <span className="text-foreground relative z-10">{o.qty}</span>
                <span className="text-muted-foreground relative z-10">{o.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order form */}
        <div className="p-3 space-y-3">
          {/* Order type */}
          <div className="flex gap-1 bg-secondary rounded p-0.5">
            {(["market", "limit"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={`flex-1 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                  orderType === t
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Limit price (only for limit orders) */}
          {orderType === "limit" && (
            <div>
              <label className="text-[9px] text-muted-foreground uppercase font-bold mb-1 block">Price (USDC)</label>
              <input
                type="number"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground"
              />
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="text-[9px] text-muted-foreground uppercase font-bold mb-1 block">Quantity (Shares)</label>
            <input
              type="number"
              min="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground"
            />
          </div>

          {/* Quick percentage buttons */}
          <div className="flex gap-1">
            {percentages.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(String(Math.floor((video.total_shares * p) / 100)))}
                className="flex-1 text-[9px] font-bold py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                {p}%
              </button>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between text-xs border-t border-border pt-2">
            <span className="text-muted-foreground">Total</span>
            <span className="font-mono font-bold text-foreground">
              ${((Number(amount) || 0) * (orderType === "market" ? video.share_price : Number(limitPrice) || 0)).toFixed(2)} USDC
            </span>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!video.exchange_active || tradingPaused}
            className={`w-full py-2.5 rounded-md font-bold text-sm text-white transition-colors disabled:opacity-40 ${
              tab === "buy"
                ? "bg-[#0ECB81] hover:bg-[#0ECB81]/90"
                : "bg-[#F6465D] hover:bg-[#F6465D]/90"
            }`}
          >
            {tradingPaused
              ? "⚠️ Trading Paused (Sanctions)"
              : !video.exchange_active
              ? "Exchange Paused"
              : tab === "buy"
              ? `Buy ${video.ticker}`
              : `Sell ${video.ticker}`}
          </button>

          <p className="text-[7px] text-muted-foreground/60 text-center">
            Fees: 0% maker / 0.1% taker • Settlement: Polygon USDC
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
