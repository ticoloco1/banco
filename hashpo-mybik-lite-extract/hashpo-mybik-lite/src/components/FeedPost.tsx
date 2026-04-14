import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bold, Italic, Underline, Pin, Send, Trash2, Smile,
  Image, Video, Highlighter, Clock, X
} from "lucide-react";

const EMOJI_LIST = ["😀","😎","🔥","❤️","👏","🚀","💡","🎯","💎","⭐","✅","🎉","💪","👀","🤝","🏠","💰","📊","🌟","🎨"];
const MAX_PHOTOS = 4;

interface FeedProps {
  siteId: string;
  userId: string;
  isOwner: boolean;
  accentColor?: string;
  textColor?: string;
  feedMode?: "hybrid" | "7d" | "365d" | "dual";
}

function CountdownClock({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expirado");
        setIsExpired(true);
        setIsUrgent(false);
        return;
      }
      setIsExpired(false);
      setIsUrgent(diff < 86400000);
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) {
        setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
      } else if (h > 0) {
        setTimeLeft(`${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft(`${m}m ${s}s`);
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider transition-colors ${
        isExpired
          ? "bg-gray-500/20 text-gray-400"
          : isUrgent
            ? "bg-red-500/20 text-red-400 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]"
            : "bg-white text-[#0066ff] shadow-[0_0_10px_rgba(0,102,255,0.5)] border border-[#0066ff]/30"
      }`}
      style={!isExpired && !isUrgent ? { textShadow: "0 0 8px rgba(0,102,255,0.8)" } : undefined}
    >
      <Clock className="w-2.5 h-2.5 shrink-0" />
      {timeLeft}
    </div>
  );
}

function RichText({ content, highlight }: { content: string; highlight?: string | null }) {
  const html = content
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/__(.+?)__/g, "<u>$1</u>")
    .replace(/==(.+?)==/g, `<mark style="background:#FFE500;color:#000;padding:0 3px;border-radius:2px">$1</mark>`)
    .replace(/\n/g, "<br/>");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function VideoEmbed({ url }: { url: string }) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
        <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${ytMatch[1]}?rel=0`} allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
      </div>
    );
  }
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
        <iframe className="absolute inset-0 w-full h-full" src={`https://player.vimeo.com/video/${vimeoMatch[1]}`} allowFullScreen />
      </div>
    );
  }
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
    return <video controls className="w-full rounded-xl max-h-80 bg-black"><source src={url} /></video>;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-blue-400 hover:underline">
      <Video className="w-4 h-4" /> {url}
    </a>
  );
}

export default function Feed({ siteId, userId, isOwner, accentColor = "#a855f7", textColor, feedMode = "hybrid" }: FeedProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [pinPost, setPinPost] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { data: posts } = useQuery({
    queryKey: ["feed-posts", siteId],
    queryFn: async () => {
      const { data } = await supabase
        .from("feed_posts").select("*").eq("site_id", siteId)
        .gte("expires_at", new Date().toISOString())
        .order("pinned", { ascending: false }).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!siteId,
    refetchInterval: 30000,
  });

  const createPost = useMutation({
    mutationFn: async () => {
      if (!content.trim()) throw new Error("Conteúdo obrigatório");
      if (!user?.id) throw new Error("Faça login para publicar.");
      const fallbackImage = photos.length > 0 ? photos[0] : null;
      const { error } = await supabase.from("feed_posts").insert({
        user_id: user.id, site_id: siteId, content: content.trim(),
        image_url: fallbackImage,
        photo_urls: photos.length > 0 ? photos : null,
        video_embed_url: videoUrl.trim() || null,
        pinned: pinPost,
        pinned_until: pinPost ? new Date(Date.now() + 365 * 86400000).toISOString() : null,
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed-posts", siteId] });
      setContent(""); setPhotos([]); setVideoUrl(""); setPinPost(false); setShowVideo(false);
      toast.success("Post publicado! Expira em 7 dias.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("feed_posts").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed-posts", siteId] }),
  });

  const applyFormat = (tag: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = content.substring(start, end) || "texto";
    let wrapped = sel;
    if (tag === "bold") wrapped = `**${sel}**`;
    else if (tag === "italic") wrapped = `*${sel}*`;
    else if (tag === "underline") wrapped = `__${sel}__`;
    else if (tag === "highlight") wrapped = `==${sel}==`;
    setContent(content.substring(0, start) + wrapped + content.substring(end));
    setTimeout(() => { ta.focus(); }, 10);
  };

  const handlePhotoUpload = async (file: File) => {
    if (!user?.id) {
      toast.error("Faça login para enviar imagens.");
      return;
    }
    if (photos.length >= MAX_PHOTOS) { toast.error(`Máximo ${MAX_PHOTOS} fotos`); return; }
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/feed/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("platform-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("platform-assets").getPublicUrl(path);
      setPhotos(p => [...p, data.publicUrl]);
    } catch (e: any) { toast.error(e.message); }
    setUploadingPhoto(false);
  };

  const txtStyle = textColor && textColor !== "auto" ? { color: textColor } : {};

  const allPosts = (posts || []) as any[];
  const pinnedPosts = allPosts.filter((post) => post.pinned);
  const regularPosts = allPosts.filter((post) => !post.pinned);
  const visiblePosts =
    feedMode === "7d" ? regularPosts :
    feedMode === "365d" ? pinnedPosts :
    allPosts;

  return (
    <div className="space-y-3">
      {isOwner && (
        <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 space-y-3">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 flex-wrap">
            <button onClick={() => applyFormat("bold")} title="Negrito" className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"><Bold className="w-3.5 h-3.5" /></button>
            <button onClick={() => applyFormat("italic")} title="Itálico" className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"><Italic className="w-3.5 h-3.5" /></button>
            <button onClick={() => applyFormat("underline")} title="Sublinhado" className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"><Underline className="w-3.5 h-3.5" /></button>
            {/* Caneta de destaque amarela */}
            <button onClick={() => applyFormat("highlight")} title="Caneta amarela (==texto==)" className="p-1.5 rounded hover:bg-yellow-400/20 relative group">
              <Highlighter className="w-3.5 h-3.5 text-yellow-400" />
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-1 bg-yellow-400 rounded-full opacity-80" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <label title={`Foto (${photos.length}/${MAX_PHOTOS})`} className={`p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer ${photos.length >= MAX_PHOTOS ? "opacity-30 cursor-not-allowed" : ""}`}>
              <Image className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" className="hidden" disabled={uploadingPhoto || photos.length >= MAX_PHOTOS}
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ""; }} />
            </label>
            <button onClick={() => setShowVideo(v => !v)} title="Embed vídeo" className={`p-1.5 rounded ${showVideo ? "text-blue-400 bg-blue-400/10" : "hover:bg-white/10 text-white/70 hover:text-white"}`}>
              <Video className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setShowEmoji(v => !v)} className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"><Smile className="w-3.5 h-3.5" /></button>
            <div className="flex-1" />
            <span className="text-[10px] text-white/30">{content.length}/500</span>
          </div>
          {showEmoji && (
            <div className="flex flex-wrap gap-1.5 p-2 bg-white/5 rounded-lg border border-white/10">
              {EMOJI_LIST.map(e => <button key={e} onClick={() => { setContent(c => c + e); setShowEmoji(false); }} className="text-lg hover:scale-125 transition-transform">{e}</button>)}
            </div>
          )}
          <textarea ref={textareaRef} value={content} onChange={e => setContent(e.target.value)}
            placeholder={"**negrito**, *itálico*, __sublinhado__, ==destacar em amarelo=="}
            maxLength={500} rows={3}
            className="w-full bg-transparent border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-white/20" />
          {showVideo && (
            <div className="flex gap-2 items-center">
              <Video className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="YouTube, Vimeo ou .mp4"
                className="flex-1 h-8 px-3 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-400/30" />
              {videoUrl && <button onClick={() => setVideoUrl("")}><X className="w-3.5 h-3.5 text-white/40" /></button>}
            </div>
          )}
          {photos.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5">
              {photos.map((url, i) => (
                <div key={i} className="relative group aspect-square">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 p-0.5 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="aspect-square border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center cursor-pointer hover:border-white/40">
                  <Image className="w-5 h-5 text-white/20" />
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ""; }} />
                </label>
              )}
            </div>
          )}
          {/* Hint */}
          <div className="text-[9px] text-white/25 flex flex-wrap gap-x-3">
            <span><span className="text-white/40">**</span>negrito<span className="text-white/40">**</span></span>
            <span><span className="text-white/40">*</span>itálico<span className="text-white/40">*</span></span>
            <span><span className="text-white/40">__</span>sublinhado<span className="text-white/40">__</span></span>
            <span><span className="text-yellow-400/60">==</span>destaque<span className="text-yellow-400/60">==</span></span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer select-none">
              <input type="checkbox" checked={pinPost} onChange={e => setPinPost(e.target.checked)} className="rounded" />
              <Pin className="w-3 h-3" /> Fixar 365d ($10)
            </label>
            <button onClick={() => createPost.mutate()} disabled={!content.trim() || createPost.isPending}
              className="flex items-center gap-1.5 px-4 py-2 font-bold text-xs rounded-lg hover:opacity-90 disabled:opacity-40 text-white"
              style={{ backgroundColor: accentColor }}>
              <Send className="w-3.5 h-3.5" /> Publicar
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      {feedMode === "dual" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-3 max-h-[700px] overflow-y-auto scrollbar-hide pr-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/60">Janela 7 dias</div>
            {regularPosts.map((post: any) => {
              const postPhotos: string[] =
                Array.isArray(post.photo_urls) && post.photo_urls.length > 0
                  ? post.photo_urls
                  : post.image_url
                    ? [post.image_url]
                    : [];
              return (
                <div key={post.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-white/40">{new Date(post.created_at).toLocaleDateString("pt-BR")}</span>
                      {post.expires_at && <CountdownClock expiresAt={post.expires_at} />}
                    </div>
                    {isOwner && (
                      <button onClick={() => { if (confirm("Excluir?")) deletePost.mutate(post.id); }} className="text-white/20 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="text-sm leading-relaxed" style={txtStyle}>
                    <RichText content={post.content} highlight={post.highlight_color} />
                  </div>
                  {postPhotos.length > 0 && (
                    <div className={`grid gap-1.5 ${postPhotos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                      {postPhotos.map((url: string, i: number) => (
                        <div key={i} className={`overflow-hidden rounded-xl bg-black/20 ${postPhotos.length === 3 && i === 0 ? "col-span-2" : ""}`}
                          style={{ aspectRatio: postPhotos.length === 1 ? "16/9" : "1/1" }}>
                          <img src={url} alt="" className="w-full h-full object-contain" />
                        </div>
                      ))}
                    </div>
                  )}
                  {post.video_embed_url && <VideoEmbed url={post.video_embed_url} />}
                </div>
              );
            })}
          </div>
          <div className="space-y-3 max-h-[700px] overflow-y-auto scrollbar-hide pr-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-300">Janela 365 dias (fixados)</div>
            {pinnedPosts.map((post: any) => {
              const postPhotos: string[] =
                Array.isArray(post.photo_urls) && post.photo_urls.length > 0
                  ? post.photo_urls
                  : post.image_url
                    ? [post.image_url]
                    : [];
              return (
                <div key={post.id} className="bg-white/5 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Pin className="w-3 h-3 text-yellow-400" />
                      <span className="text-[10px] text-white/40">{new Date(post.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                    {isOwner && (
                      <button onClick={() => { if (confirm("Excluir?")) deletePost.mutate(post.id); }} className="text-white/20 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="text-sm leading-relaxed" style={txtStyle}>
                    <RichText content={post.content} highlight={post.highlight_color} />
                  </div>
                  {postPhotos.length > 0 && (
                    <div className={`grid gap-1.5 ${postPhotos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                      {postPhotos.map((url: string, i: number) => (
                        <div key={i} className={`overflow-hidden rounded-xl bg-black/20 ${postPhotos.length === 3 && i === 0 ? "col-span-2" : ""}`}
                          style={{ aspectRatio: postPhotos.length === 1 ? "16/9" : "1/1" }}>
                          <img src={url} alt="" className="w-full h-full object-contain" />
                        </div>
                      ))}
                    </div>
                  )}
                  {post.video_embed_url && <VideoEmbed url={post.video_embed_url} />}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
      <div className="space-y-3 max-h-[700px] overflow-y-auto scrollbar-hide pr-1">
        {visiblePosts.map((post: any) => {
          const postPhotos: string[] =
            Array.isArray(post.photo_urls) && post.photo_urls.length > 0
              ? post.photo_urls
              : post.image_url
                ? [post.image_url]
                : [];
          return (
            <div key={post.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {post.pinned && <Pin className="w-3 h-3 text-yellow-400" />}
                  <span className="text-[10px] text-white/40">{new Date(post.created_at).toLocaleDateString("pt-BR")}</span>
                  {post.expires_at && <CountdownClock expiresAt={post.expires_at} />}
                </div>
                {isOwner && (
                  <button onClick={() => { if (confirm("Excluir?")) deletePost.mutate(post.id); }} className="text-white/20 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="text-sm leading-relaxed" style={txtStyle}>
                <RichText content={post.content} highlight={post.highlight_color} />
              </div>
              {postPhotos.length > 0 && (
                <div className={`grid gap-1.5 ${postPhotos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {postPhotos.map((url: string, i: number) => (
                    <div key={i} className={`overflow-hidden rounded-xl bg-black/20 ${postPhotos.length === 3 && i === 0 ? "col-span-2" : ""}`}
                      style={{ aspectRatio: postPhotos.length === 1 ? "16/9" : "1/1" }}>
                      <img src={url} alt="" className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              )}
              {post.video_embed_url && <VideoEmbed url={post.video_embed_url} />}
            </div>
          );
        })}
        {visiblePosts.length === 0 && (
          <div className="text-center py-10 text-white/20 text-xs">
            <p>Nenhum post ainda.</p>
            {isOwner && <p className="text-[10px] mt-1">Posts expiram em 7 dias. Fixe por 365 dias com $10.</p>}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
