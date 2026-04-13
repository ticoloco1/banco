'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { getAssetUrl } from '@/lib/getAssetUrl';

type Props = {
  videoPath: string;
  posterPath?: string | null;
  size: number;
  /** CSS border-radius for the video (e.g. '50%' or px) */
  borderRadius: string | number;
  themeBorder: string;
  neonEnabled: boolean;
  /** Full hex e.g. #818cf8 */
  neonColorHex: string;
  labelMute: string;
  labelUnmute: string;
};

export function ProfileLoopVideoPublic({
  videoPath,
  posterPath,
  size,
  borderRadius,
  themeBorder,
  neonEnabled,
  neonColorHex,
  labelMute,
  labelUnmute,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  /** Só pede o ficheiro quando o bloco entra no viewport (poupa banda larga). */
  const [loadMedia, setLoadMedia] = useState(false);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setLoadMedia(true);
          io.disconnect();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0.01 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!loadMedia) return;
    const v = ref.current;
    if (!v) return;
    void v.play().catch(() => {});
  }, [loadMedia]);

  const toggle = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setMuted(next);
  }, []);

  const br = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;

  const wrapStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    borderRadius: br,
    verticalAlign: 'middle',
  };

  if (neonEnabled) {
    (wrapStyle as Record<string, string>)['--tb-neon'] = neonColorHex;
  }

  const resolvedSrc = loadMedia ? getAssetUrl(videoPath) : undefined;

  return (
    <div ref={wrapRef} className={neonEnabled ? 'tb-profile-video-neon' : undefined} style={wrapStyle}>
      <video
        ref={ref}
        src={resolvedSrc}
        poster={posterPath ? getAssetUrl(posterPath) : undefined}
        muted={muted}
        loop
        autoPlay
        playsInline
        preload={loadMedia ? 'metadata' : 'none'}
        style={{
          width: size,
          height: size,
          borderRadius: br,
          objectFit: 'cover',
          objectPosition: '50% 35%',
          display: 'block',
          border: themeBorder,
          verticalAlign: 'middle',
          backgroundColor: 'rgba(0,0,0,0.2)',
        }}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={muted ? labelUnmute : labelMute}
        title={muted ? labelUnmute : labelMute}
        style={{
          position: 'absolute',
          bottom: 6,
          right: 6,
          zIndex: 4,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.52)',
          color: '#fff',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
        }}
      >
        {muted ? <VolumeX size={17} strokeWidth={2.25} /> : <Volume2 size={17} strokeWidth={2.25} />}
      </button>
    </div>
  );
}
