import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SLUG_DROP_POSITIONS = 150;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: toDrop } = await supabaseClient
      .from("slug_listings")
      .select("id, boost_rank")
      .eq("status", "active")
      .not("boost_home_at", "is", null)
      .lt("boost_home_expires_at", now.toISOString());

    if (!toDrop?.length) {
      return new Response(JSON.stringify({ success: true, dropped: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let dropped = 0;
    for (const row of toDrop) {
      const { data: listing } = await supabaseClient
        .from("slug_listings")
        .select("boost_maintenance_paid_at")
        .eq("id", row.id)
        .single();
      const paidAt = (listing as any)?.boost_maintenance_paid_at;
      if (paidAt && new Date(paidAt) > cutoff) continue;
      const newRank = ((row as any).boost_rank ?? 0) + SLUG_DROP_POSITIONS;
      await supabaseClient
        .from("slug_listings")
        .update({
          boost_rank: newRank,
          boost_home_at: null,
          boost_home_expires_at: null,
          boost_maintenance_paid_at: null,
        })
        .eq("id", row.id);
      dropped++;
    }

    return new Response(JSON.stringify({ success: true, dropped }), {
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
