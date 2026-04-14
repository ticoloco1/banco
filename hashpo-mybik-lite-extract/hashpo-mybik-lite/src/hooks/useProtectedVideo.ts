import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedVideoResult {
  access: boolean;
  youtube_video_id?: string;
  access_type?: "nft" | "paywall" | "free" | "owner";
  views_remaining?: number;
  expires_at?: string;
  reason?: string;
}

export function useProtectedVideo() {
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Map<string, ProtectedVideoResult>>(new Map());

  const fetchProtectedVideo = useCallback(async (videoId: string): Promise<ProtectedVideoResult> => {
    if (cacheRef.current.has(videoId)) {
      return cacheRef.current.get(videoId)!;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-protected-video", {
        body: { video_id: videoId },
      });

      if (error) throw error;

      const result = data as ProtectedVideoResult;
      cacheRef.current.set(videoId, result);
      return result;
    } catch (err: any) {
      console.error("Failed to fetch protected video:", err);
      return { access: false, reason: err.message || "Failed to verify access" };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback((videoId?: string) => {
    if (videoId) cacheRef.current.delete(videoId);
    else cacheRef.current = new Map();
  }, []);

  return { fetchProtectedVideo, loading, clearCache };
}
