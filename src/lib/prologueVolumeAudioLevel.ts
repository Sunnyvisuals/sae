import { Howler } from "howler";

const SMOOTHING = 0.84;
const FFT_SIZE = 512;

let analyser: AnalyserNode | null = null;
let dataBuf: Uint8Array | null = null;
let smoothed = 0;
let rafId = 0;
let howlerMasterTapped = false;
let videoSource: MediaElementAudioSourceNode | null = null;
let videoTapElement: HTMLMediaElement | null = null;
const listeners = new Set<(level: number) => void>();

function getCtx(): AudioContext | null {
  try {
    return Howler.ctx;
  } catch {
    return null;
  }
}

function ensureAnalyser(): AnalyserNode | null {
  const ctx = getCtx();
  if (!ctx) return null;
  if (analyser) return analyser;
  analyser = ctx.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = 0.78;
  analyser.minDecibels = -82;
  analyser.maxDecibels = -12;
  dataBuf = new Uint8Array(analyser.frequencyBinCount);
  return analyser;
}

/** Route la sortie Howler vers l’analyseur (une seule fois). */
export function tapHowlerMasterForMeter(): void {
  if (howlerMasterTapped) return;
  const a = ensureAnalyser();
  const ctx = getCtx();
  if (!a || !ctx) return;
  try {
    Howler.masterGain.disconnect();
    Howler.masterGain.connect(a);
    a.connect(ctx.destination);
    howlerMasterTapped = true;
  } catch {
    /* déjà câblé */
  }
}

/** Analyse l’audio de la vidéo prologue (une seule fois par élément). */
export function tapVideoElementForMeter(video: HTMLVideoElement): void {
  if (videoTapElement === video) return;
  const ctx = getCtx();
  const a = ensureAnalyser();
  if (!ctx || !a) return;
  try {
    if (videoSource) {
      try {
        videoSource.disconnect();
      } catch {
        /* noop */
      }
    }
    videoSource = ctx.createMediaElementSource(video);
    videoSource.connect(a);
    if (!howlerMasterTapped) {
      a.connect(ctx.destination);
    }
    videoTapElement = video;
  } catch {
    /* createMediaElementSource : déjà branché ailleurs */
  }
}

function readInstantLevel(): number {
  if (!analyser || !dataBuf) return 0;
  analyser.getByteFrequencyData(dataBuf);
  let sum = 0;
  const start = 1;
  const end = Math.min(40, dataBuf.length);
  for (let i = start; i < end; i++) sum += dataBuf[i]!;
  return sum / ((end - start) * 255);
}

function tick(): void {
  const instant = readInstantLevel();
  smoothed = smoothed * SMOOTHING + instant * (1 - SMOOTHING);
  const level = Math.min(1, Math.max(0, smoothed));
  listeners.forEach((fn) => fn(level));
  rafId = requestAnimationFrame(tick);
}

function ensureTicker(): void {
  if (rafId) return;
  rafId = requestAnimationFrame(tick);
}

function stopTickerIfIdle(): void {
  if (listeners.size > 0) return;
  cancelAnimationFrame(rafId);
  rafId = 0;
  smoothed = 0;
}

/** Abonnement au niveau audio lissé (0–1) pour l’aurore. */
export function subscribePrologueVolumeAudioLevel(
  listener: (level: number) => void
): () => void {
  listeners.add(listener);
  ensureTicker();
  listener(smoothed);
  return () => {
    listeners.delete(listener);
    stopTickerIfIdle();
  };
}
