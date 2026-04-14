import { useMemo } from "react";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { useVideos } from "@/hooks/useVideos";
import { useFuturesContracts, generateMockIndexHistory } from "@/hooks/useExchange";
import { TrendingUp, TrendingDown, BarChart3, Activity, ArrowRight } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const Exchange = () => {
  const { data: videos } = useVideos();
  const { data: contracts } = useFuturesContracts();

  const mockHistory = useMemo(() => generateMockIndexHistory(30), []);
  const currentHPI = mockHistory[mockHistory.length - 1]?.value ?? 1000;
  const prevHPI = mockHistory[mockHistory.length - 2]?.value ?? 1000;
  const change24h = ((currentHPI - prevHPI) / prevHPI) * 100;

  // Market movers: top gainers/losers among share-enabled videos
  const shareVideos = useMemo(() => {
    if (!videos) return [];
    return videos
      .filter((v) => v.shares_issued && v.exchange_active)
      .map((v) => ({
        ...v,
        change: ((Math.random() - 0.45) * 20), // mock change %
      }))
      .sort((a, b) => b.change - a.change);
  }, [videos]);

  const topGainers = shareVideos.filter((v) => v.change > 0).slice(0, 5);
  const topLosers = shareVideos.filter((v) => v.change < 0).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Exchange" description="Trade creator content shares on HASHPO's decentralised exchange. Real-time prices, order books, and dividends in USDC on Polygon." />
      <Header />

      {/* HPI Ticker Bar */}
      <div className="bg-card border-b border-border px-6 py-3 flex items-center gap-8 overflow-x-auto">
        <div className="flex items-center gap-3 min-w-fit">
          <span className="text-xs font-mono font-bold text-muted-foreground">HPI</span>
          <span className="text-xl font-mono font-extrabold text-foreground">{currentHPI.toFixed(2)}</span>
          <span className={`text-sm font-mono font-bold flex items-center gap-0.5 ${change24h >= 0 ? "text-[hsl(var(--ticker-up))]" : "text-[hsl(var(--ticker-down))]"}`}>
            {change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground min-w-fit">
          <span>Vol 24h: ${(Math.random() * 50000 + 10000).toFixed(0)}</span>
          <span>•</span>
          <span>Mkt Cap: ${(Math.random() * 500000 + 100000).toFixed(0)}</span>
          <span>•</span>
          <span>Constituents: {shareVideos.length}</span>
        </div>
        <div className="ml-auto flex gap-2 min-w-fit">
          <Link to="/exchange/index" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
            Index <ArrowRight className="w-3 h-3" />
          </Link>
          <Link to="/exchange/futures" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
            Futures <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Mini HPI Chart */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> HashPo Index (HPI)
            </h2>
            <Link to="/exchange/index" className="text-[10px] text-primary font-bold hover:underline">Full Chart →</Link>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockHistory}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9 }} width={50} />
                <Tooltip
                  contentStyle={{ fontSize: 11, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  formatter={(v: number) => [`${v.toFixed(2)}`, "HPI"]}
                />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Gainers */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-bold text-foreground uppercase flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[hsl(var(--ticker-up))]" /> Top Gainers
            </h3>
            {topGainers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No gainers to display</p>
            ) : (
              <div className="space-y-2">
                {topGainers.map((v) => (
                  <Link key={v.id} to={`/video/${v.id}`} className="flex items-center gap-3 p-2 rounded hover:bg-secondary transition-colors">
                    <img src={v.thumbnail_url || "/placeholder.svg"} alt="" className="w-10 h-7 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{v.ticker}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{v.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-foreground">${v.share_price.toFixed(2)}</p>
                      <p className="text-[10px] font-mono font-bold text-[hsl(var(--ticker-up))]">+{v.change.toFixed(1)}%</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Top Losers */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-bold text-foreground uppercase flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-[hsl(var(--ticker-down))]" /> Top Losers
            </h3>
            {topLosers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No losers to display</p>
            ) : (
              <div className="space-y-2">
                {topLosers.map((v) => (
                  <Link key={v.id} to={`/video/${v.id}`} className="flex items-center gap-3 p-2 rounded hover:bg-secondary transition-colors">
                    <img src={v.thumbnail_url || "/placeholder.svg"} alt="" className="w-10 h-7 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{v.ticker}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{v.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-foreground">${v.share_price.toFixed(2)}</p>
                      <p className="text-[10px] font-mono font-bold text-[hsl(var(--ticker-down))]">{v.change.toFixed(1)}%</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Futures Overview */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground uppercase flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Futures Contracts
            </h3>
            <Link to="/exchange/futures" className="text-[10px] text-primary font-bold hover:underline">Trade Futures →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 px-2 text-muted-foreground font-semibold">Symbol</th>
                  <th className="py-2 px-2 text-muted-foreground font-semibold">Expiry</th>
                  <th className="py-2 px-2 text-muted-foreground font-semibold">Last Price</th>
                  <th className="py-2 px-2 text-muted-foreground font-semibold">Open Interest</th>
                  <th className="py-2 px-2 text-muted-foreground font-semibold">Vol 24h</th>
                  <th className="py-2 px-2 text-muted-foreground font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {(contracts || []).map((c: any) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="py-2 px-2 font-mono font-bold text-foreground">{c.symbol}</td>
                    <td className="py-2 px-2 font-mono text-muted-foreground">{new Date(c.expiry_date).toLocaleDateString()}</td>
                    <td className="py-2 px-2 font-mono font-bold text-foreground">{Number(c.last_price).toFixed(2)}</td>
                    <td className="py-2 px-2 font-mono text-muted-foreground">${Number(c.open_interest).toFixed(0)}</td>
                    <td className="py-2 px-2 font-mono text-muted-foreground">${Number(c.volume_24h).toFixed(0)}</td>
                    <td className="py-2 px-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.enabled ? "bg-[hsl(var(--ticker-up))]/20 text-[hsl(var(--ticker-up))]" : "bg-muted text-muted-foreground"}`}>
                        {c.enabled ? "ACTIVE" : "PAUSED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Disclaimer */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
          <p className="text-[9px] text-destructive font-mono text-center">
            ⚠ Futures are high risk. Losses can exceed expectations. This is not regulated investment advice. All settlements in USDC on Polygon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Exchange;
