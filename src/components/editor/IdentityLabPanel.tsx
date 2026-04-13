'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Loader2, Mic, Sparkles, Upload, Video, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/store/cart';
import { PLATFORM_USD } from '@/lib/platformPricing';
import {
  IDENTITY_STYLE_PRESETS,
  VOICE_EFFECT_IDS,
  type IdentityStyleId,
  type VoiceEffectId,
} from '@/lib/identityStylePresets';
import { playBufferWithVoiceEffect } from '@/lib/browserVoiceEffects';
import { getAssetUrl } from '@/lib/getAssetUrl';
import { measureVideoFileDurationSec } from '@/lib/clientVideoDuration';

type Props = {
  siteId: string;
  slug: string;
  aiFreeUsd: number;
  aiPaidUsd: number;
  identityPortraitUrl: string;
  setIdentityPortraitUrl: (v: string) => void;
  identityStylePreset: IdentityStyleId;
  setIdentityStylePreset: (v: IdentityStyleId) => void;
  identityVoiceEffect: VoiceEffectId;
  setIdentityVoiceEffect: (v: VoiceEffectId) => void;
  identityCloneVoiceId: string;
  setAvatarUrl: (v: string) => void;
  uploadToStorage: (file: File, folder: string) => Promise<string>;
  onMarkDirty: () => void;
  onReload: () => Promise<void>;
  T: (key: string) => string;
  /** false = não chamar APIs de IA (retrato, clone, greeting). */
  iaApiEnabled?: boolean;
  avatarVideoUrl: string;
  setAvatarVideoUrl: (v: string) => void;
  /** Add-on pago: gravação na câmara até ~2 min até esta data (ISO). */
  profileLoopVideoExtendedUntil?: string | null;
};

const LANGS = [
  { id: 'pt', labelKey: 'id_lang_pt' },
  { id: 'en', labelKey: 'id_lang_en' },
  { id: 'ja', labelKey: 'id_lang_ja' },
  { id: 'ko', labelKey: 'id_lang_ko' },
] as const;

function effectLabelKey(id: VoiceEffectId): string {
  const map: Record<VoiceEffectId, string> = {
    neutral: 'id_voice_effect_neutral',
    buccaneer: 'id_voice_effect_buccaneer',
    glitch: 'id_voice_effect_glitch',
    manga_hero: 'id_voice_effect_manga',
    galactic_knight: 'id_voice_effect_galactic',
  };
  return map[id];
}

export function IdentityLabPanel({
  siteId,
  slug,
  aiFreeUsd,
  aiPaidUsd,
  identityPortraitUrl,
  setIdentityPortraitUrl,
  identityStylePreset,
  setIdentityStylePreset,
  identityVoiceEffect,
  setIdentityVoiceEffect,
  identityCloneVoiceId,
  setAvatarUrl,
  uploadToStorage,
  onMarkDirty,
  onReload,
  T,
  iaApiEnabled = true,
  avatarVideoUrl,
  setAvatarVideoUrl,
  profileLoopVideoExtendedUntil = null,
}: Props) {
  const addCartItem = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);

  const profileLoopExtendedActive = useMemo(() => {
    const s = typeof profileLoopVideoExtendedUntil === 'string' ? profileLoopVideoExtendedUntil.trim() : '';
    if (!s) return false;
    const t = Date.parse(s);
    return Number.isFinite(t) && t > Date.now();
  }, [profileLoopVideoExtendedUntil]);

  const profileLoopMaxRecordMs = profileLoopExtendedActive ? 120_000 : 20_000;

  const addProfileLoopAddonMonthly = () => {
    addCartItem({
      id: `profile_loop_video_${siteId}_mo`,
      label: T('cart_label_profile_loop_video_mo'),
      price: PLATFORM_USD.profileLoopVideoExtendedMonthly,
      type: 'profile_loop_video',
    });
    openCart();
  };

  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [portraitBusy, setPortraitBusy] = useState(false);
  const [cloneBusy, setCloneBusy] = useState(false);
  const [greetingBusy, setGreetingBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [videoLoopBusy, setVideoLoopBusy] = useState(false);
  const [greetingLang, setGreetingLang] = useState<(typeof LANGS)[number]['id']>('pt');
  const mediaRef = useRef<MediaRecorder | null>(null);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioCloneInputRef = useRef<HTMLInputElement>(null);
  const videoLoopInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const profileLoopPreviewRef = useRef<HTMLVideoElement>(null);
  const profileLoopStreamRef = useRef<MediaStream | null>(null);
  const profileLoopMrRef = useRef<MediaRecorder | null>(null);
  const profileLoopChunksRef = useRef<BlobPart[]>([]);
  const profileLoopMaxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOpen, setCamOpen] = useState(false);
  const [profileLoopCamOpen, setProfileLoopCamOpen] = useState(false);
  const [profileLoopCamBusy, setProfileLoopCamBusy] = useState(false);
  const [profileLoopRecording, setProfileLoopRecording] = useState(false);
  const [camBusy, setCamBusy] = useState(false);
  const [sourceCaptureBusy, setSourceCaptureBusy] = useState(false);

  type IdCaps = { replicate: boolean; elevenlabs: boolean; platformTextAi: boolean };
  const [idCaps, setIdCaps] = useState<IdCaps | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/identity/capabilities')
      .then((r) => r.json())
      .then((d: Partial<IdCaps>) => {
        if (cancelled) return;
        if (
          typeof d.replicate === 'boolean' &&
          typeof d.elevenlabs === 'boolean' &&
          typeof d.platformTextAi === 'boolean'
        ) {
          setIdCaps(d as IdCaps);
        }
      })
      .catch(() => {
        if (!cancelled) setIdCaps(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stopSourceCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOpen(false);
  }, []);

  const stopProfileLoopCamera = useCallback(() => {
    if (profileLoopMaxTimerRef.current != null) {
      clearTimeout(profileLoopMaxTimerRef.current);
      profileLoopMaxTimerRef.current = null;
    }
    const mr = profileLoopMrRef.current;
    if (mr && mr.state !== 'inactive') {
      try {
        mr.stop();
      } catch {
        /* ignore */
      }
    }
    profileLoopMrRef.current = null;
    profileLoopChunksRef.current = [];
    profileLoopStreamRef.current?.getTracks().forEach((t) => t.stop());
    profileLoopStreamRef.current = null;
    if (profileLoopPreviewRef.current) profileLoopPreviewRef.current.srcObject = null;
    setProfileLoopRecording(false);
    setProfileLoopCamOpen(false);
  }, []);

  useEffect(() => () => stopSourceCamera(), [stopSourceCamera]);
  useEffect(() => () => stopProfileLoopCamera(), [stopProfileLoopCamera]);

  const onPickSource = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    const looksImage =
      (f?.type && f.type.startsWith('image/')) ||
      /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(f?.name || '');
    if (!f || !looksImage) {
      toast.error(T('id_err_image'));
      return;
    }
    try {
      const url = await uploadToStorage(f, 'identity-source');
      setSourcePreview(url);
      onMarkDirty();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : T('id_err_upload'));
    }
    e.target.value = '';
  };

  const openSourceCamera = async () => {
    if (profileLoopCamOpen) return;
    setCamBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCamOpen(true);
      requestAnimationFrame(() => {
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          void v.play().catch(() => {});
        }
      });
    } catch {
      toast.error(T('studio_err_camera'));
    } finally {
      setCamBusy(false);
    }
  };

  const captureSourcePhoto = async () => {
    const v = videoRef.current;
    if (!v || v.videoWidth < 2) {
      toast.error(T('studio_err_camera_ready'));
      return;
    }
    setSourceCaptureBusy(true);
    try {
      const c = document.createElement('canvas');
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.drawImage(v, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => c.toBlob(resolve, 'image/jpeg', 0.92));
      if (!blob) throw new Error('blob');
      stopSourceCamera();
      const file = new File([blob], `identity-source-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = await uploadToStorage(file, 'identity-source');
      setSourcePreview(url);
      onMarkDirty();
      toast.success(T('id_toast_source_ok'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : T('id_err_upload'));
    } finally {
      setSourceCaptureBusy(false);
    }
  };

  const openProfileLoopCamera = async () => {
    if (camOpen) return;
    setProfileLoopCamBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 854, max: 1280 },
          height: { ideal: 480, max: 720 },
        },
        audio: false,
      });
      profileLoopStreamRef.current = stream;
      setProfileLoopCamOpen(true);
      requestAnimationFrame(() => {
        const v = profileLoopPreviewRef.current;
        if (v) {
          v.srcObject = stream;
          void v.play().catch(() => {});
        }
      });
    } catch {
      toast.error(T('id_err_profile_video_record'));
    } finally {
      setProfileLoopCamBusy(false);
    }
  };

  const finishProfileLoopRecorder = async (action: 'upload' | 'discard') => {
    if (profileLoopMaxTimerRef.current != null) {
      clearTimeout(profileLoopMaxTimerRef.current);
      profileLoopMaxTimerRef.current = null;
    }
    const mr = profileLoopMrRef.current;
    if (!mr || mr.state === 'inactive') {
      if (action === 'discard') stopProfileLoopCamera();
      return;
    }
    setProfileLoopRecording(false);
    const mimeHold = mr.mimeType && mr.mimeType.length > 0 ? mr.mimeType : 'video/webm';
    await new Promise<void>((resolve) => {
      mr.onstop = () => resolve();
      try {
        mr.requestData?.();
      } catch {
        /* Safari */
      }
      try {
        mr.stop();
      } catch {
        resolve();
      }
    });
    profileLoopMrRef.current = null;
    const chunks = profileLoopChunksRef.current.slice();
    profileLoopChunksRef.current = [];

    if (action === 'discard') {
      stopProfileLoopCamera();
      return;
    }

    const blob = new Blob(chunks, { type: mimeHold });
    if (blob.size < 30_000) {
      toast.error(T('id_err_profile_video_short'));
      stopProfileLoopCamera();
      return;
    }
    if (blob.size > 28 * 1024 * 1024) {
      toast.error(T('id_err_profile_video_large'));
      stopProfileLoopCamera();
      return;
    }

    const ext = mimeHold.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([blob], `avatar-loop-${Date.now()}.${ext}`, { type: mimeHold });
    setVideoLoopBusy(true);
    const tid = toast.loading(T('id_toast_profile_video_transcoding'));
    try {
      const { prepareAvatarLoopVideoForUpload } = await import('@/lib/avatarVideoTranscode');
      const prepared = await prepareAvatarLoopVideoForUpload(file, {
        onPhase: (phase) => {
          if (phase === 'encoding') {
            toast.loading(T('id_toast_profile_video_transcoding_encode'), { id: tid });
          }
        },
      });
      const url = await uploadToStorage(prepared, 'avatar-loop');
      setAvatarVideoUrl(url);
      onMarkDirty();
      toast.success(T('id_toast_profile_video_ok'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : T('id_err_upload'));
    } finally {
      toast.dismiss(tid);
      setVideoLoopBusy(false);
      stopProfileLoopCamera();
    }
  };

  const startProfileLoopRecording = () => {
    if (typeof MediaRecorder === 'undefined') {
      toast.error(T('id_err_profile_video_record'));
      return;
    }
    const stream = profileLoopStreamRef.current;
    if (!stream) return;
    const v = profileLoopPreviewRef.current;
    if (!v || v.videoWidth < 2) {
      toast.error(T('studio_err_camera_ready'));
      return;
    }
    if (profileLoopMrRef.current && profileLoopMrRef.current.state !== 'inactive') return;

    const mimeCandidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    let mime: string | undefined;
    for (const m of mimeCandidates) {
      if (MediaRecorder.isTypeSupported(m)) {
        mime = m;
        break;
      }
    }
    if (!mime) {
      toast.error(T('id_err_profile_video_record'));
      return;
    }
    try {
      const mr = new MediaRecorder(stream, { mimeType: mime });
      profileLoopMrRef.current = mr;
      profileLoopChunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data.size) profileLoopChunksRef.current.push(ev.data);
      };
      mr.start(250);
      setProfileLoopRecording(true);
      profileLoopMaxTimerRef.current = setTimeout(() => {
        if (mr.state === 'recording') void finishProfileLoopRecorder('upload');
      }, profileLoopMaxRecordMs);
    } catch {
      toast.error(T('id_err_profile_video_record'));
    }
  };

  const onPickProfileLoopVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.type.startsWith('video/') === false && !/\.(mp4|webm|mov|quicktime)$/i.test(f.name)) {
      toast.error(T('id_err_profile_video_type'));
      return;
    }
    if (f.size > 28 * 1024 * 1024) {
      toast.error(T('id_err_profile_video_large'));
      return;
    }
    setVideoLoopBusy(true);
    try {
      const maxSec = profileLoopMaxRecordMs / 1000;
      let sec = 0;
      try {
        sec = await measureVideoFileDurationSec(f);
      } catch {
        toast.error(T('id_err_profile_video_type'));
        return;
      }
      if (sec > maxSec + 0.25) {
        toast.error(T('id_err_profile_video_max_duration').replace('{max}', String(maxSec)));
        return;
      }
      const tid = toast.loading(T('id_toast_profile_video_transcoding'));
      try {
        const { prepareAvatarLoopVideoForUpload } = await import('@/lib/avatarVideoTranscode');
        const prepared = await prepareAvatarLoopVideoForUpload(f, {
          onPhase: (phase) => {
            if (phase === 'encoding') {
              toast.loading(T('id_toast_profile_video_transcoding_encode'), { id: tid });
            }
          },
        });
        const url = await uploadToStorage(prepared, 'avatar-loop');
        setAvatarVideoUrl(url);
        onMarkDirty();
        toast.success(T('id_toast_profile_video_ok'));
      } finally {
        toast.dismiss(tid);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : T('id_err_upload'));
    } finally {
      setVideoLoopBusy(false);
    }
  };

  const onPickAudioClone = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f?.type?.startsWith('video/')) {
      toast.error(T('id_err_audio_is_video'));
      return;
    }
    const looksAudio =
      (f?.type && f.type.startsWith('audio/')) ||
      /\.(m4a|mp3|wav|webm|ogg|aac|flac|caf)$/i.test(f?.name || '');
    if (!f || !looksAudio) {
      toast.error(T('id_err_audio_type'));
      return;
    }
    if (f.size < 5000) {
      toast.error(T('id_err_audio_short'));
      return;
    }
    if (f.size > 12 * 1024 * 1024) {
      toast.error(T('id_err_audio_large'));
      return;
    }
    if (!iaApiEnabled) {
      toast.message(T('ed_ia_master_off_hint'));
      return;
    }
    setCloneBusy(true);
    try {
      const fd = new FormData();
      fd.append('siteId', siteId);
      fd.append('file', f);
      const res = await fetch('/api/identity/voice-clone', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 402) toast.error(T('id_err_ia_budget'));
        else toast.error(typeof data.error === 'string' ? data.error : T('id_err_clone'));
        return;
      }
      toast.success(T('id_toast_clone_ok'));
      await onReload();
    } catch {
      toast.error(T('id_err_clone'));
    } finally {
      setCloneBusy(false);
    }
  };

  const runGeneratePortrait = async () => {
    if (!iaApiEnabled) {
      toast.message(T('ed_ia_master_off_hint'));
      return;
    }
    if (!sourcePreview) {
      toast.error(T('id_err_need_photo'));
      return;
    }
    setPortraitBusy(true);
    try {
      const res = await fetch('/api/identity/generate-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          imageUrl: sourcePreview,
          stylePreset: identityStylePreset,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 402) toast.error(T('id_err_ia_budget'));
        else toast.error(typeof data.error === 'string' ? data.error : T('id_err_generic'));
        return;
      }
      const u = typeof data.portraitUrl === 'string' ? data.portraitUrl : '';
      if (u) {
        setIdentityPortraitUrl(u);
        onMarkDirty();
        toast.success(T('id_toast_portrait_ok'));
        await onReload();
      }
    } catch {
      toast.error(T('id_err_generic'));
    } finally {
      setPortraitBusy(false);
    }
  };

  const usePortraitAsAvatar = () => {
    if (!identityPortraitUrl) return;
    setAvatarUrl(identityPortraitUrl);
    onMarkDirty();
    toast.success(T('id_toast_avatar_ok'));
  };

  const startRecord = async () => {
    if (recording) return;
    const prevMr = mediaRef.current;
    if (prevMr && prevMr.state !== 'inactive') {
      try {
        prevMr.stop();
      } catch {
        /* ignore */
      }
    }
    recordStreamRef.current?.getTracks().forEach((t) => t.stop());
    recordStreamRef.current = null;
    mediaRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordStreamRef.current = stream;
      chunksRef.current = [];
      const mimeCandidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
      let mime: string | undefined;
      for (const m of mimeCandidates) {
        if (MediaRecorder.isTypeSupported(m)) {
          mime = m;
          break;
        }
      }
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRef.current = mr;
      mr.ondataavailable = (ev) => {
        if (ev.data.size) chunksRef.current.push(ev.data);
      };
      mr.start(1000);
      setRecording(true);
    } catch {
      toast.error(T('id_err_mic'));
    }
  };

  const stopRecordAndClone = async () => {
    const mr = mediaRef.current;
    if (!mr || mr.state === 'inactive') {
      setRecording(false);
      recordStreamRef.current?.getTracks().forEach((t) => t.stop());
      recordStreamRef.current = null;
      return;
    }
    setRecording(false);
    const stream = mr.stream;
    await new Promise<void>((resolve) => {
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        recordStreamRef.current = null;
        resolve();
      };
      try {
        mr.requestData?.();
      } catch {
        /* Safari antigo */
      }
      mr.stop();
    });
    const blobType = mr.mimeType && mr.mimeType.length > 0 ? mr.mimeType : 'audio/webm';
    const blob = new Blob(chunksRef.current, { type: blobType });
    chunksRef.current = [];
    if (blob.size < 5000) {
      toast.error(T('id_err_audio_short'));
      return;
    }
    if (!iaApiEnabled) {
      toast.message(T('ed_ia_master_off_hint'));
      return;
    }
    setCloneBusy(true);
    try {
      const fd = new FormData();
      fd.append('siteId', siteId);
      const ext = blobType.includes('mp4') ? 'mp4' : blobType.includes('webm') ? 'webm' : 'webm';
      fd.append('file', new File([blob], `voice-sample.${ext}`, { type: blobType }));
      const res = await fetch('/api/identity/voice-clone', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 402) toast.error(T('id_err_ia_budget'));
        else toast.error(typeof data.error === 'string' ? data.error : T('id_err_clone'));
        return;
      }
      toast.success(T('id_toast_clone_ok'));
      await onReload();
    } catch {
      toast.error(T('id_err_clone'));
    } finally {
      setCloneBusy(false);
    }
  };

  const playGreetingPreview = async () => {
    if (!slug) return;
    if (!iaApiEnabled) {
      toast.message(T('ed_ia_master_off_hint'));
      return;
    }
    setGreetingBusy(true);
    try {
      const res = await fetch('/api/identity/greeting-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, lang: greetingLang }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 402) toast.error(T('id_err_ia_budget'));
        else toast.error(typeof data.error === 'string' ? data.error : T('id_err_greeting'));
        return;
      }
      const buf = await res.arrayBuffer();
      const ctx = new AudioContext();
      try {
        const audioBuf = await ctx.decodeAudioData(buf.slice(0));
        await playBufferWithVoiceEffect(ctx, audioBuf, identityVoiceEffect);
      } finally {
        void ctx.close();
      }
    } catch {
      toast.error(T('id_err_greeting'));
    } finally {
      setGreetingBusy(false);
    }
  };

  /** Saudação com voz do sistema (grátis) — texto via IA da plataforma, sem ElevenLabs. */
  const playGreetingBrowser = async () => {
    if (!slug.trim()) return;
    setGreetingBusy(true);
    try {
      const res = await fetch('/api/identity/greeting-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug.trim(), lang: greetingLang }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; text?: string };
      if (!res.ok) {
        toast.error(typeof data.error === 'string' ? data.error : T('id_err_greeting'));
        return;
      }
      const text = String(data.text || '').trim();
      if (!text) {
        toast.error(T('id_err_greeting'));
        return;
      }
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        toast.error(T('id_err_browser_tts'));
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang =
        greetingLang === 'pt' ? 'pt-BR' : greetingLang === 'en' ? 'en-US' : greetingLang === 'ja' ? 'ja-JP' : 'ko-KR';
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    } catch {
      toast.error(T('id_err_greeting'));
    } finally {
      setGreetingBusy(false);
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="font-black text-lg text-[var(--text)] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          {T('ed_identity_title')}
        </h2>
        <p className="text-xs text-[var(--text2)] mt-2 leading-relaxed border-l-2 border-amber-500/40 pl-3 py-0.5">
          {T('ed_identity_intro')}
        </p>
        {!iaApiEnabled ? (
          <p className="text-xs font-semibold text-amber-400/95 mt-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2">
            {T('ed_identity_ia_off_banner')}
          </p>
        ) : null}
      </div>

      {idCaps ? (
        <div className="rounded-xl border border-[var(--border)] p-4 space-y-2 bg-[var(--bg2)]/50">
          <p className="text-xs font-bold text-[var(--text)]">{T('ed_identity_apis_title')}</p>
          <ul className="text-[11px] text-[var(--text2)] space-y-1.5 leading-relaxed">
            <li className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
              <span className="font-semibold text-[var(--text)] shrink-0">{T('ed_identity_api_replicate')}</span>
              <span className={idCaps.replicate ? 'text-emerald-500 font-semibold' : 'text-amber-500 font-semibold'}>
                {idCaps.replicate ? T('ed_identity_api_ok') : T('ed_identity_api_missing')}
              </span>
            </li>
            <li className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
              <span className="font-semibold text-[var(--text)] shrink-0">{T('ed_identity_api_eleven')}</span>
              <span className={idCaps.elevenlabs ? 'text-emerald-500 font-semibold' : 'text-amber-500 font-semibold'}>
                {idCaps.elevenlabs ? T('ed_identity_api_ok') : T('ed_identity_api_missing')}
              </span>
            </li>
            <li className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
              <span className="font-semibold text-[var(--text)] shrink-0">{T('ed_identity_api_deepseek')}</span>
              <span className={idCaps.platformTextAi ? 'text-emerald-500 font-semibold' : 'text-amber-500 font-semibold'}>
                {idCaps.platformTextAi ? T('ed_identity_api_ok') : T('ed_identity_api_missing')}
              </span>
            </li>
          </ul>
          <p className="text-[10px] text-[var(--text2)] opacity-90 font-mono break-all">{T('ed_identity_api_hint_vars')}</p>
        </div>
      ) : null}

      <div className="rounded-xl border border-[var(--border)] p-4 space-y-3 bg-[var(--bg2)]/40">
        <p className="text-sm font-bold text-[var(--text)]">{T('ed_identity_credits_title')}</p>
        <p className="text-sm text-[var(--text)] tabular-nums">
          <span className="font-bold text-brand">US${aiFreeUsd.toFixed(2)}</span>
          <span className="text-[var(--text2)]"> {T('ed_identity_ia_free_label')} </span>
          <span className="text-[var(--text2)]">·</span>
          <span className="font-bold text-brand"> US${aiPaidUsd.toFixed(2)}</span>
          <span className="text-[var(--text2)]"> {T('ed_identity_ia_paid_label')}</span>
        </p>
        <p className="text-[11px] text-[var(--text2)]">{T('ed_identity_credits_hint')}</p>
        <a href="/creditos" className="text-xs font-semibold text-brand hover:underline">
          {T('ed_identity_credits_link')}
        </a>
        {aiFreeUsd + aiPaidUsd < 0.005 ? (
          <p className="text-[11px] text-amber-400/95 font-semibold leading-relaxed border border-amber-500/30 rounded-lg px-3 py-2 mt-2 bg-amber-500/10">
            {T('ed_identity_budget_zero_hint')}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-bold text-[var(--text)]">{T('ed_identity_image_block')}</p>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickSource} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary text-sm" onClick={() => fileInputRef.current?.click()}>
            {T('ed_identity_upload_source')}
          </button>
          <button
            type="button"
            disabled={camBusy}
            onClick={() => void openSourceCamera()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold hover:border-amber-500/50"
          >
            {camBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {T('ed_identity_cam_open')}
          </button>
        </div>
        {sourcePreview ? (
          <div className="flex gap-4 items-start flex-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getAssetUrl(sourcePreview)} alt="" className="w-28 h-28 rounded-xl object-cover border border-[var(--border)]" />
            <div className="space-y-2 flex-1 min-w-[200px]">
              <label className="label block">{T('ed_identity_style')}</label>
              <select
                className="input"
                value={identityStylePreset}
                onChange={(e) => {
                  setIdentityStylePreset(e.target.value as IdentityStyleId);
                  onMarkDirty();
                }}
              >
                {IDENTITY_STYLE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {T(p.labelKey)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={portraitBusy || !iaApiEnabled}
                onClick={() => void runGeneratePortrait()}
                className="btn-primary gap-2 text-sm mt-2"
              >
                {portraitBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {portraitBusy ? T('ed_identity_generating') : T('ed_identity_generate')}
              </button>
            </div>
          </div>
        ) : null}

        {identityPortraitUrl ? (
          <div className="rounded-xl border border-[var(--border)] p-4 flex flex-wrap gap-4 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getAssetUrl(identityPortraitUrl)} alt="" className="w-32 h-32 rounded-xl object-cover border border-[var(--border)]" />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--text2)]">{T('ed_identity_portrait')}</p>
              <button type="button" onClick={usePortraitAsAvatar} className="btn-primary text-sm">
                {T('ed_identity_use_avatar')}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 border-t border-[var(--border)] pt-6">
        <p className="text-sm font-bold text-[var(--text)]">{T('ed_identity_voice_title')}</p>
        <p className="text-[11px] text-[var(--text2)]">{T('ed_identity_record_hint')}</p>
        <input
          ref={audioCloneInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
          className="hidden"
          onChange={(ev) => void onPickAudioClone(ev)}
        />
        <div className="flex flex-wrap gap-2 items-center">
          {!recording ? (
            <button
              type="button"
              disabled={cloneBusy || !iaApiEnabled}
              onClick={() => void startRecord()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold hover:border-brand/50"
            >
              <Mic className="w-4 h-4" />
              {T('ed_identity_record_start')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void stopRecordAndClone()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-sm font-semibold"
            >
              {T('ed_identity_record_stop')}
            </button>
          )}
          <button
            type="button"
            disabled={cloneBusy || recording || !iaApiEnabled}
            onClick={() => audioCloneInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold hover:border-brand/50"
          >
            <Upload className="w-4 h-4" />
            {T('ed_identity_upload_audio')}
          </button>
          {cloneBusy ? <Loader2 className="w-5 h-5 animate-spin text-brand" /> : null}
        </div>
        {identityCloneVoiceId ? (
          <p className="text-xs font-mono text-green-400 break-all">
            {T('ed_identity_clone_voice_ok')}: {identityCloneVoiceId.slice(0, 12)}…
          </p>
        ) : (
          <p className="text-xs text-amber-400/90">{T('ed_identity_clone_missing')}</p>
        )}
      </div>

      <div className="space-y-3 border-t border-[var(--border)] pt-6">
        <p className="text-sm font-bold text-[var(--text)]">{T('ed_identity_profile_video_title')}</p>
        <p className="text-[11px] text-[var(--text2)] leading-relaxed">{T('ed_identity_profile_video_hint')}</p>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg2)]/50 px-3 py-2 space-y-2">
          {profileLoopExtendedActive ? (
            <p className="text-[11px] text-emerald-400/95 leading-relaxed">
              {T('ed_identity_profile_video_addon_active')}{' '}
              <span className="font-mono font-semibold">
                {(() => {
                  const s = typeof profileLoopVideoExtendedUntil === 'string' ? profileLoopVideoExtendedUntil.trim() : '';
                  const d = s ? new Date(s) : null;
                  return d && !Number.isNaN(d.getTime()) ? d.toLocaleString() : '—';
                })()}
              </span>
            </p>
          ) : (
            <>
              <p className="text-[11px] text-[var(--text2)] leading-relaxed">{T('ed_identity_profile_video_addon_hint')}</p>
              <button
                type="button"
                onClick={addProfileLoopAddonMonthly}
                className="btn-secondary text-xs font-semibold"
              >
                {T('ed_identity_profile_video_addon_cta').replace(
                  '${price}',
                  PLATFORM_USD.profileLoopVideoExtendedMonthly.toFixed(2),
                )}
              </button>
            </>
          )}
        </div>
        <input
          ref={videoLoopInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          className="hidden"
          onChange={(ev) => void onPickProfileLoopVideo(ev)}
        />
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            disabled={videoLoopBusy || profileLoopCamBusy}
            onClick={() => void openProfileLoopCamera()}
            className="flex items-center gap-2 btn-secondary text-sm"
          >
            {profileLoopCamBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {T('ed_identity_profile_video_record')}
          </button>
          <button
            type="button"
            disabled={videoLoopBusy || profileLoopCamBusy}
            onClick={() => videoLoopInputRef.current?.click()}
            className="flex items-center gap-2 btn-secondary text-sm"
          >
            {videoLoopBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            {T('ed_identity_profile_video_upload')}
          </button>
          {avatarVideoUrl ? (
            <button
              type="button"
              onClick={() => {
                setAvatarVideoUrl('');
                onMarkDirty();
              }}
              className="text-xs font-semibold text-red-400 hover:underline"
            >
              {T('ed_identity_profile_video_clear')}
            </button>
          ) : null}
        </div>
        {avatarVideoUrl ? (
          <video
            src={getAssetUrl(avatarVideoUrl)}
            className="w-full max-w-xs rounded-xl border border-[var(--border)] max-h-44 bg-black"
            controls
            muted
            loop
            playsInline
          />
        ) : null}
      </div>

      <div className="space-y-3 border-t border-[var(--border)] pt-6">
        <label className="label block">{T('ed_identity_effect')}</label>
        <select
          className="input"
          value={identityVoiceEffect}
          onChange={(e) => {
            setIdentityVoiceEffect(e.target.value as VoiceEffectId);
            onMarkDirty();
          }}
        >
          {VOICE_EFFECT_IDS.map((id) => (
            <option key={id} value={id}>
              {T(effectLabelKey(id))}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-[var(--text2)]">{T('ed_identity_effect_hint')}</p>

        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="label block text-xs">{T('ed_identity_lang')}</label>
            <select className="input" value={greetingLang} onChange={(e) => setGreetingLang(e.target.value as typeof greetingLang)}>
              {LANGS.map((l) => (
                <option key={l.id} value={l.id}>
                  {T(l.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={greetingBusy || !identityCloneVoiceId || !iaApiEnabled}
              onClick={() => void playGreetingPreview()}
              className="flex items-center gap-2 btn-primary text-sm"
            >
              {greetingBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
              {T('ed_identity_play_greeting')}
            </button>
            <button
              type="button"
              disabled={greetingBusy || !slug.trim()}
              onClick={() => void playGreetingBrowser()}
              className="flex items-center gap-2 btn-secondary text-sm"
            >
              {greetingBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
              {T('ed_identity_play_greeting_browser')}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-[var(--text2)] mt-1">{T('ed_identity_play_greeting_browser_hint')}</p>
      </div>

      {camOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          role="dialog"
          aria-modal
        >
          <div className="max-w-lg w-full rounded-2xl border border-[var(--border)] p-4 bg-[var(--bg)] space-y-3">
            <p className="text-sm font-bold text-[var(--text)]">{T('ed_identity_cam_title')}</p>
            <video ref={videoRef} playsInline muted className="w-full rounded-xl bg-black aspect-[4/3] object-cover" />
            <div className="flex flex-wrap gap-2 justify-end">
              <button type="button" className="btn-secondary text-sm" onClick={stopSourceCamera}>
                {T('ed_identity_cam_cancel')}
              </button>
              <button
                type="button"
                disabled={sourceCaptureBusy}
                onClick={() => void captureSourcePhoto()}
                className="btn-primary text-sm gap-2"
              >
                {sourceCaptureBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {T('ed_identity_cam_capture')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {profileLoopCamOpen ? (
        <div
          className="fixed inset-0 z-[201] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          role="dialog"
          aria-modal
        >
          <div className="max-w-lg w-full rounded-2xl border border-[var(--border)] p-4 bg-[var(--bg)] space-y-3">
            <p className="text-sm font-bold text-[var(--text)]">{T('ed_identity_profile_video_cam_title')}</p>
            <p className="text-[11px] text-[var(--text2)] leading-relaxed">
              {profileLoopExtendedActive ? T('id_profile_loop_limit_paid') : T('id_profile_loop_limit_free')}
            </p>
            <video
              ref={profileLoopPreviewRef}
              playsInline
              muted
              className="w-full rounded-xl bg-black aspect-[4/3] object-cover"
            />
            {profileLoopRecording ? (
              <p className="text-xs font-semibold text-amber-400/90">{T('ed_identity_profile_video_recording')}</p>
            ) : null}
            <div className="flex flex-wrap gap-2 justify-end">
              {!profileLoopRecording ? (
                <>
                  <button type="button" className="btn-secondary text-sm" onClick={stopProfileLoopCamera}>
                    {T('ed_identity_cam_cancel')}
                  </button>
                  <button type="button" className="btn-primary text-sm" onClick={() => startProfileLoopRecording()}>
                    {T('ed_identity_profile_video_start_rec')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={videoLoopBusy}
                    className="btn-secondary text-sm border-red-500/40 text-red-300"
                    onClick={() => void finishProfileLoopRecorder('discard')}
                  >
                    {T('ed_identity_profile_video_discard')}
                  </button>
                  <button
                    type="button"
                    disabled={videoLoopBusy}
                    onClick={() => void finishProfileLoopRecorder('upload')}
                    className="btn-primary text-sm gap-2"
                  >
                    {videoLoopBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {T('ed_identity_profile_video_stop_save')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
