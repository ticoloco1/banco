/**
 * Pré-processamento de vídeos de perfil (loop) antes do upload:
 * - Objetivo: WebM ~480p, bitrate moderado (avatar pequeno no mini-site).
 * - Usa FFmpeg.wasm carregado sob demanda a partir do CDN (não aumenta o bundle inicial).
 * - Se falhar ou não for necessário, devolve o ficheiro original.
 *
 * O upload em si continua a ir para R2 ou Supabase Storage via presign (não passa pelo body do Vercel).
 */

import { fetchFile } from '@ffmpeg/util';

const WEBM_SKIP_MAX_BYTES = 2_800_000;
const WEBM_SKIP_MAX_WIDTH = 854;

let ffmpegLoadPromise: Promise<import('@ffmpeg/ffmpeg').FFmpeg> | null = null;
let transcodeChain: Promise<unknown> = Promise.resolve();

function runTranscodeExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const next = transcodeChain.then(fn, fn);
  transcodeChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function probeVideoWidth(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    const done = (w: number) => {
      URL.revokeObjectURL(url);
      v.removeAttribute('src');
      v.load();
      resolve(w);
    };
    const fail = () => {
      URL.revokeObjectURL(url);
      reject(new Error('metadata'));
    };
    v.onloadedmetadata = () => {
      const w = v.videoWidth;
      if (!Number.isFinite(w) || w < 2) fail();
      else done(w);
    };
    v.onerror = () => fail();
    v.src = url;
  });
}

async function shouldSkipTranscode(file: File): Promise<boolean> {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  const looksWebm = type.includes('webm') || name.endsWith('.webm');
  if (!looksWebm) return false;
  if (file.size > WEBM_SKIP_MAX_BYTES) return false;
  try {
    const w = await probeVideoWidth(file);
    return w > 0 && w <= WEBM_SKIP_MAX_WIDTH;
  } catch {
    return file.size <= 1_600_000;
  }
}

function inferInputExt(file: File): string {
  const n = file.name.toLowerCase();
  if (n.endsWith('.webm')) return 'webm';
  if (n.endsWith('.mov')) return 'mov';
  if (n.endsWith('.mkv')) return 'mkv';
  return 'mp4';
}

async function loadFfmpegOnce(): Promise<import('@ffmpeg/ffmpeg').FFmpeg> {
  if (ffmpegLoadPromise) return ffmpegLoadPromise;
  ffmpegLoadPromise = (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');
    const ffmpeg = new FFmpeg();
    const coreVer = '0.12.6';
    const base = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${coreVer}/dist/esm`;
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    return ffmpeg;
  })();
  return ffmpegLoadPromise;
}

export type AvatarVideoTranscodeOptions = {
  /** Primeira carga pode demorar (descarga do core WASM). */
  onPhase?: (phase: 'loading_encoder' | 'encoding') => void;
};

/**
 * Devolve um `File` WebM otimizado para avatar, ou o original se saltar / falhar.
 */
export async function prepareAvatarLoopVideoForUpload(
  file: File,
  options?: AvatarVideoTranscodeOptions,
): Promise<File> {
  if (typeof window === 'undefined') return file;

  try {
    if (await shouldSkipTranscode(file)) {
      return file;
    }
  } catch {
    /* continua para transcodificar */
  }

  return runTranscodeExclusive(async () => {
    const inBase = `tb_in_${Date.now()}`;
    const outName = `tb_out_${Date.now()}.webm`;
    const ext = inferInputExt(file);
    const inName = `${inBase}.${ext}`;

    let ffmpeg: import('@ffmpeg/ffmpeg').FFmpeg | null = null;
    try {
      options?.onPhase?.('loading_encoder');
      ffmpeg = await loadFfmpegOnce();
      options?.onPhase?.('encoding');

      await ffmpeg.writeFile(inName, await fetchFile(file));

      const withAudio = [
        '-i',
        inName,
        '-vf',
        'scale=-2:480',
        '-c:v',
        'libvpx',
        '-b:v',
        '580k',
        '-c:a',
        'libopus',
        '-b:a',
        '48k',
        '-y',
        outName,
      ];
      const videoOnly = [
        '-i',
        inName,
        '-vf',
        'scale=-2:480',
        '-c:v',
        'libvpx',
        '-b:v',
        '580k',
        '-an',
        '-y',
        outName,
      ];

      try {
        await ffmpeg.exec(withAudio);
      } catch {
        await ffmpeg.exec(videoOnly);
      }

      const data = await ffmpeg.readFile(outName);
      if (!(data instanceof Uint8Array) || data.byteLength < 8_000) {
        return file;
      }
      const copy = new Uint8Array(data.byteLength);
      copy.set(data);

      const blob = new Blob([copy], { type: 'video/webm' });
      const outFile = new File([blob], `avatar-loop-${Date.now()}.webm`, { type: 'video/webm' });

      if (outFile.size > file.size * 1.25 && file.size < 6 * 1024 * 1024) {
        return file;
      }

      return outFile;
    } catch {
      return file;
    } finally {
      if (ffmpeg) {
        await ffmpeg.deleteFile(inName).catch(() => {});
        await ffmpeg.deleteFile(outName).catch(() => {});
      }
    }
  });
}
