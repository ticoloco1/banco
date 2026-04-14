import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, description, thumbnail_url, video_id, youtube_url } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Enhanced prompt for piracy and prohibited content detection
    const prompt = `You are an AI content moderation police for a video platform. Analyze the following video metadata for **piracy, copyright violations, and prohibited content**.

Title: "${title || ""}"
Description: "${description || ""}"
Thumbnail URL: "${thumbnail_url || "none"}"
YouTube URL/ID: "${youtube_url || "none"}"

**CRITICAL - Detect and flag:**

1. **PIRACY INDICATORS:**
   - Re-uploads of copyrighted content (movies, TV shows, music videos, sports broadcasts)
   - Titles containing: "Full Movie", "HD Rip", "720p/1080p/4K", "Download", "Watch Free", "Episode"
   - Popular movie/show names without being official channel
   - Cam recordings, screeners, bootleg content
   - "Leaked", "Unreleased", "Early Access" content

2. **COPYRIGHT VIOLATIONS:**
   - Content clearly from Netflix, Disney+, HBO, Amazon Prime, etc.
   - Music from major labels without license indicators
   - Live sports broadcasts (NFL, FIFA, NBA, UFC, etc.)
   - News footage from major networks
   - Gaming streams of copyrighted games

3. **PROHIBITED CONTENT:**
   - Violence, gore, terrorism
   - Nudity, sexual content, pornography
   - Hate speech, discrimination
   - Illegal activities (drugs, weapons, fraud)
   - Child safety concerns
   - Misinformation, fake news
   - Scams, phishing, financial fraud

4. **SPAM/QUALITY:**
   - Clickbait with misleading titles
   - Low-quality re-uploads
   - Duplicate content farming

Return ONLY valid JSON:
{
  "safe": true/false,
  "piracy_detected": true/false,
  "copyright_risk": "none" | "low" | "medium" | "high" | "critical",
  "prohibited_content": true/false,
  "score": 0.0-1.0 (1 = perfectly safe, 0 = definitely violating),
  "flags": ["list of specific concerns"],
  "categories_detected": ["piracy", "copyright", "violence", "adult", "hate", "spam", etc.],
  "action_required": "none" | "review" | "flag" | "block",
  "summary": "brief assessment explaining the decision"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a strict content moderation AI police. Return only valid JSON. Be aggressive in detecting piracy and copyright violations." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      throw new Error(`AI gateway error: ${response.status} ${t}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    
    // Parse AI response
    let assessment;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      assessment = jsonMatch ? JSON.parse(jsonMatch[0]) : { 
        safe: true, 
        piracy_detected: false,
        copyright_risk: "none",
        prohibited_content: false,
        score: 1, 
        flags: [], 
        categories_detected: [],
        action_required: "none",
        summary: "Could not parse AI response" 
      };
    } catch {
      assessment = { 
        safe: true, 
        piracy_detected: false,
        copyright_risk: "none", 
        prohibited_content: false,
        score: 1, 
        flags: [], 
        categories_detected: [],
        action_required: "none",
        summary: "Parse error - defaulting to safe" 
      };
    }

    // Auto-actions based on assessment
    if (video_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Block immediately for critical violations
      if (assessment.action_required === "block" || assessment.piracy_detected || assessment.copyright_risk === "critical") {
        await supabase.from("videos").update({ 
          blocked: true, 
          under_review: true 
        }).eq("id", video_id);
        
        assessment.auto_action = "blocked";
      }
      // Flag for review
      else if (!assessment.safe || assessment.action_required === "flag" || assessment.copyright_risk === "high") {
        await supabase.from("videos").update({ 
          under_review: true 
        }).eq("id", video_id);
        
        assessment.auto_action = "flagged_for_review";
      }
    }

    return new Response(JSON.stringify({ success: true, assessment }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Moderation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
