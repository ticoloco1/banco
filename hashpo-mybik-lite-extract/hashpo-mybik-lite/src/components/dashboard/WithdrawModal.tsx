import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAccount } from "wagmi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  balance: number;
  onSuccess: () => void;
}

const WITHDRAW_FEE = 1; // 1 USDC gas fee

const WithdrawModal = ({ open, onClose, balance, onSuccess }: Props) => {
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [processing, setProcessing] = useState(false);
  const { address: connectedAddr } = useAccount();

  // Auto-fill from connected wallet
  useEffect(() => {
    if (connectedAddr && !walletAddress) setWalletAddress(connectedAddr);
  }, [connectedAddr]);

  const numAmount = parseFloat(amount) || 0;
  const netAmount = numAmount - WITHDRAW_FEE;
  const canWithdraw = numAmount >= 2 && numAmount <= balance && walletAddress.length > 10;

  const handleWithdraw = async () => {
    if (!canWithdraw) return;
    setProcessing(true);
    try {
      // Debit wallet
      const { error: walletErr } = await supabase
        .from("wallets")
        .update({ balance: balance - numAmount })
        .eq("user_id", (await supabase.auth.getUser()).data.user!.id);
      if (walletErr) throw walletErr;

      // Record withdrawal
      const { error: wErr } = await supabase.from("withdrawals").insert({
        user_id: (await supabase.auth.getUser()).data.user!.id,
        amount: numAmount,
        fee: WITHDRAW_FEE,
        net_amount: netAmount,
        status: "completed",
        wallet_address: walletAddress,
      });
      if (wErr) throw wErr;

      toast.success(`Withdrawal of $${netAmount.toFixed(2)} USDC sent to ${walletAddress.slice(0, 8)}...`);
      onSuccess();
      onClose();
      setAmount("");
      setWalletAddress("");
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase">Withdraw to Wallet</DialogTitle>
          <DialogDescription className="text-xs">
            Send USDC to your Polygon wallet. Fee: ${WITHDRAW_FEE} USDC (gas).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Available</label>
            <p className="text-lg font-mono font-extrabold text-card-foreground">${balance.toFixed(2)} USDC</p>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Amount (USDC)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min={2}
              max={balance}
              className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm font-mono text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Polygon Wallet Address</label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm font-mono text-foreground"
            />
          </div>

          {numAmount >= 2 && (
            <div className="bg-secondary rounded-md p-3 space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span>${numAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gas Fee</span>
                <span className="text-destructive">-${WITHDRAW_FEE.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1 font-bold">
                <span>You Receive</span>
                <span className="dividend-amount">${netAmount.toFixed(2)} USDC</span>
              </div>
            </div>
          )}

          <button
            onClick={handleWithdraw}
            disabled={!canWithdraw || processing}
            className="w-full bg-primary text-primary-foreground font-bold text-sm py-2.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {processing ? "Processing..." : "Confirm Withdrawal"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawModal;
