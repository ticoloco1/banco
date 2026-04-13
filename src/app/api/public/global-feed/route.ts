import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabaseServer';

export const revalidate = 60;

export async function GET() {
  try {
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('feed_posts')
      .select(`
        id, site_id, text, image_url, media_urls, video_embed_url, created_at, expires_at,
        mini_sites!inner(slug, site_name, avatar_url, accent_color)
      `)
      .eq('published', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(40);

    if (error) throw error;

    // Get like counts
    const postIds = (data || []).map((p: any) => p.id);
    let likeCounts: Record<string, number> = {};

    if (postIds.length > 0) {
      const { data: likes } = await supabase
        .from('feed_post_likes')
        .select('post_id')
        .in('post_id', postIds);

      if (likes) {
        for (const like of likes) {
          likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1;
        }
      }
    }

    const posts = (data || []).map((p: any) => ({
      id: p.id,
      site_id: p.site_id,
      text: p.text,
      image_url: p.image_url,
      media_urls: Array.isArray(p.media_urls) ? p.media_urls : p.image_url ? [p.image_url] : [],
      video_embed_url: p.video_embed_url,
      created_at: p.created_at,
      expires_at: p.expires_at,
      likeCount: likeCounts[p.id] || 0,
      site: p.mini_sites || {},
    }));

    return NextResponse.json({ posts });
  } catch (err: any) {
    // Return empty on error so page doesn't crash
    return NextResponse.json({ posts: [] });
  }
}
