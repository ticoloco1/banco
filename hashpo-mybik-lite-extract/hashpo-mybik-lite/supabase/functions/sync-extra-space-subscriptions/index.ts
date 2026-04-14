import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACTIVE_SUB_STATUSES = new Set(["active", "trialing", "past_due"]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const { site_id } = await req.json();
    if (!site_id) throw new Error("site_id is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const { data: subscriptions, error: fetchErr } = await supabaseClient
      .from("extra_space_subscriptions")
      .select("id, stripe_subscription_id, extra_type")
      .eq("site_id", site_id);
    if (fetchErr) throw fetchErr;

    for (const row of subscriptions || []) {
      const sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
      const periodEndIso = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null;
      await supabaseClient
        .from("extra_space_subscriptions")
        .update({
          status: sub.status,
          current_period_end: periodEndIso,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
    }

    const now = new Date();
    const { data: classifiedRows } = await supabaseClient
      .from("extra_space_subscriptions")
      .select("current_period_end, status")
      .eq("site_id", site_id)
      .eq("extra_type", "classified");

    const activeClassified = (classifiedRows || []).filter((r: any) => {
      if (!ACTIVE_SUB_STATUSES.has(String(r.status || "").toLowerCase())) return false;
      if (!r.current_period_end) return false;
      return new Date(r.current_period_end) > now;
    });

    const classifiedCount = activeClassified.length;
    const classifiedMaxEnd = activeClassified.reduce<string | null>((acc, row: any) => {
      if (!row.current_period_end) return acc;
      if (!acc) return row.current_period_end;
      return new Date(row.current_period_end) > new Date(acc) ? row.current_period_end : acc;
    }, null);

    const { data: propertyRows } = await supabaseClient
      .from("extra_space_subscriptions")
      .select("current_period_end, status")
      .eq("site_id", site_id)
      .eq("extra_type", "property");

    const activeProperty = (propertyRows || []).filter((r: any) => {
      if (!ACTIVE_SUB_STATUSES.has(String(r.status || "").toLowerCase())) return false;
      if (!r.current_period_end) return false;
      return new Date(r.current_period_end) > now;
    });

    const propertyCount = activeProperty.length;
    const propertyMaxEnd = activeProperty.reduce<string | null>((acc, row: any) => {
      if (!row.current_period_end) return acc;
      if (!acc) return row.current_period_end;
      return new Date(row.current_period_end) > new Date(acc) ? row.current_period_end : acc;
    }, null);

    const { error: upErr } = await supabaseClient
      .from("mini_sites")
      .update({
        extra_classified_spaces: classifiedCount,
        extra_classified_spaces_expires_at: classifiedMaxEnd,
        extra_property_spaces: propertyCount,
        extra_property_spaces_expires_at: propertyMaxEnd,
      })
      .eq("id", site_id);
    if (upErr) throw upErr;

    return new Response(JSON.stringify({
      success: true,
      active_classified_spaces: classifiedCount,
      active_property_spaces: propertyCount,
    }), {
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
