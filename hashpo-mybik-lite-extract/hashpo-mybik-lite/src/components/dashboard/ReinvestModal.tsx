import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useVideos } from "@/hooks/useVideos";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  balance: number;
  onSuccess: () => void;
}

const ReinvestModal = ({ open, onClose, balance, onSuccess }: Props) => {
  const { data: videos } = useVideos();
  const [selectedVideo, setSelectedVideo] = useState("");
  const [qty, setQty] = useState("1");
  const [processing, setProcessing] = useState(false);

  const video = videos?.find((v) => v.id === selectedVideo);
  const numQty = parseInt(qty) || 0;
  const totalCost = video ? video.share_price * numQty : 0;
  const canBuy = video && numQty > 0 && totalCost <= balance && video.exchange_active;

  const handleReinvest = async () => {
    if (!canBuy || !video) return;
    setProcessing(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user!.id;

      // Debit wallet
      const { error: wErr } = await supabase
        .from("wallets")
        .update({ balance: balance - totalCost })
        .eq("user_id", userId);
      if (wErr) throw wErr;

      // Upsert holdings
      const { data: existing } = await supabase
        .from("share_holdings")
        .select("id, quantity")
        .eq("holder_id", userId)
        .eq("video_id", video.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("share_holdings")
          .update({ quantity: existing.quantity + numQty })
          .eq("id", existing.id);
      } else {
        await supabase.from("share_holdings").insert({
          holder_id: userId,
          video_id: video.id,
          quantity: numQty,
        });
      }

      toast.success(`Reinvested $${totalCost.toFixed(2)} → ${numQty} shares of ${video.ticker}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Reinvest failed");
    } finally {
      setProcessing(false);
    }
  };

  const activeVideos = videos?.filter((v) => v.exchange_active && !v.blocked) || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase">Reinvest Dividends</DialogTitle>
          <DialogDescription className="text-xs">
            Use your accumulated balance to buy shares directly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Available Balance</label>
            <p className="text-lg font-mono font-extrabold gold-text">${balance.toFixed(2)} USDC</p>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Select Asset</label>
            <select
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm font-mono text-foreground"
            >
              <option value="">Choose a video...</option>
              {activeVideos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.ticker} — ${v.share_price.toFixed(2)}/share
                </option>
              ))}
            </select>
          </div>

          {video && (
            <>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Quantity</label>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  min={1}
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm font-mono text-foreground"
                />
              </div>
              <div className="bg-secondary rounded-md p-3 space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price/Share</span>
                  <span>${video.share_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span>{numQty}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1 font-bold">
                  <span>Total</span>
                  <span className={totalCost > balance ? "text-destructive" : "dividend-amount"}>
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}

          <button
            onClick={handleReinvest}
            disabled={!canBuy || processing}
            className="w-full gold-bg font-bold text-sm py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {processing ? "Processing..." : "Confirm Reinvestment"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReinvestModal;
