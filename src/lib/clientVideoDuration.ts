/**
 * Duração em segundos de um ficheiro de vídeo no browser (metadata apenas).
 */
export function measureVideoFileDurationSec(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      v.removeAttribute('src');
      v.load();
    };
    v.onloadedmetadata = () => {
      const d = v.duration;
      cleanup();
      if (!Number.isFinite(d) || d <= 0) {
        reject(new Error('invalid_duration'));
        return;
      }
      resolve(d);
    };
    v.onerror = () => {
      cleanup();
      reject(new Error('video_load_error'));
    };
    v.src = url;
  });
}
