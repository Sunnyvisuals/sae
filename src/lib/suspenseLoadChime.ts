/**
 * Carillon discret à la fin de la barre de chargement (prologue).
 * L’AudioContext doit être créé / repris dans le même geste utilisateur que « lancer »
 * (voir `primeSuspenseAudio`) sinon le navigateur reste muet.
 */

let sharedCtx: AudioContext | null = null;

export function primeSuspenseAudio(): void {
  if (typeof window === "undefined") return;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!sharedCtx) sharedCtx = new AC();
    void sharedCtx.resume();
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
      const t0 = c.currentTime;
      const mk = (freq: number, start: number, dur: number) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t0 + start);
        gain.gain.setValueAtTime(0.0001, t0 + start);
        gain.gain.exponentialRampToValueAtTime(0.11, t0 + start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(t0 + start);
        osc.stop(t0 + start + dur + 0.02);
      };
      /* deux notes courtes, ambiance or / clair */
      mk(784, 0, 0.11);
      mk(1046.5, 0.09, 0.14);
    };

    void c.resume().then(run);
  } catch {
    /* ignore */
  }
}
