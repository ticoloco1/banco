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

    const { collection_id, quantity } = await req.json();
    if (!collection_id) {
      return new Response(JSON.stringify({ error: "collection_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const qty = Math.max(1, Math.min(quantity || 1, 10000)); // cap at 10k per tx
    const admin = createClient(supabaseUrl, serviceKey);

    // Get collection
    const { data: collection, error: colErr } = await admin
      .from("nft_collections")
      .select("*")
      .eq("id", collection_id)
      .single();

    if (colErr || !collection) {
      return new Response(JSON.stringify({ error: "Collection not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (collection.status !== "active") {
      return new Response(JSON.stringify({ error: "Collection is not active" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const remaining = collection.max_editions - collection.editions_minted;
    if (remaining < qty) {
      return new Response(JSON.stringify({ error: `Only ${remaining} editions remaining` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalCost = collection.price_per_nft * qty;
    const creatorShare = totalCost * (collection.creator_pct / 100);
    const platformShare = totalCost * (collection.platform_pct / 100);

    // Check buyer wallet
    const { data: buyerWallet } = await admin
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    const buyerBalance = buyerWallet?.balance ?? 0;
    if (buyerBalance < totalCost) {
      return new Response(JSON.stringify({ 
        error: `Insufficient balance. Need $${totalCost.toFixed(2)}, have $${buyerBalance.toFixed(2)}` 
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const polygonHash = `0x${Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(user.id + collection_id + Date.now())))).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 40)}`;

    // 1. Debit buyer
    await admin
      .from("wallets")
      .update({ balance: buyerBalance - totalCost })
      .eq("user_id", user.id);

    // 2. Credit creator
    const { data: creatorWallet } = await admin
      .from("wallets")
      .select("balance")
      .eq("user_id", collection.creator_id)
      .maybeSingle();

    if (creatorWallet) {
      await admin
        .from("wallets")
        .update({ balance: creatorWallet.balance + creatorShare })
        .eq("user_id", collection.creator_id);
    } else {
      await admin.from("wallets").insert({
        user_id: collection.creator_id,
        balance: creatorShare,
      });
    }

    // 3. Record purchase
    await admin.from("collection_purchases").insert({
      collection_id,
      buyer_id: user.id,
      quantity: qty,
      price_per_unit: collection.price_per_nft,
      total_paid: totalCost,
      creator_share: creatorShare,
      platform_share: platformShare,
      polygon_hash: polygonHash,
    });

    // 4. Create NFT purchase records (for view access)
    const nftRecords = [];
    for (let i = 0; i < qty; i++) {
      nftRecords.push({
        video_id: collection.video_id,
        buyer_id: user.id,
        seller_id: collection.creator_id,
        price_paid: collection.price_per_nft,
        views_allowed: collection.view_tier || 1,
        polygon_hash: polygonHash,
      });
    }
    await admin.from("nft_purchases").insert(nftRecords);

    // 5. Update editions minted
    await admin
      .from("nft_collections")
      .update({ editions_minted: collection.editions_minted + qty })
      .eq("id", collection_id);

    // 6. Update video editions sold
    await admin
      .from("mini_site_videos")
      .update({ nft_editions_sold: (collection.editions_minted + qty) })
      .eq("id", collection.video_id);

    // 7. Ledger entries
    await admin.from("ledger_transactions").insert([
      {
        user_id: user.id,
        amount: -totalCost,
        balance_after: buyerBalance - totalCost,
        tx_type: "nft_purchase",
        description: `Bought ${qty}x "${collection.title}" NFT`,
        reference_id: collection_id,
        reference_type: "nft_collection",
      },
      {
        user_id: collection.creator_id,
        amount: creatorShare,
        balance_after: (creatorWallet?.balance ?? 0) + creatorShare,
        tx_type: "nft_sale_revenue",
        description: `Sold ${qty}x "${collection.title}" NFT (${collection.creator_pct}%)`,
        reference_id: collection_id,
        reference_type: "nft_collection",
      },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        quantity: qty,
        total_paid: totalCost,
        creator_share: creatorShare,
        platform_share: platformShare,
        polygon_hash: polygonHash,
        editions_remaining: remaining - qty,
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
