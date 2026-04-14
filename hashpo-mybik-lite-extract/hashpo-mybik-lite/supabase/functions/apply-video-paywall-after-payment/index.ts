import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    if (!data.user) throw new Error("Unauthorized");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (session.metadata?.unlock_type !== "mini_site_video_paywall") {
      return new Response(JSON.stringify({ error: "Invalid session type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const videoId = session.metadata?.video_id;
    const buyerId = session.metadata?.user_id;
    if (!videoId || !buyerId || buyerId !== data.user.id) {
      return new Response(JSON.stringify({ error: "Invalid metadata" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { data: video } = await supabaseClient
      .from("mini_site_videos")
      .select("id, user_id, paywall_enabled, paywall_price")
      .eq("id", videoId)
      .single();

    if (!video || !video.paywall_enabled) {
      throw new Error("Video not found or paywall disabled");
    }

    const { data: settings } = await supabaseClient
      .from("platform_settings")
      .select("paywall_expires_hours, paywall_creator_pct, paywall_platform_pct")
      .limit(1)
      .maybeSingle();

    const hours = settings?.paywall_expires_hours ?? 12;
    const creatorPct = (settings?.paywall_creator_pct ?? 75) / 100;
    const platformPct = (settings?.paywall_platform_pct ?? 25) / 100;

    const amountPaid = Number(session.amount_total ?? 0) / 100;
    const creatorShare = Math.round(amountPaid * creatorPct * 100) / 100;
    const platformShare = Math.round(amountPaid * platformPct * 100) / 100;
    const expiresAt = new Date(Date.now() + hours * 3600000).toISOString();

    const { error: insErr } = await supabaseClient.from("video_paywall_unlocks").upsert(
      {
        video_id: videoId,
        user_id: buyerId,
        amount_paid: amountPaid,
        creator_share: creatorShare,
        platform_share: platformShare,
        expires_at: expiresAt,
        payment_provider: "stripe",
        stripe_checkout_session_id: session_id,
      },
      { onConflict: "user_id,video_id" },
    );

    if (insErr) throw insErr;

    return new Response(JSON.stringify({ success: true, expires_at: expiresAt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
