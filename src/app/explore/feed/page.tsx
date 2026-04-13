'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { useT } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { getAssetUrl } from '@/lib/getAssetUrl';
import { Heart, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

type GlobalPost = {
  id: string;
  site_id: string;
  text: string | null;
  image_url: string | null;
  media_urls?: unknown;
  video_embed_url?: string | null;
  created_at: string;
  likeCount: number;
  site: {
    slug: string;
    site_name: string | null;
    avatar_url: string | null;
    accent_color: string | null;
  };
};

function mediaList(p: GlobalPost): string[] {
  const raw = p.media_urls;
  if (Array.isArray(raw)) {
    return raw.map(String).filter(Boolean);
  }
  if (p.image_url) return [p.image_url];
  return [];
}

export default function ExploreFeedPage() {
  const T = useT();
  const { user } = useAuth();
  const [posts, setPosts] = useState<GlobalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [likeBusy, setLikeBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/public/global-feed', { credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'load');
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch {
      toast.error(T('explore_feed_err'));
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [T]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user?.id || !posts.length) return;
    let cancelled = false;
    (async () => {
      const ids = posts.map((p) => p.id);
      const { data } = await supabase.from('feed_post_likes' as never).select('post_id').eq('user_id', user.id).in('post_id', ids);
      if (cancelled || !data) return;
      const next: Record<string, boolean> = {};
      for (const row of data as { post_id: string }[]) {
        next[row.post_id] = true;
      }
      setLiked(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, posts]);

  const toggleLike = async (postId: string) => {
    if (!user) {
      window.location.href = `/auth?redirect=${encodeURIComponent('/explore/feed')}`;
      return;
    }
    setLikeBusy(postId);
    try {
      const on = liked[postId];
      if (on) {
        const { error } = await supabase
          .from('feed_post_likes' as never)
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
        setLiked((prev) => ({ ...prev, [postId]: false }));
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, likeCount: Math.max(0, p.likeCount - 1) } : p)),
        );
      } else {
        const { error } = await supabase.from('feed_post_likes' as never).insert({
          post_id: postId,
          user_id: user.id,
        });
        if (error) throw error;
        setLiked((prev) => ({ ...prev, [postId]: true }));
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, likeCount: p.likeCount + 1 } : p)),
        );
      }
    } catch {
      toast.error(T('explore_feed_like_err'));
    } finally {
      setLikeBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-[var(--text)] mb-1">{T('explore_feed_title')}</h1>
        <p className="text-sm text-[var(--text2)] mb-6 leading-relaxed">{T('explore_feed_sub')}</p>
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/sites"
            className="text-xs font-bold px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)]"
          >
            {T('nav_sites')} →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-[var(--text2)]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-[var(--text2)] py-16">{T('explore_feed_empty')}</p>
        ) : (
          <div className="space-y-6">
            {posts.map((p) => {
              const accent = p.site?.accent_color || '#818cf8';
              const imgs = mediaList(p);
              return (
                <article
                  key={p.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)] overflow-hidden shadow-lg shadow-black/20"
                >
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
                    <Link
                      href={`/s/${encodeURIComponent(p.site.slug)}`}
                      className="flex items-center gap-2 min-w-0 flex-1 group"
                    >
                      <div
                        className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2"
                        style={{ borderColor: accent }}
                      >
                        {p.site.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={getAssetUrl(p.site.avatar_url)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-sm font-black text-white"
                            style={{ background: accent }}
                          >
                            {(p.site.site_name || p.site.slug)?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--text)] truncate group-hover:underline text-sm">
                          {p.site.site_name || p.site.slug}
                        </p>
                        <p className="text-[10px] text-[var(--text2)] font-mono truncate">{p.site.slug}.trustbank.xyz</p>
                      </div>
                    </Link>
                    <Link
                      href={`/s/${encodeURIComponent(p.site.slug)}`}
                      className="shrink-0 p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-brand"
                      aria-label={T('explore_feed_open_site')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                  {imgs[0] && (
                    <div className="relative aspect-square max-h-[min(85vw,420px)] bg-black/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getAssetUrl(imgs[0])} alt="" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="px-4 py-3 space-y-2">
                    {p.text ? (
                      <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">{p.text}</p>
                    ) : null}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        disabled={likeBusy === p.id}
                        onClick={() => void toggleLike(p.id)}
                        className="inline-flex items-center gap-1.5 text-sm font-bold rounded-full px-3 py-1.5 border border-[var(--border)] transition-colors disabled:opacity-50"
                        style={{
                          color: liked[p.id] ? accent : 'var(--text2)',
                          borderColor: liked[p.id] ? accent : undefined,
                          background: liked[p.id] ? `${accent}18` : undefined,
                        }}
                      >
                        {likeBusy === p.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Heart className={`w-4 h-4 ${liked[p.id] ? 'fill-current' : ''}`} />
                        )}
                        {p.likeCount}
                      </button>
                      <span className="text-[10px] text-[var(--text2)]">
                        {new Date(p.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
