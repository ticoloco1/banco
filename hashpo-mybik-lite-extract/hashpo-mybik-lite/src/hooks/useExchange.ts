import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useIndexSettings() {
  return useQuery({
    queryKey: ["index_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("index_settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateIndexSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { data, error } = await supabase
        .from("index_settings")
        .update(updates)
        .eq("id", 1)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["index_settings"] }),
  });
}

export function useIndexHistory(limit = 100) {
  return useQuery({
    queryKey: ["index_history", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("index_history")
        .select("*")
        .order("recorded_at", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useFuturesContracts() {
  return useQuery({
    queryKey: ["futures_contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("futures_contracts")
        .select("*")
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpdateFuturesContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      const { data, error } = await supabase
        .from("futures_contracts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["futures_contracts"] }),
  });
}

export function useRiskLimits() {
  return useQuery({
    queryKey: ["futures_risk_limits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("futures_risk_limits")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateRiskLimits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { data, error } = await supabase
        .from("futures_risk_limits")
        .update(updates)
        .eq("id", 1)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["futures_risk_limits"] }),
  });
}

export function useIndexConstituents() {
  return useQuery({
    queryKey: ["index_constituents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("index_constituents")
        .select("*, videos(id, title, ticker, share_price, thumbnail_url, revenue, total_shares)")
        .order("weight_pct", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useFuturesOrders() {
  return useQuery({
    queryKey: ["futures_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("futures_orders")
        .select("*, futures_contracts(symbol)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useFuturesPositions() {
  return useQuery({
    queryKey: ["futures_positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("futures_positions")
        .select("*, futures_contracts(symbol, last_price)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

// Generate mock index history data for charts
export function generateMockIndexHistory(days = 90): { date: string; value: number }[] {
  const data: { date: string; value: number }[] = [];
  let value = 1000;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    value += (Math.random() - 0.48) * 15;
    value = Math.max(800, Math.min(1300, value));
    data.push({
      date: date.toISOString().split("T")[0],
      value: Math.round(value * 100) / 100,
    });
  }
  return data;
}

// Generate mock orderbook for futures
export function generateMockFuturesOrderbook(basePrice: number) {
  const bids: { price: number; qty: number; total: number }[] = [];
  const asks: { price: number; qty: number; total: number }[] = [];
  let bidCum = 0, askCum = 0;
  for (let i = 0; i < 10; i++) {
    const bidP = basePrice - (i + 1) * 0.5;
    const askP = basePrice + (i + 1) * 0.5;
    const bidQ = Math.floor(5 + Math.random() * 30);
    const askQ = Math.floor(5 + Math.random() * 30);
    bidCum += bidQ;
    askCum += askQ;
    bids.push({ price: Math.max(0.01, bidP), qty: bidQ, total: bidCum });
    asks.push({ price: askP, qty: askQ, total: askCum });
  }
  return { bids, asks };
}

// Generate mock recent trades
export function generateMockRecentTrades(basePrice: number, count = 20) {
  const trades: { time: string; price: number; size: number; side: "buy" | "sell" }[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const time = new Date(now - i * 30000).toLocaleTimeString();
    const price = basePrice + (Math.random() - 0.5) * 5;
    trades.push({
      time,
      price: Math.round(price * 100) / 100,
      size: Math.floor(1 + Math.random() * 20),
      side: Math.random() > 0.5 ? "buy" : "sell",
    });
  }
  return trades;
}

// Generate mock candlestick data
export function generateMockCandles(basePrice: number, count = 50) {
  const candles: { date: string; open: number; high: number; low: number; close: number; volume: number }[] = [];
  let price = basePrice - count * 0.3;
  const now = new Date();
  for (let i = count; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const open = price;
    const change = (Math.random() - 0.48) * 5;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;
    const volume = Math.floor(100 + Math.random() * 500);
    candles.push({
      date: date.toISOString().split("T")[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
    price = close;
  }
  return candles;
}
