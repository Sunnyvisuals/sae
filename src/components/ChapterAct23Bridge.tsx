"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import {
  applyVolumeKeyStep,
  getVolumeKeyDirection,
  shouldIgnoreVolumeKeyboardTarget,
} from "../lib/volumeKeyboard";
import { useAppCopy } from "../hooks/useAppCopy";
import {
  ACT23_BRIDGE_MP4,
  ACT23_BRIDGE_MP4_FALLBACK,
  ACT23_BRIDGE_MP4_LEGACY,
  ACT23_BRIDGE_WEBM,
  ACT23_BRIDGE_WEBM_LEGACY,
} from "../lib/act23Bridge";
import { TRANSITION_BRIDGE_SMOKE_SFX } from "../lib/transitionBridgeReveal";
import {
  applyPrologueVideoElementVolume,
  readPrologueVolume01,
  PROLOGUE_VIDEO_DEFAULT_VOLUME,
} from "../lib/prologueVideoElement";
import { tapVideoElementForMeter } from "../lib/prologueVolumeAudioLevel";
import { useMasterVolumeStore } from "../stores/masterVolumeStore";
import ProloguePlaybackMark from "./ProloguePlaybackMark";
import PrologueVolumeFluid from "./PrologueVolumeFluid";
import PrologueVolumeHud from "./PrologueVolumeHud";

type Props = {
  open: boolean;
  onComplete: () => void;
};

type SourceMode = "webm" | "mp4" | "prologue";

function smokeBedVolume01(userVolume01: number): number {
  if (userVolume01 <= 0) return 0;
  return Math.min(0.52, Math.max(0.1, userVolume01 * 4));
}

/** Même réglages que le trailer prologue : molette = volume, Espace = pause, Entrée = passer. */
export default function ChapterAct23Bridge({ open, onComplete }: Props) {
  const copy = useAppCopy();
  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const smokeSfxRef = useRef<import("howler").Howl | null>(null);
  const sourceModeRef = useRef<SourceMode>("webm");
  const finishedRef = useRef(false);
  const prologueWasPausedRef = useRef(false);
  const prologuePlayMarkHideRef = useRef<number | null>(null);
  const prologueVolumeAuraHideRef = useRef<number | null>(null);
  const volumeScrollRef = useRef(PROLOGUE_VIDEO_DEFAULT_VOLUME);
  const mutedScrollRef = useRef(false);

  const [sourceMode, setSourceMode] = useState<SourceMode>("webm");
  sourceModeRef.current = sourceMode;
  const [volume, setVolume] = useState(PROLOGUE_VIDEO_DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const [playMarkVisible, setPlayMarkVisible] = useState(false);
  const [volumeHudVisible, setVolumeHudVisible] = useState(false);

  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);
  volumeRef.current = volume;
  isMutedRef.current = isMuted;
  volumeScrollRef.current = volume;
  mutedScrollRef.current = isMuted || volume <= 0;

  useLenis((lenis) => {
    if (!open || !lenis) return;
    lenis.stop();
    return () => {
      lenis.start();
    };
  }, [open]);

  const stopSmokeSfx = useCallback(() => {
    const h = smokeSfxRef.current;
    if (!h) return;
    try {
      h.stop();
      h.unload();
    } catch {
      /* ignore */
    }
    smokeSfxRef.current = null;
  }, []);

  const syncSmokeBedVolume = useCallback((userVolume01: number, playing: boolean) => {
    const h = smokeSfxRef.current;
    if (!h) return;
    const bedVol = smokeBedVolume01(userVolume01);
    h.volume(bedVol);
    if (bedVol <= 0 || !playing) {
      h.pause();
      return;
    }
    if (!h.playing()) h.play();
  }, []);

  const startSmokeBed = useCallback(() => {
    if (sourceModeRef.current === "prologue") return;
    stopSmokeSfx();
    const userVol = readPrologueVolume01(volumeRef, isMutedRef);
    void import("howler").then(({ Howl }) => {
      if (sourceModeRef.current === "prologue" || !videoRef.current) return;
      const h = new Howl({
        src: [TRANSITION_BRIDGE_SMOKE_SFX],
        html5: true,
        volume: smokeBedVolume01(userVol),
        loop: true,
      });
      smokeSfxRef.current = h;
      if (userVol > 0 && !videoRef.current.paused) h.play();
    });
  }, [stopSmokeSfx]);

  const commitVideoVolume = useCallback((volume01: number) => {
    const v = Math.min(1, Math.max(0, volume01));
    const silent = v <= 0;
    volumeRef.current = v;
    isMutedRef.current = silent;
    volumeScrollRef.current = v;
    mutedScrollRef.current = silent;
    setVolume(v);
    setIsMuted(silent);
    const video = videoRef.current;
    const useSmokeBed = sourceModeRef.current !== "prologue";
    if (video) {
      if (useSmokeBed) {
        video.muted = true;
        video.volume = 0;
      } else {
        applyPrologueVideoElementVolume(video, silent ? 0 : v);
      }
    }
    if (useSmokeBed) {
      syncSmokeBedVolume(v, Boolean(video && !video.paused && !video.ended));
    }
    if (v > 0) {
      useMasterVolumeStore.getState().setVolume(v);
      useMasterVolumeStore.getState().unlockPlayback();
    }
  }, [syncSmokeBedVolume]);

  const pulseVolumeHud = useCallback(() => {
    setVolumeHudVisible(true);
    if (prologueVolumeAuraHideRef.current != null) {
      window.clearTimeout(prologueVolumeAuraHideRef.current);
    }
    prologueVolumeAuraHideRef.current = window.setTimeout(() => {
      setVolumeHudVisible(false);
      prologueVolumeAuraHideRef.current = null;
    }, 1500);
  }, []);

  const finishOnce = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    stopSmokeSfx();
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.removeAttribute("src");
      v.load();
    }
    onComplete();
  }, [onComplete, stopSmokeSfx]);

  const hidePlayMark = useCallback(() => {
    if (prologuePlayMarkHideRef.current != null) {
      window.clearTimeout(prologuePlayMarkHideRef.current);
      prologuePlayMarkHideRef.current = null;
    }
    setPlayMarkVisible(false);
  }, []);

  const showPlayMark = useCallback(() => {
    hidePlayMark();
    setPlayMarkVisible(true);
    prologuePlayMarkHideRef.current = window.setTimeout(() => {
      setPlayMarkVisible(false);
      prologuePlayMarkHideRef.current = null;
    }, 900);
  }, [hidePlayMark]);

  const togglePlayback = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const vol = readPrologueVolume01(volumeRef, isMutedRef);
    if (v.paused) {
      void v.play().then(() => syncSmokeBedVolume(vol, true)).catch(() => {});
    } else {
      v.pause();
      syncSmokeBedVolume(vol, false);
    }
  }, [syncSmokeBedVolume]);

  const handleSkip = useCallback(() => {
    finishOnce();
  }, [finishOnce]);

  const advanceSourceMode = useCallback((): SourceMode | null => {
    if (sourceMode === "webm") return "mp4";
    if (sourceMode === "mp4") return "prologue";
    return null;
  }, [sourceMode]);

  const handleVideoError = useCallback(() => {
    const next = advanceSourceMode();
    if (next) {
      setSourceMode(next);
      return;
    }
    finishOnce();
  }, [advanceSourceMode, finishOnce]);

  const startPlayback = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const userVol = readPrologueVolume01(volumeRef, isMutedRef);
    if (sourceModeRef.current === "prologue") {
      applyPrologueVideoElementVolume(el, userVol);
    } else {
      el.muted = true;
      el.volume = 0;
    }
    void el.play().then(() => {
      startSmokeBed();
      syncSmokeBedVolume(userVol, true);
    }).catch(() => {
      const next = advanceSourceMode();
      if (next) {
        setSourceMode(next);
        return;
      }
      finishOnce();
    });
  }, [advanceSourceMode, finishOnce, startSmokeBed, syncSmokeBedVolume]);

  useLayoutEffect(() => {
    if (!open) {
      finishedRef.current = false;
      return;
    }
    if (prefersReducedMotion === true) {
      finishOnce();
      return;
    }
    const boot = useMasterVolumeStore.getState().volume;
    const initial = boot > 0 ? boot : PROLOGUE_VIDEO_DEFAULT_VOLUME;
    commitVideoVolume(initial);
    setSourceMode("webm");
    setShowSkip(false);
    setVideoPaused(false);
    setPlayMarkVisible(false);
    setVolumeHudVisible(false);
    prologueWasPausedRef.current = false;
    return () => {
      stopSmokeSfx();
    };
  }, [open, prefersReducedMotion, finishOnce, commitVideoVolume, stopSmokeSfx]);

  useEffect(() => {
    if (!open || prefersReducedMotion === true) return;
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    const t = window.setTimeout(startPlayback, 80);
    return () => window.clearTimeout(t);
  }, [open, prefersReducedMotion, sourceMode, startPlayback]);

  useEffect(() => {
    if (!open || prefersReducedMotion === true) return;
    const showTimer = window.setTimeout(() => setShowSkip(true), 4000);
    const hideTimer = window.setTimeout(() => setShowSkip(false), 12000);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [open, prefersReducedMotion]);

  useEffect(() => {
    if (!open || prefersReducedMotion === true) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        togglePlayback();
        return;
      }
      const dir = getVolumeKeyDirection(e);
      if (dir) {
        if (shouldIgnoreVolumeKeyboardTarget(e.target)) return;
        e.preventDefault();
        const { volume: v, muted: m } = applyVolumeKeyStep(
          dir,
          volumeRef.current,
          isMutedRef.current,
        );
        commitVideoVolume(m ? 0 : v);
        pulseVolumeHud();
        return;
      }
      if (e.key !== "Enter" || e.repeat) return;
      e.preventDefault();
      handleSkip();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, prefersReducedMotion, togglePlayback, handleSkip, commitVideoVolume, pulseVolumeHud]);

  useEffect(() => {
    if (!open) {
      setVolumeHudVisible(false);
      return;
    }
    const onWheel = (e: WheelEvent) => {
      const t = e.target;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const currentPct = Math.round((mutedScrollRef.current ? 0 : volumeScrollRef.current) * 100);
      const dy = e.deltaY;
      const deltaPct =
        -Math.sign(dy) * Math.max(1, Math.min(2, Math.round(Math.abs(dy) / 48)));
      const nextPct = Math.min(100, Math.max(0, currentPct + deltaPct));
      commitVideoVolume(nextPct / 100);
      pulseVolumeHud();
    };
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      if (prologueVolumeAuraHideRef.current != null) {
        window.clearTimeout(prologueVolumeAuraHideRef.current);
        prologueVolumeAuraHideRef.current = null;
      }
    };
  }, [open, commitVideoVolume, pulseVolumeHud]);

  useEffect(() => {
    if (!open) return;
    const v = videoRef.current;
    if (v) tapVideoElementForMeter(v);
  }, [open, sourceMode]);

  if (!open || prefersReducedMotion === true) return null;

  const videoKey = sourceMode;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={copy.act23BridgeVideoSkip}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto fixed inset-0 z-[620] min-h-[100dvh] w-full cursor-none overflow-hidden bg-black"
    >
      <motion.div className="relative h-full min-h-0 w-full overflow-hidden">
        <video
          key={videoKey}
          ref={videoRef}
          className="absolute inset-0 z-[1] h-full w-full cursor-none object-cover object-center"
          playsInline
          preload="auto"
          onEnded={finishOnce}
          onError={handleVideoError}
          muted={sourceMode !== "prologue" ? true : isMuted}
          onPlay={() => {
            setVideoPaused(false);
            syncSmokeBedVolume(
              readPrologueVolume01(volumeRef, isMutedRef),
              true,
            );
            if (prologueWasPausedRef.current) {
              prologueWasPausedRef.current = false;
              showPlayMark();
            }
          }}
          onPause={() => {
            const v = videoRef.current;
            if (v?.ended) return;
            prologueWasPausedRef.current = true;
            hidePlayMark();
            setVideoPaused(true);
            syncSmokeBedVolume(
              readPrologueVolume01(volumeRef, isMutedRef),
              false,
            );
          }}
        >
          {sourceMode === "webm" ? (
            <>
              <source src={ACT23_BRIDGE_WEBM} type='video/webm; codecs="vp09.00.10.08"' />
              <source src={ACT23_BRIDGE_WEBM_LEGACY} type='video/webm; codecs="vp09.00.10.08"' />
            </>
          ) : sourceMode === "mp4" ? (
            <>
              <source src={ACT23_BRIDGE_MP4} type="video/mp4" />
              <source src={ACT23_BRIDGE_MP4_LEGACY} type="video/mp4" />
            </>
          ) : (
            <source src={ACT23_BRIDGE_MP4_FALLBACK} type="video/mp4" />
          )}
        </video>

        <button
          type="button"
          className="pointer-events-auto absolute inset-0 z-[6] cursor-none border-0 bg-transparent"
          aria-label={
            videoPaused ? copy.introProloguePlayingAria : copy.introProloguePausedAria
          }
          onClick={togglePlayback}
        />

        <AnimatePresence>
          {videoPaused ? (
            <ProloguePlaybackMark
              key="act23-pause-mark"
              mode="pause"
              ariaLabel={copy.introProloguePausedAria}
              prefersReducedMotion={prefersReducedMotion}
            />
          ) : null}
          {playMarkVisible && !videoPaused ? (
            <ProloguePlaybackMark
              key="act23-play-mark"
              mode="play"
              ariaLabel={copy.introProloguePlayingAria}
              prefersReducedMotion={prefersReducedMotion}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {volumeHudVisible ? (
            <motion.div
              key="act23-volume-feedback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute inset-0 z-[19]"
            >
              <PrologueVolumeFluid
                visible
                volume01={isMuted ? 0 : volume}
                prefersReducedMotion={prefersReducedMotion}
                className="absolute inset-0"
              />
              <motion.div className="absolute inset-0 z-[22]">
                <PrologueVolumeHud
                  volumePct={Math.round((isMuted ? 0 : volume) * 100)}
                  ariaLabel={copy.introPrologueVolumeAuraAria}
                />
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showSkip && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto absolute bottom-16 right-[max(2.5rem,calc(env(safe-area-inset-right)+1.25rem))] z-[40] sm:bottom-16"
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={handleSkip}
              className="group relative flex cursor-none items-center gap-4 transition-[gap] duration-700 ease-[0.22,1,0.36,1] hover:gap-5"
            >
              <motion.div className="flex min-w-0 flex-col items-end gap-1.5">
                <span className="max-w-[85vw] text-right text-[10px] font-light uppercase tracking-[0.6em] text-solar-gold/70 transition-colors duration-500 group-hover:text-solar-gold">
                  {copy.act23BridgeVideoSkip}
                </span>
                <motion.div className="relative mt-0.5 h-[2px] w-[min(17rem,72vw)] overflow-hidden rounded-full bg-solar-gold/15">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 8, ease: "linear" }}
                    className="h-full bg-solar-gold/50"
                  />
                </motion.div>
              </motion.div>
              <motion.div className="relative flex h-14 w-14 shrink-0 cursor-none items-center justify-center">
                <motion.div className="absolute inset-0 rotate-45 border border-solar-gold/40 bg-black/45 backdrop-blur-md transition-all duration-700 ease-[0.22,1,0.36,1] group-hover:border-solar-gold group-hover:shadow-[0_0_18px_rgba(197,160,89,0.5)]" />
                <motion.div className="relative z-[1] -rotate-45 flex items-center justify-center">
                  <motion.div
                    className="relative h-5 w-5"
                    animate={prefersReducedMotion ? undefined : { rotate: [0, 360] }}
                    transition={{ rotate: { duration: 4.2, repeat: Infinity, ease: "linear" } }}
                    aria-hidden
                  >
                    <span
                      className="pointer-events-none absolute left-1/2 top-1/2 block h-[7px] w-[7px] rounded-full bg-solar-gold/90 shadow-[0_0_10px_rgba(197,160,89,0.55)] blur-[0.35px]"
                      style={{ transform: "translate(-50%, -50%) translate(-4.5px, -4.5px)" }}
                    />
                    <span
                      className="pointer-events-none absolute left-1/2 top-1/2 block h-[7px] w-[7px] rounded-full bg-solar-gold/65 shadow-[0_0_8px_rgba(197,160,89,0.4)] blur-[0.35px]"
                      style={{ transform: "translate(-50%, -50%) translate(4.5px, 4.5px)" }}
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
