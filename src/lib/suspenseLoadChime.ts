/**
 * Whoosh discret à la fin de la barre de chargement (prologue).
 * `primeSuspenseAudio` reprend l’AudioContext après le geste utilisateur (bouton lancer) ;
 * le buffer est préchargé pour éviter un retard au 100 %.
 */

let sharedCtx: AudioContext | null = null;
let whooshBuffer: AudioBuffer | null = null;
let whooshLoadPromise: Promise<void> | null = null;

/** Niveau de sortie : volontairement très bas (≈1 % — whoosh audible à peine). */
const WHOOSH_GAIN = 0.01;

function whooshUrl(): string {
  return `${import.meta.env.BASE_URL}sounds/whoosh-067.wav`;
}

function ensureWhooshLoaded(ctx: AudioContext): Promise<void> {
  if (whooshBuffer) return Promise.resolve();
  if (!whooshLoadPromise) {
    whooshLoadPromise = fetch(whooshUrl())
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.arrayBuffer();
      })
      .then((ab) => ctx.decodeAudioData(ab.slice(0)))
      .then((buf) => {
        whooshBuffer = buf;
      })
      .catch(() => {
        whooshLoadPromise = null;
      });
  }
  return whooshLoadPromise;
}

export function primeSuspenseAudio(): void {
  if (typeof window === "undefined") return;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!sharedCtx) sharedCtx = new AC();
    void sharedCtx.resume();
    void ensureWhooshLoaded(sharedCtx);
  } catch {
    /* ignore */
  }
}

/** Appeler une seule fois quand la progression atteint 100 %. */
export function playSuspenseLoadCompleteChime(): void {
  try {
    if (!sharedCtx) primeSuspenseAudio();
    const c = sharedCtx;
    if (!c) return;

    const run = () => {
      void ensureWhooshLoaded(c).then(() => {
        if (!whooshBuffer) return;
        const t0 = c.currentTime;
        const src = c.createBufferSource();
        const gain = c.createGain();
        src.buffer = whooshBuffer;
        gain.gain.setValueAtTime(WHOOSH_GAIN, t0);
        src.connect(gain);
        gain.connect(c.destination);
        src.start(t0);
      });
    };

    void c.resume().then(run);
  } catch {
    /* ignore */
  }
}
