import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAccount } from "wagmi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowDownToLine } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DepositModal = ({ open, onClose, onSuccess }: Props) => {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  const numAmount = parseFloat(amount) || 0;

  const handleDeposit = async () => {
    if (numAmount < 1) {
      toast.error("Minimum deposit is 1 USDC");
      return;
    }
    if (!isConnected) {
      toast.error("Connect your wallet first");
      return;
    }
    setProcessing(true);
    try {
      // In a full on-chain integration, this would call a smart contract
      // For hybrid mode: we credit internal balance after verifying the tx
      // For now: simulate the deposit by crediting the internal wallet
      const userId = (await supabase.auth.getUser()).data.user!.id;

      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (wallet) {
        const { error } = await supabase
          .from("wallets")
          .update({ balance: wallet.balance + numAmount })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("wallets")
          .insert({ user_id: userId, balance: numAmount });
        if (error) throw error;
      }

      toast.success(`Deposited $${numAmount.toFixed(2)} USDC from ${address?.slice(0, 8)}...`);
      onSuccess();
      onClose();
      setAmount("");
    } catch (err: any) {
      toast.error(err.message || "Deposit failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase">Deposit USDC</DialogTitle>
          <DialogDescription className="text-xs">
            Transfer USDC from your Polygon wallet to your internal balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isConnected ? (
            <div className="bg-destructive/10 rounded-md p-3 text-xs text-destructive font-bold text-center">
              Connect your wallet first using the button in the header.
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">From Wallet</label>
                <p className="text-sm font-mono text-foreground">{address}</p>
                <p className="text-[10px] text-muted-foreground">Polygon Network • USDC</p>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Amount (USDC)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min={1}
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm font-mono text-foreground"
                />
              </div>

              <div className="bg-secondary rounded-md p-3 text-[10px] text-muted-foreground space-y-1">
                <p>• Minimum deposit: 1 USDC</p>
                <p>• No deposit fees</p>
                <p>• Credits appear instantly in your internal balance</p>
                <p>• Gas fees paid from your wallet</p>
              </div>

              <button
                onClick={handleDeposit}
                disabled={numAmount < 1 || processing}
                className="w-full bg-[hsl(var(--ticker-up))] text-white font-bold text-sm py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <span className="flex items-center justify-center gap-2">
                  <ArrowDownToLine className="w-4 h-4" />
                  {processing ? "Processing..." : `Deposit $${numAmount.toFixed(2)} USDC`}
                </span>
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;
