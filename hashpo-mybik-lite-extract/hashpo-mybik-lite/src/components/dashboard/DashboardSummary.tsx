import { Wallet, TrendingUp, Shield, ArrowDownToLine } from "lucide-react";

interface Props {
  balance: number;
  totalEarnings: number;
  totalShares: number;
  totalWithdrawn: number;
}

const DashboardSummary = ({ balance, totalEarnings, totalShares, totalWithdrawn }: Props) => (
  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
    <div className="bg-card border border-border rounded-lg p-4 space-y-1">
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold text-muted-foreground uppercase">Internal Balance</span>
      </div>
      <p className="text-2xl font-mono font-extrabold text-card-foreground">
        ${balance.toFixed(2)}
        <span className="text-xs text-muted-foreground ml-1">USDC</span>
      </p>
    </div>

    <div className="bg-card border border-border rounded-lg p-4 space-y-1">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 gold-text" />
        <span className="text-xs font-bold text-muted-foreground uppercase">Total Earnings</span>
      </div>
      <p className="text-2xl font-mono font-extrabold gold-text">
        ${totalEarnings.toFixed(2)}
      </p>
    </div>

    <div className="bg-card border border-border rounded-lg p-4 space-y-1">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold text-muted-foreground uppercase">Total Shares</span>
      </div>
      <p className="text-2xl font-mono font-extrabold text-card-foreground">
        {totalShares.toLocaleString()}
      </p>
    </div>

    <div className="bg-card border border-border rounded-lg p-4 space-y-1">
      <div className="flex items-center gap-2">
        <ArrowDownToLine className="w-4 h-4 text-destructive" />
        <span className="text-xs font-bold text-muted-foreground uppercase">Total Withdrawn</span>
      </div>
      <p className="text-2xl font-mono font-extrabold text-card-foreground">
        ${totalWithdrawn.toFixed(2)}
      </p>
    </div>
  </div>
);

export default DashboardSummary;
