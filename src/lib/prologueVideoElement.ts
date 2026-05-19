/** Volume vidéo prologue / ponts cinématiques (attribut `muted` + `volume`). */
export function applyPrologueVideoElementVolume(
  video: HTMLVideoElement,
  volume01: number,
) {
  const v = Math.min(1, Math.max(0, volume01));
  const silent = v <= 0;
  video.muted = silent;
  video.volume = silent ? 0 : v;
}

export function readPrologueVolume01(
  volumeRef: { current: number },
  isMutedRef: { current: boolean },
): number {
  return isMutedRef.current ? 0 : Math.min(1, Math.max(0, volumeRef.current));
}

/** Niveau par défaut du trailer prologue (avant tuto volume). */
export const PROLOGUE_VIDEO_DEFAULT_VOLUME = 0.1;

/** Lance `play()` tout de suite (muet) — à appeler dans la pile du geste utilisateur. */
export function kickPrologueVideoPlay(video: HTMLVideoElement): void {
  video.playsInline = true;
  video.muted = true;
  try {
    const pending = video.play();
    if (pending) void pending.catch(() => {});
  } catch {
    /* politique autoplay */
  }
}
