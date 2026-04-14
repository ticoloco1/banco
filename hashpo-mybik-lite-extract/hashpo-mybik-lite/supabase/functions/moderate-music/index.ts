import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { video_id, title, description, audio_url } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch API keys from platform_api_keys table
    const { data: keys } = await supabase
      .from("platform_api_keys")
      .select("service_name, api_key")
      .in("service_name", [
        "acr_cloud_host",
        "acr_cloud_access_key",
        "acr_cloud_access_secret",
        "aws_access_key_id",
        "aws_secret_access_key",
        "aws_region",
      ]);

    const keyMap: Record<string, string> = {};
    (keys || []).forEach((k: any) => { keyMap[k.service_name] = k.api_key; });

    const results: Record<string, any> = {
      acr_cloud: null,
      aws_moderation: null,
      ai_text_analysis: null,
    };

    // ─── 1. ACRCloud Music Fingerprint Recognition ───
    const acrHost = keyMap["acr_cloud_host"];
    const acrAccessKey = keyMap["acr_cloud_access_key"];
    const acrAccessSecret = keyMap["acr_cloud_access_secret"];

    if (acrHost && acrAccessKey && acrAccessSecret && audio_url) {
      try {
        // ACRCloud identify endpoint
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const stringToSign = `POST\n/v1/identify\n${acrAccessKey}\naudio\n1\n${timestamp}`;

        // HMAC-SHA1 signature
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(acrAccessSecret),
          { name: "HMAC", hash: "SHA-1" },
          false,
          ["sign"]
        );
        const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(stringToSign));
        const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

        // Fetch only first 15 seconds of audio (limit bytes to save costs)
        // ACRCloud only needs 10-15s to fingerprint music
        const MAX_SAMPLE_BYTES = 250_000; // ~15s of MP3 at 128kbps
        const audioResponse = await fetch(audio_url, {
          headers: { Range: `bytes=0-${MAX_SAMPLE_BYTES}` },
        });
        if (audioResponse.ok || audioResponse.status === 206) {
          const audioBuffer = await audioResponse.arrayBuffer();
          const sampleSize = Math.min(audioBuffer.byteLength, MAX_SAMPLE_BYTES);
          const sampleBlob = new Blob([audioBuffer.slice(0, sampleSize)], { type: "audio/mpeg" });

          const formData = new FormData();
          formData.append("sample", sampleBlob, "sample.mp3");
          formData.append("access_key", acrAccessKey);
          formData.append("data_type", "audio");
          formData.append("signature_version", "1");
          formData.append("signature", signatureBase64);
          formData.append("sample_bytes", sampleSize.toString());
          formData.append("timestamp", timestamp);

          const acrResponse = await fetch(`https://${acrHost}/v1/identify`, {
            method: "POST",
            body: formData,
          });

          if (acrResponse.ok) {
            const acrData = await acrResponse.json();
            results.acr_cloud = {
              status: acrData.status?.code === 0 ? "match_found" : "no_match",
              music: acrData.metadata?.music || [],
              message: acrData.status?.msg || "Unknown",
            };
          }
        }
      } catch (e) {
        console.error("ACRCloud error:", e);
        results.acr_cloud = { status: "error", message: e instanceof Error ? e.message : "ACRCloud failed" };
      }
    } else {
      results.acr_cloud = { status: "skipped", message: "ACRCloud keys not configured or no audio_url provided" };
    }

    // ─── 2. AWS Rekognition Content Moderation (for thumbnails/video frames) ───
    const awsKeyId = keyMap["aws_access_key_id"];
    const awsSecret = keyMap["aws_secret_access_key"];
    const awsRegion = keyMap["aws_region"] || "us-east-1";

    if (awsKeyId && awsSecret && audio_url) {
      try {
        // AWS Signature V4 for Rekognition DetectModerationLabels
        const service = "rekognition";
        const host = `${service}.${awsRegion}.amazonaws.com`;
        const now = new Date();
        const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
        const dateStamp = amzDate.substring(0, 8);

        const payload = JSON.stringify({
          Image: { S3Object: undefined },
          MinConfidence: 60,
        });

        // For URL-based images, we download and send bytes
        // This is a simplified version - full AWS SDK would be better
        results.aws_moderation = {
          status: "configured",
          region: awsRegion,
          message: "AWS Rekognition configured. Use AWS SDK for full integration with video/image analysis.",
          note: "For production: integrate aws4 signing or use Deno AWS SDK for DetectModerationLabels & StartContentModeration APIs",
        };
      } catch (e) {
        console.error("AWS error:", e);
        results.aws_moderation = { status: "error", message: e instanceof Error ? e.message : "AWS failed" };
      }
    } else {
      results.aws_moderation = { status: "skipped", message: "AWS keys not configured" };
    }

    // ─── 3. AI Text Analysis (title/description for music piracy) ───
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY && (title || description)) {
      try {
        const prompt = `You are a music copyright police. Analyze this content metadata for music piracy:

Title: "${title || ""}"
Description: "${description || ""}"

Detect:
1. MUSIC PIRACY: Full album uploads, leaked tracks, bootleg recordings, unofficial remixes
2. KNOWN ARTISTS: Content using names of major artists (Taylor Swift, Drake, Bad Bunny, etc.) without authorization
3. LABEL CONTENT: Music from major labels (Universal, Sony, Warner, etc.)
4. LIVE RECORDINGS: Unauthorized concert recordings
5. KARAOKE/COVERS: Unlicensed covers or instrumentals

Return ONLY valid JSON:
{
  "music_piracy_detected": true/false,
  "artist_names_found": ["list of artist names detected"],
  "label_risk": "none" | "low" | "medium" | "high",
  "piracy_indicators": ["list of specific concerns"],
  "action": "allow" | "review" | "block",
  "confidence": 0.0-1.0,
  "summary": "brief explanation"
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
              { role: "system", content: "You are a strict music copyright detection AI. Return only valid JSON." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (response.ok) {
          const aiData = await response.json();
          const content = aiData.choices?.[0]?.message?.content || "{}";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          results.ai_text_analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { music_piracy_detected: false, summary: "Could not parse" };
        }
      } catch (e) {
        console.error("AI analysis error:", e);
        results.ai_text_analysis = { status: "error", message: e instanceof Error ? e.message : "AI failed" };
      }
    }

    // ─── Auto-action on video ───
    if (video_id) {
      const shouldBlock =
        results.acr_cloud?.status === "match_found" ||
        results.ai_text_analysis?.action === "block" ||
        results.ai_text_analysis?.music_piracy_detected === true;

      const shouldReview =
        results.ai_text_analysis?.action === "review" ||
        results.ai_text_analysis?.label_risk === "high";

      if (shouldBlock) {
        await supabase.from("videos").update({ blocked: true, under_review: true }).eq("id", video_id);
        results.auto_action = "blocked";
      } else if (shouldReview) {
        await supabase.from("videos").update({ under_review: true }).eq("id", video_id);
        results.auto_action = "flagged_for_review";
      } else {
        results.auto_action = "approved";
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Music moderation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
