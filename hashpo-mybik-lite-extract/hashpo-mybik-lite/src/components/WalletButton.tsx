import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wallet, LogOut, Copy, Check } from "lucide-react";

const WalletButton = () => {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Save wallet address to profile whenever it changes
  useEffect(() => {
    if (!user || !address) return;
    let cancelled = false;

    const save = async () => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ wallet_address: address })
          .eq("user_id", user.id);
        if (error) throw error;
        if (!cancelled) toast.success("Wallet linked to profile!");
      } catch (err: any) {
        if (!cancelled) toast.error(err.message || "Failed to save wallet");
      } finally {
        if (!cancelled) setSaving(false);
      }
    };

    save();
    return () => { cancelled = true; };
  }, [address, user]);

  const handleConnect = (connectorIndex: number) => {
    const connector = connectors[connectorIndex];
    if (!connector) return;

    connect(
      { connector },
      {
        onSuccess: () => setShowMenu(false),
        onError: (error) => toast.error(error.message || "Connection failed"),
      }
    );
  };

  const handleQuickConnect = () => {
    if (connectors.length === 1) {
      handleConnect(0);
    } else {
      setShowMenu(!showMenu);
    }
  };

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    disconnect();
    setShowMenu(false);
  };

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "";

  // Connected state
  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary-foreground/10 border border-primary-foreground/20 rounded-md text-primary-foreground text-xs font-mono hover:bg-primary-foreground/20 transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--ticker-up))]" />
          {shortAddress}
        </button>

        {showMenu && (
          <div className="absolute right-0 top-10 w-52 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Polygon Network</p>
              <p className="text-xs font-mono text-foreground mt-1">{shortAddress}</p>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors w-full text-left"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[hsl(var(--ticker-up))]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy Address"}
            </button>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-secondary transition-colors w-full text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>
    );
  }

  // Disconnected state
  return (
    <div className="relative">
      <button
        onClick={handleQuickConnect}
        disabled={isPending || saving}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black hover:opacity-90 transition-colors disabled:opacity-50"
        style={{ background: "hsl(30, 100%, 55%)", color: "white" }}
      >
        <Wallet className="w-4 h-4" />
        {isPending ? "Connecting…" : "Connect Wallet"}
      </button>

      {showMenu && !isPending && (
        <div className="absolute right-0 top-10 w-52 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Choose Wallet</p>
          </div>
          {connectors.map((connector, i) => (
            <button
              key={connector.uid}
              onClick={() => handleConnect(i)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-foreground hover:bg-secondary transition-colors w-full text-left"
            >
              <Wallet className="w-3.5 h-3.5 text-primary" />
              {connector.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletButton;
