import { useMemo, useState } from "react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useDividendPayouts, useWallet, useHoldings, useWithdrawals } from "@/hooks/useDividends";
import { Navigate, Link } from "react-router-dom";
import { Wallet, TrendingUp, Shield, ArrowLeft, FileText, BarChart3, ArrowDownToLine, RefreshCw, ArrowUpFromLine } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import DashboardSummary from "@/components/dashboard/DashboardSummary";
import WithdrawModal from "@/components/dashboard/WithdrawModal";
import ReinvestModal from "@/components/dashboard/ReinvestModal";
import EarningsLedger from "@/components/dashboard/EarningsLedger";
import DepositModal from "@/components/dashboard/DepositModal";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { data: payouts, isLoading: payoutsLoading } = useDividendPayouts();
  const { data: wallet, refetch: refetchWallet } = useWallet();
  const { data: holdings } = useHoldings();
  const { data: withdrawals } = useWithdrawals();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [reinvestOpen, setReinvestOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);

  const monthlyData = useMemo(() => {
    if (!payouts) return [];
    const map = new Map<string, number>();
    payouts.forEach((p) => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + Number(p.amount));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, total]) => ({ month, total: Number(total.toFixed(2)) }));
  }, [payouts]);

  const totalEarnings = payouts?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const totalShares = holdings?.reduce((s, h) => s + h.quantity, 0) ?? 0;
  const totalWithdrawn = withdrawals?.reduce((s, w) => s + Number(w.amount), 0) ?? 0;
  const balance = wallet?.balance ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Dashboard" description="Your HASHPO earnings dashboard — view dividends, wallet balance, and portfolio performance." noIndex />
      <Header />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} balance={balance} onSuccess={refetchWallet} />
      <ReinvestModal open={reinvestOpen} onClose={() => setReinvestOpen(false)} balance={balance} onSuccess={refetchWallet} />
      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} onSuccess={refetchWallet} />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Exchange
        </Link>

        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-extrabold text-foreground uppercase tracking-wide">
            Investor Dashboard
          </h1>
        </div>

        <DashboardSummary balance={balance} totalEarnings={totalEarnings} totalShares={totalShares} totalWithdrawn={totalWithdrawn} />

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setDepositOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--ticker-up))] text-white font-bold text-xs rounded-md hover:opacity-90 transition-opacity"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            Deposit USDC
          </button>
          <button
            onClick={() => setWithdrawOpen(true)}
            disabled={balance < 2}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Withdraw to Wallet
          </button>
          <button
            onClick={() => setReinvestOpen(true)}
            disabled={balance < 1}
            className="flex items-center gap-2 px-4 py-2 gold-bg font-bold text-xs rounded-md hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <RefreshCw className="w-4 h-4" />
            Reinvest Dividends
          </button>
        </div>

        {/* Monthly Chart */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-bold text-card-foreground uppercase flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Renda Passiva Mensal
          </h2>
          {monthlyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: "JetBrains Mono",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Dividendos"]}
                  />
                  <Bar dataKey="total" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-8 text-center">
              Nenhum dividendo recebido ainda. Compre shares para começar a receber renda passiva.
            </p>
          )}
        </div>

        <EarningsLedger payouts={payouts} payoutsLoading={payoutsLoading} />
      </div>
    </div>
  );
};

export default Dashboard;
