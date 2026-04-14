import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BOOST_HOMEPAGE_DAYS = 7;
const SLUG_DROP_POSITIONS = 150;

async function processSlugBoostDrops(supabase: ReturnType<typeof createClient>) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const { data: toDrop } = await supabase
    .from("slug_listings")
    .select("id, boost_rank")
    .eq("status", "active")
    .not("boost_home_at", "is", null)
    .lt("boost_home_expires_at", now.toISOString());
  if (!toDrop?.length) return;
  for (const row of toDrop) {
    const { data: listing } = await supabase
      .from("slug_listings")
      .select("boost_maintenance_paid_at")
      .eq("id", row.id)
      .single();
    const paidAt = (listing as any)?.boost_maintenance_paid_at;
    if (paidAt && new Date(paidAt) > cutoff) continue;
    const newRank = ((row as any).boost_rank ?? 0) + SLUG_DROP_POSITIONS;
    await supabase
      .from("slug_listings")
      .update({
        boost_rank: newRank,
        boost_home_at: null,
        boost_home_expires_at: null,
        boost_maintenance_paid_at: null,
      })
      .eq("id", row.id);
  }
}

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

    const siteId = session.metadata?.boost_site_id;
    const slugListingId = session.metadata?.boost_slug_listing_id;
    const boostType = session.metadata?.boost_type as string | undefined;

    if (slugListingId && boostType && boostType.startsWith("slug_")) {
      await processSlugBoostDrops(supabaseClient);

      const now = new Date();

      if (boostType === "slug_1_position") {
        const { data: list } = await supabaseClient
          .from("slug_listings")
          .select("boost_rank")
          .eq("status", "active");
        const minRank = list?.length
          ? Math.min(...(list as any[]).map((r: any) => r.boost_rank ?? 0))
          : 0;
        const newRank = minRank - 1;
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const { error } = await supabaseClient
          .from("slug_listings")
          .update({
            boost_rank: newRank,
            boost_expires_at: expiresAt.toISOString(),
          })
          .eq("id", slugListingId);
        if (error) throw error;
      } else if (boostType === "slug_category_home_7d") {
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const { error } = await supabaseClient
          .from("slug_listings")
          .update({
            boost_rank: 1,
            boost_home_at: now.toISOString(),
            boost_home_expires_at: expiresAt.toISOString(),
            boost_expires_at: expiresAt.toISOString(),
          })
          .eq("id", slugListingId);
        if (error) throw error;
      } else if (boostType === "slug_category_home_daily") {
        const { error } = await supabaseClient
          .from("slug_listings")
          .update({ boost_maintenance_paid_at: now.toISOString() })
          .eq("id", slugListingId);
        if (error) throw error;
      } else {
        return new Response(JSON.stringify({ error: "Invalid slug boost_type" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const days = boostType === "homepage" ? BOOST_HOMEPAGE_DAYS : 1;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    const newRank = boostType === "homepage" ? 9999 : 10;

    if (slugListingId && boostType === "slug_listing") {
      const { error } = await supabaseClient
        .from("slug_listings")
        .update({
          boost_rank: newRank,
          boost_expires_at: expiresAt.toISOString(),
        })
        .eq("id", slugListingId);
      if (error) throw error;
    } else if (siteId && boostType) {
      const { error } = await supabaseClient
        .from("mini_sites")
        .update({
          boost_rank: newRank,
          boost_expires_at: expiresAt.toISOString(),
        })
        .eq("id", siteId);
      if (error) throw error;
    } else {
      return new Response(JSON.stringify({ error: "Invalid metadata" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

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
