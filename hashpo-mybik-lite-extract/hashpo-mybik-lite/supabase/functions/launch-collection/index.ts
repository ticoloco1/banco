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

    const body = await req.json();
    const { video_id, site_id, title, description, max_editions, price_per_nft, view_tier, recharge_enabled, recharge_price, thumbnail_url } = body;

    if (!video_id || !site_id || !title) {
      return new Response(JSON.stringify({ error: "video_id, site_id, and title are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Get platform settings
    const { data: settings } = await admin
      .from("platform_settings")
      .select("nft_launch_fee, nft_creator_pct, nft_platform_pct")
      .eq("id", 1)
      .single();

    const launchFee = settings?.nft_launch_fee ?? 300;
    const creatorPct = settings?.nft_creator_pct ?? 70;
    const platformPct = settings?.nft_platform_pct ?? 30;

    // Check if collection already exists for this video
    const { data: existing } = await admin
      .from("nft_collections")
      .select("id")
      .eq("video_id", video_id)
      .eq("creator_id", user.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Collection already launched for this video" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check wallet balance for launch fee
    const { data: wallet } = await admin
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    const balance = wallet?.balance ?? 0;
    if (balance < launchFee) {
      return new Response(JSON.stringify({ 
        error: `Insufficient balance. Need $${launchFee}, have $${balance.toFixed(2)}` 
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate hashes
    const polygonHash = `0x${Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(user.id + video_id + Date.now())))).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 40)}`;
    const arweaveHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(title + video_id + Date.now())))).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 43);

    // 1. Debit launch fee from wallet
    await admin
      .from("wallets")
      .update({ balance: balance - launchFee })
      .eq("user_id", user.id);

    // 2. Record ledger transaction
    await admin.from("ledger_transactions").insert({
      user_id: user.id,
      amount: -launchFee,
      balance_after: balance - launchFee,
      tx_type: "nft_launch_fee",
      description: `NFT Collection launch fee: ${title}`,
      reference_type: "nft_collection",
    });

    // 3. Create the collection
    const { data: collection, error: collErr } = await admin
      .from("nft_collections")
      .insert({
        creator_id: user.id,
        site_id,
        video_id,
        title,
        description: description || null,
        thumbnail_url: thumbnail_url || null,
        max_editions: max_editions || 1000000,
        price_per_nft: price_per_nft || 0.10,
        view_tier: view_tier || 1,
        recharge_enabled: recharge_enabled || false,
        recharge_price: recharge_price || 0,
        launch_fee_paid: launchFee,
        creator_pct: creatorPct,
        platform_pct: platformPct,
        polygon_hash: polygonHash,
        arweave_hash: arweaveHash,
      })
      .select()
      .single();

    if (collErr) throw collErr;

    // 4. Update the video to mark as NFT-enabled
    await admin
      .from("mini_site_videos")
      .update({
        nft_enabled: true,
        nft_price: price_per_nft || 0.10,
        nft_max_views: view_tier || 1,
        nft_max_editions: max_editions || 1000000,
        recharge_enabled: recharge_enabled || false,
        recharge_price: recharge_price || 0,
      })
      .eq("id", video_id);

    // 5. Send notification
    await admin.from("notifications").insert({
      user_id: user.id,
      title: "🚀 Collection Launched!",
      message: `Your NFT collection "${title}" is live with ${(max_editions || 1000000).toLocaleString()} editions at $${price_per_nft || 0.10} each.`,
      type: "success",
      link: "/marketplace",
    });

    return new Response(
      JSON.stringify({
        success: true,
        collection_id: collection.id,
        polygon_hash: polygonHash,
        arweave_hash: arweaveHash,
        launch_fee: launchFee,
        max_editions: max_editions || 1000000,
        price_per_nft: price_per_nft || 0.10,
        split: `${creatorPct}/${platformPct}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
