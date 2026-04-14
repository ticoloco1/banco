import { http, createConfig } from "wagmi";
import { polygon } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

// Check if an injected wallet (MetaMask, etc.) is available
const hasInjectedProvider =
  typeof window !== "undefined" && !!(window as any).ethereum;

/**
 * Build a wagmi config.
 * When a WalletConnect projectId is supplied the WC connector is added
 * automatically; otherwise only the injected (MetaMask / Rabby / …)
 * connector is available.
 */
export const createWagmiConfig = (projectId?: string) =>
  createConfig({
    chains: [polygon],
    connectors: [
      ...(hasInjectedProvider ? [injected()] : []),
      ...(projectId ? [walletConnect({ projectId })] : []),
    ],
    transports: {
      [polygon.id]: http(),
    },
  });

/**
 * Fetch the WalletConnect project ID from the backend function.
 * Returns "" when unavailable so the app still works with injected wallets.
 */
const getSupabaseUrl = () => (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) || (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) || "";
const getSupabaseKey = () => (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY) || "";

export const fetchWalletConnectId = async (): Promise<string> => {
  try {
    const resp = await fetch(
      `${getSupabaseUrl()}/functions/v1/get-walletconnect-id`,
      { headers: { apikey: getSupabaseKey() } }
    );
    const data = await resp.json();
    return data.projectId || "";
  } catch {
    console.warn("Could not fetch WalletConnect project ID");
    return "";
  }
};
