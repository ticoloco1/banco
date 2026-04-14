import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EXTRA_SPACE_DAYS = 30;
const ACTIVE_SUB_STATUSES = new Set(["active", "trialing", "past_due"]);

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
    if (session.status !== "complete" && session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const siteId = session.metadata?.extra_site_id;
    const extraType = session.metadata?.extra_type as string | undefined;
    if (!siteId || !extraType || (extraType !== "property" && extraType !== "classified")) {
      return new Response(JSON.stringify({ error: "Invalid metadata" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { data: site, error: fetchErr } = await supabaseClient
      .from("mini_sites")
      .select("extra_property_spaces, extra_property_spaces_expires_at, extra_classified_spaces, extra_classified_spaces_expires_at")
      .eq("id", siteId)
      .single();

    if (fetchErr || !site) throw new Error("Site not found");

    const now = new Date();
    const add30Days = (d: Date) => new Date(d.getTime() + EXTRA_SPACE_DAYS * 86400000);

    const recomputeRecurringSpaces = async (targetSiteId: string, targetType: "property" | "classified") => {
      const { data: recurring } = await supabaseClient
        .from("extra_space_subscriptions")
        .select("current_period_end, status")
        .eq("site_id", targetSiteId)
        .eq("extra_type", targetType);

      const active = (recurring || []).filter((r: any) => {
        if (!ACTIVE_SUB_STATUSES.has(String(r.status || "").toLowerCase())) return false;
        if (!r.current_period_end) return false;
        return new Date(r.current_period_end) > new Date();
      });
      const count = active.length;
      const maxEnd = active.reduce<string | null>((acc, row: any) => {
        if (!row.current_period_end) return acc;
        if (!acc) return row.current_period_end;
        return new Date(row.current_period_end) > new Date(acc) ? row.current_period_end : acc;
      }, null);

      if (targetType === "classified") {
        const { error } = await supabaseClient
          .from("mini_sites")
          .update({
            extra_classified_spaces: count,
            extra_classified_spaces_expires_at: maxEnd,
          })
          .eq("id", targetSiteId);
        if (error) throw error;
      } else {
        const { error } = await supabaseClient
          .from("mini_sites")
          .update({
            extra_property_spaces: count,
            extra_property_spaces_expires_at: maxEnd,
          })
          .eq("id", targetSiteId);
        if (error) throw error;
      }
    };

    const maybeSubscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription as any)?.id;
    const isRecurringFlow =
      session.metadata?.billing_cycle === "monthly" &&
      !!maybeSubscriptionId;

    if (isRecurringFlow) {
      const subscription = await stripe.subscriptions.retrieve(maybeSubscriptionId as string);
      const periodEndIso = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : add30Days(now).toISOString();
      const subStatus = String(subscription.status || "active");
      const amountUsd = Number(session.amount_total ?? 0) / 100;

      const { error: upsertErr } = await supabaseClient
        .from("extra_space_subscriptions")
        .upsert(
          {
            site_id: siteId,
            user_id: data.user.id,
            extra_type: extraType,
            stripe_subscription_id: maybeSubscriptionId,
            stripe_checkout_session_id: session_id,
            status: subStatus,
            amount_usd: amountUsd,
            current_period_end: periodEndIso,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" },
        );
      if (upsertErr) throw upsertErr;

      await recomputeRecurringSpaces(siteId, extraType);
    } else if (extraType === "property") {
      const current = (site as any).extra_property_spaces ?? 0;
      const expiresAt = (site as any).extra_property_spaces_expires_at;
      const currentExpiry = expiresAt && new Date(expiresAt) > now ? new Date(expiresAt) : now;
      const newExpiry = add30Days(currentExpiry);

      const { error } = await supabaseClient
        .from("mini_sites")
        .update({
          extra_property_spaces: current + 1,
          extra_property_spaces_expires_at: newExpiry.toISOString(),
        })
        .eq("id", siteId);
      if (error) throw error;
    } else {
      const current = (site as any).extra_classified_spaces ?? 0;
      const expiresAt = (site as any).extra_classified_spaces_expires_at;
      const currentExpiry = expiresAt && new Date(expiresAt) > now ? new Date(expiresAt) : now;
      const newExpiry = add30Days(currentExpiry);

      const { error } = await supabaseClient
        .from("mini_sites")
        .update({
          extra_classified_spaces: current + 1,
          extra_classified_spaces_expires_at: newExpiry.toISOString(),
        })
        .eq("id", siteId);
      if (error) throw error;
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
