import { useMemo, useState } from "react";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { useVideos } from "@/hooks/useVideos";
import { useIndexSettings, generateMockIndexHistory } from "@/hooks/useExchange";
import { TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from "recharts";

const timeframes = ["1D", "7D", "1M", "3M", "1Y"] as const;
const daysMap: Record<string, number> = { "1D": 1, "7D": 7, "1M": 30, "3M": 90, "1Y": 365 };

const ExchangeIndex = () => {
  const [tf, setTf] = useState<string>("1M");
  const { data: indexSettings } = useIndexSettings();
  const { data: videos } = useVideos();

  const mockHistory = useMemo(() => generateMockIndexHistory(daysMap[tf] || 30), [tf]);
  const currentHPI = mockHistory[mockHistory.length - 1]?.value ?? 1000;
  const firstHPI = mockHistory[0]?.value ?? 1000;
  const changePct = ((currentHPI - firstHPI) / firstHPI) * 100;
  const isUp = changePct >= 0;

  // Constituents: share-enabled videos as mock index members
  const constituents = useMemo(() => {
    if (!videos) return [];
    return videos
      .filter((v) => v.shares_issued && v.exchange_active)
      .map((v) => {
        const marketCap = v.share_price * v.total_shares;
        return {
          ...v,
          marketCap,
          revenue30d: v.revenue || 0,
          volume30d: Math.random() * 5000,
          weight: 0,
        };
      })
      .sort((a, b) => b.marketCap - a.marketCap)
      .map((v, _, arr) => {
        const totalMcap = arr.reduce((s, x) => s + x.marketCap, 0) || 1;
        return { ...v, weight: (v.marketCap / totalMcap) * 100 };
      });
  }, [videos]);

  const totalMarketCap = constituents.reduce((s, c) => s + c.marketCap, 0);
  const totalVolume = constituents.reduce((s, c) => s + c.volume30d, 0);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="HashPo Index (HPI)" description="Track the HashPo Index — a market-cap-weighted index of top creator content assets on HASHPO." />
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <Link to="/exchange" className="text-xs text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Back to Exchange
        </Link>

        {/* HPI Hero */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">HashPo Index</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-mono font-extrabold text-foreground">{currentHPI.toFixed(2)}</span>
                <span className={`text-lg font-mono font-bold flex items-center gap-1 ${isUp ? "text-[hsl(var(--ticker-up))]" : "text-[hsl(var(--ticker-down))]"}`}>
                  {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {isUp ? "+" : ""}{changePct.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="flex gap-4 text-[10px] font-mono text-muted-foreground md:ml-auto">
              <div><span className="block text-foreground font-bold">${totalMarketCap.toLocaleString("en", { maximumFractionDigits: 0 })}</span>Total Mkt Cap</div>
              <div><span className="block text-foreground font-bold">${totalVolume.toLocaleString("en", { maximumFractionDigits: 0 })}</span>Volume 30d</div>
              <div><span className="block text-foreground font-bold">{constituents.length}</span>Constituents</div>
            </div>
          </div>

          {/* Timeframe selector */}
          <div className="flex gap-1 mb-3">
            {timeframes.map((t) => (
              <button key={t} onClick={() => setTf(t)} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${tf === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockHistory}>
                <defs>
                  <linearGradient id="hpiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9 }} width={50} />
                <Tooltip contentStyle={{ fontSize: 11, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} formatter={(v: number) => [`${v.toFixed(2)}`, "HPI"]} />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#hpiGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Constituents Table */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-bold text-foreground uppercase mb-3">Index Constituents</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 px-2 text-muted-foreground font-semibold">#</th>
                  <th className="py-2 px-2 text-muted-foreground font-semibold">Asset</th>
                  <th className="py-2 px-2 text-muted-foreground font-semibold">Price</th>
                  <th className="py-2 px-2 text-muted-foreground font-semibold">Mkt Cap</th>
                  <th className="py-2 px-2 text-muted-foreground font-semibold">Rev 30d</th>
                  <th className="py-2 px-2 text-muted-foreground font-semibold">Vol 30d</th>
                  <th className="py-2 px-2 text-muted-foreground font-semibold">Weight</th>
                </tr>
              </thead>
              <tbody>
                {constituents.map((c, i) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="py-2 px-2 font-mono text-muted-foreground">{i + 1}</td>
                    <td className="py-2 px-2">
                      <Link to={`/video/${c.id}`} className="flex items-center gap-2 hover:underline">
                        <img src={c.thumbnail_url || "/placeholder.svg"} alt="" className="w-8 h-5 rounded object-cover" />
                        <div>
                          <p className="font-bold text-foreground">{c.ticker}</p>
                          <p className="text-[9px] text-muted-foreground truncate max-w-[120px]">{c.title}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-2 px-2 font-mono font-bold text-foreground">${c.share_price.toFixed(2)}</td>
                    <td className="py-2 px-2 font-mono text-muted-foreground">${c.marketCap.toLocaleString("en", { maximumFractionDigits: 0 })}</td>
                    <td className="py-2 px-2 font-mono text-muted-foreground">${c.revenue30d.toFixed(0)}</td>
                    <td className="py-2 px-2 font-mono text-muted-foreground">${c.volume30d.toFixed(0)}</td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1">
                        <div className="w-16 bg-secondary rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(c.weight, 100)}%` }} />
                        </div>
                        <span className="font-mono text-muted-foreground">{c.weight.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {constituents.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No eligible constituents yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeIndex;
