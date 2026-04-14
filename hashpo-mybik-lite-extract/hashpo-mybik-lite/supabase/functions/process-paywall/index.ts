import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // User client to get user identity
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { video_id, source } = await req.json();
    if (!video_id) {
      return new Response(JSON.stringify({ error: "video_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for privileged operations
    const admin = createClient(supabaseUrl, serviceKey);

    // Get video info
    const { data: video, error: videoErr } = await admin
      .from("videos")
      .select("*")
      .eq("id", video_id)
      .single();
    if (videoErr || !video) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already unlocked
    const { data: existing } = await admin
      .from("paywall_unlocks")
      .select("id")
      .eq("user_id", user.id)
      .eq("video_id", video_id)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ error: "Already unlocked", unlocked: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get platform settings
    const { data: settings } = await admin
      .from("platform_settings")
      .select("*")
      .eq("id", 1)
      .single();

    const revenueSource = source || "Paywall Unlock";
    const commissionRate = revenueSource.includes("Ad")
      ? (settings?.commission_ads ?? 35)
      : (settings?.commission_paywall ?? 30);

    const grossAmount = video.paywall_price;
    const platformFee = grossAmount * (commissionRate / 100);
    const netToHolders = grossAmount - platformFee;
    const perShare = netToHolders / (video.total_shares || 1000);

    // 1. Record the paywall unlock
    await admin.from("paywall_unlocks").insert({
      user_id: user.id,
      video_id,
      amount_paid: grossAmount,
      platform_fee: platformFee,
      net_to_holders: netToHolders,
    });

    // 2. Create dividend record
    const { data: dividend } = await admin
      .from("dividends")
      .insert({
        video_id,
        total_amount: netToHolders,
        per_share_amount: perShare,
        source: revenueSource,
      })
      .select()
      .single();

    // 3. Get all share holders for this video
    const { data: holders } = await admin
      .from("share_holdings")
      .select("holder_id, quantity")
      .eq("video_id", video_id)
      .gt("quantity", 0);

    if (holders && holders.length > 0 && dividend) {
      // 4. Create payout records and credit wallets
      const payoutRecords = holders.map((h) => ({
        holder_id: h.holder_id,
        video_id,
        dividend_id: dividend.id,
        source: revenueSource,
        amount: perShare * h.quantity,
        shares_held: h.quantity,
        polygon_hash: video.polygon_hash,
      }));

      await admin.from("dividend_payouts").insert(payoutRecords);

      // 5. Credit each holder's wallet
      for (const h of holders) {
        const credit = perShare * h.quantity;
        // Upsert wallet
        const { data: wallet } = await admin
          .from("wallets")
          .select("balance")
          .eq("user_id", h.holder_id)
          .maybeSingle();

        if (wallet) {
          await admin
            .from("wallets")
            .update({ balance: wallet.balance + credit })
            .eq("user_id", h.holder_id);
        } else {
          await admin.from("wallets").insert({
            user_id: h.holder_id,
            balance: credit,
          });
        }
      }
    }

    // 6. Update video revenue
    await admin
      .from("videos")
      .update({ revenue: video.revenue + grossAmount })
      .eq("id", video_id);

    return new Response(
      JSON.stringify({
        success: true,
        gross: grossAmount,
        platform_fee: platformFee,
        net_distributed: netToHolders,
        per_share: perShare,
        holders_paid: holders?.length ?? 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
