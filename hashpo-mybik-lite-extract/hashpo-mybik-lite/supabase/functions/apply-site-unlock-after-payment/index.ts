import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CREATOR_PCT = 0.7;
const PLATFORM_PCT = 0.3;

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

    const siteId = session.metadata?.site_id;
    const userId = session.metadata?.user_id;
    if (!siteId || !userId) {
      return new Response(JSON.stringify({ error: "Invalid metadata" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const amountPaid = Number(session.amount_total ?? 0) / 100;
    const creatorShare = Math.round(amountPaid * CREATOR_PCT * 100) / 100;
    const platformShare = Math.round(amountPaid * PLATFORM_PCT * 100) / 100;

    const { data: site } = await supabaseClient
      .from("mini_sites")
      .select("user_id")
      .eq("id", siteId)
      .single();
    if (!site) throw new Error("Site not found");
    const creatorId = site.user_id;

    const { error } = await supabaseClient.from("site_unlocks").insert({
      site_id: siteId,
      buyer_id: userId,
      creator_id: creatorId,
      amount_paid: amountPaid,
      creator_share: creatorShare,
      platform_share: platformShare,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
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
