import type { Howl } from "howler";
import { tapHowlerMasterForMeter } from "./prologueVolumeAudioLevel";
import { primeSuspenseAudio } from "./suspenseLoadChime";

/** Extrait « Zina » - test de niveau sonore du tutoriel prologue. */
const PROLOGUE_TUTORIAL_VOLUME_PROBE_SRC = "/zina.mp3";

/** Plafond du volume test (piste musicale). */
const GAIN_MAX = 0.58;

let disposed = true;
let syncGeneration = 0;
let howl: Howl | null = null;
let howlLoading: Promise<Howl | null> | null = null;

function probeGain(volume01: number, muted: boolean): number {
  const v = muted ? 0 : Math.min(1, Math.max(0, volume01));
  if (v <= 0) return 0;
  return v * GAIN_MAX;
}

async function loadHowl(): Promise<Howl | null> {
  if (disposed) return null;
  if (howl) return howl;
  if (howlLoading) return howlLoading;

  howlLoading = import("howler")
    .then(({ Howl: HowlCtor }) => {
      if (disposed) return null;
      const h = new HowlCtor({
        src: [PROLOGUE_TUTORIAL_VOLUME_PROBE_SRC],
        loop: true,
        html5: false,
        volume: 0,
      });
      howl = h;
      return h;
    })
    .catch(() => null)
    .finally(() => {
      howlLoading = null;
    });

  return howlLoading;
}

function applyProbeLevel(h: Howl, gain: number): void {
  h.volume(gain);
  if (gain <= 0.004) {
    if (h.playing()) h.pause();
    return;
  }
  if (!h.playing()) h.play();
}

/** Précharge la piste test (après geste utilisateur). */
export function primePrologueTutorialVolumeProbe(): void {
  disposed = false;
  primeSuspenseAudio();
  tapHowlerMasterForMeter();
  void loadHowl();
}

/** Met à jour le niveau de la piste test (0 = silence). */
export function syncPrologueTutorialVolumeProbe(volume01: number, muted: boolean): void {
  if (disposed) return;
  const target = probeGain(volume01, muted);
  const gen = syncGeneration;
  void loadHowl().then((h) => {
    if (!h || disposed || gen !== syncGeneration) return;
    applyProbeLevel(h, target);
  });
}

/** Arrête la piste test. */
export function disposePrologueTutorialVolumeProbe(): void {
  disposed = true;
  syncGeneration += 1;
  if (howl) {
    howl.stop();
    howl.unload();
    howl = null;
  }
  howlLoading = null;
}
