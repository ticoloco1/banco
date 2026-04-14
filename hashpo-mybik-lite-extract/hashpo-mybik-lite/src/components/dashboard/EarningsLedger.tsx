import { FileText } from "lucide-react";

interface Payout {
  id: string;
  created_at: string;
  source: string;
  amount: number;
  shares_held: number;
  polygon_hash: string | null;
  videos: { title: string; ticker: string; polygon_hash: string | null } | null;
}

interface Props {
  payouts: Payout[] | undefined;
  payoutsLoading: boolean;
}

const EarningsLedger = ({ payouts, payoutsLoading }: Props) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <h2 className="text-sm font-bold text-card-foreground uppercase flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        Extrato de Dividendos (Earnings Ledger)
      </h2>
      <p className="text-[9px] text-muted-foreground">
        Registros imutáveis vinculados ao contrato Polygon. Uma vez processados, os dividendos são permanentes.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 px-2 text-muted-foreground font-semibold">Data/Hora</th>
              <th className="py-2 px-2 text-muted-foreground font-semibold">Origem</th>
              <th className="py-2 px-2 text-muted-foreground font-semibold">Ativo</th>
              <th className="py-2 px-2 text-muted-foreground font-semibold">Polygon Hash</th>
              <th className="py-2 px-2 text-muted-foreground font-semibold">Shares</th>
              <th className="py-2 px-2 text-muted-foreground font-semibold text-right">Valor (USDC)</th>
            </tr>
          </thead>
          <tbody>
            {payoutsLoading ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : !payouts || payouts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted-foreground">
                  Nenhum dividendo recebido ainda.
                </td>
              </tr>
            ) : (
              payouts.map((p) => {
                const isJackpot = p.source.toLowerCase().includes("jackpot") || p.source.toLowerCase().includes("bonus");
                const video = p.videos as { title: string; ticker: string; polygon_hash: string | null } | null;
                return (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-2 px-2 font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(p.created_at).toLocaleString("pt-BR", {
                        day: "2-digit", month: "2-digit", year: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        isJackpot ? "bg-accent/20 text-accent-foreground" : "dividend-source"
                      }`}>
                        {p.source}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-card-foreground truncate max-w-[160px]">
                          {video?.title ?? "—"}
                        </span>
                        <span className="ticker-badge text-[8px] w-fit mt-0.5">
                          {video?.ticker ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      {p.polygon_hash ? (
                        <span className="font-mono text-[9px] text-muted-foreground truncate max-w-[120px] block">
                          {p.polygon_hash.slice(0, 10)}…{p.polygon_hash.slice(-6)}
                        </span>
                      ) : (
                        <span className="text-[9px] text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="py-2 px-2 font-mono text-card-foreground">
                      {p.shares_held}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <span className={`font-mono font-bold ${
                        isJackpot ? "text-accent-foreground" : "dividend-amount"
                      }`}>
                        +${Number(p.amount).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EarningsLedger;
