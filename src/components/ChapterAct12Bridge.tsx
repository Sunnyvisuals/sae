import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FC } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useMasterVolumeStore } from "../stores/masterVolumeStore";
import {
  transitionBridgeRevealFromTimeRatio,
  TRANSITION_BRIDGE_SMOKE_SFX,
  TRANSITION_BRIDGE_VIDEO_CROSSFADE_MS,
} from "../lib/transitionBridgeReveal";

const ACT12_TRANSITION_WEBM = `${import.meta.env.BASE_URL}transitions/trans2-alpha-act12.webm`;
const ACT12_TRANSITION_MP4 = `${import.meta.env.BASE_URL}transitions/trans2-alpha-act12.mp4`;

const EXIT_DURATION_S = TRANSITION_BRIDGE_VIDEO_CROSSFADE_MS / 1000;

/** À ce ratio lecture brute (temps/durée) on bascule `act1 → acte II` : la fin du clip se joue alors par-dessus le parchemin. */
const SWAP_TO_ACT2_RAW_RATIO = 0.86;

/** Laisse jouer la sortie `ChapterCompleteToast` avant de retirer la couche vidéo (~sync AnimatePresence). */
const AFTER_TOAST_DISMISS_BUFFER_MS = 1150;

type ChapterAct12BridgeProps = {
  /** 0→1 suivant la WebM (`timeupdate`) — même fonction que Intro → langues. */
  onBridgeRevealChange: (value01: number) => void;
  onDismissChapterToast: () => void;
  onSwapPhase: () => void;
  onFinish: () => void;
};

/**
 * Pont WebM Acte I → II : même volet vidéo qu’Intro → langues (z-[250]),
 * puis bascule acte II vers la fin du clip pour « finir » sur le parchemin.
 */
const ChapterAct12Bridge: FC<ChapterAct12BridgeProps> = ({
  onBridgeRevealChange,
  onDismissChapterToast,
  onSwapPhase,
  onFinish,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const reduced = prefersReducedMotion === true;

  const videoRef = useRef<HTMLVideoElement>(null);
  const smokeSfxRef = useRef<{ stop: () => void; unload?: () => void } | null>(null);
  const finishedRef = useRef(false);
  const dismissingRef = useRef(false);
  const didSwapPhaseRef = useRef(false);

  const masterVolumeBoot = useRef(useMasterVolumeStore.getState().volume);
  const [forceMp4, setForceMp4] = useState(false);

  const ensureSwapToAct2 = useCallback(() => {
    if (didSwapPhaseRef.current) return;
    didSwapPhaseRef.current = true;
    onSwapPhase();
  }, [onSwapPhase]);

  const stopSmokeSfx = useCallback(() => {
    const h = smokeSfxRef.current as import("howler").Howl | null;
    if (!h) return;
    try {
      h.stop();
      h.unload();
    } catch {
      /* ignore */
    }
    smokeSfxRef.current = null;
  }, []);

  const finishOnce = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  }, [onFinish]);

  const teardownAfterDismiss = useCallback(() => {
    if (dismissingRef.current || finishedRef.current) return;
    dismissingRef.current = true;
    ensureSwapToAct2();
    stopSmokeSfx();
    videoRef.current?.pause();
    onBridgeRevealChange(1);
    onDismissChapterToast();
    window.setTimeout(() => finishOnce(), AFTER_TOAST_DISMISS_BUFFER_MS);
  }, [ensureSwapToAct2, finishOnce, onBridgeRevealChange, onDismissChapterToast, stopSmokeSfx]);

  useLayoutEffect(() => {
    if (!reduced) return;
    didSwapPhaseRef.current = true;
    onSwapPhase();
    onBridgeRevealChange(1);
    onDismissChapterToast();
    finishOnce();
  }, [finishOnce, onBridgeRevealChange, onDismissChapterToast, onSwapPhase, reduced]);

  useEffect(() => {
    if (reduced) return;
    masterVolumeBoot.current = useMasterVolumeStore.getState().volume;
    const v = videoRef.current;
    if (!v) return;
    finishedRef.current = false;
    dismissingRef.current = false;
    /* Ne pas remettre didSwapPhaseRef à false lors du pivot WebM→MP4 : évite de perdre acte II sous la vidéo. */
    onBridgeRevealChange(0);
    v.muted = true;
    v.volume = 0;
    v.currentTime = 0;

    const tickRatio = () => {
      const d = v.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      const rawRatio = Math.min(1, Math.max(0, v.currentTime / d));
      if (rawRatio >= SWAP_TO_ACT2_RAW_RATIO) {
        ensureSwapToAct2();
      }
      onBridgeRevealChange(transitionBridgeRevealFromTimeRatio(rawRatio));
    };

    let cancelled = false;
    const volBoot = masterVolumeBoot.current;

    const onEnded = () => teardownAfterDismiss();

    const skip = () => teardownAfterDismiss();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" && e.key !== "Enter") return;
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) return;
      e.preventDefault();
      skip();
    };

    void v
      .play()
      .then(() => {
        if (cancelled) return;
        void import("howler").then(({ Howl }) => {
          if (cancelled || !videoRef.current) return;
          const h = new Howl({
            src: [TRANSITION_BRIDGE_SMOKE_SFX],
            html5: true,
            volume: Math.min(0.52, Math.max(0.1, volBoot * 4)),
          });
          smokeSfxRef.current = h;
          h.play();
        });
      })
      .catch(() => {
        ensureSwapToAct2();
        onBridgeRevealChange(1);
        onDismissChapterToast();
        finishOnce();
      });

    v.addEventListener("timeupdate", tickRatio);
    v.addEventListener("loadedmetadata", tickRatio);
    v.addEventListener("ended", onEnded);
    v.addEventListener("click", skip);
    window.addEventListener("keydown", onKey, true);

    return () => {
      cancelled = true;
      v.removeEventListener("timeupdate", tickRatio);
      v.removeEventListener("loadedmetadata", tickRatio);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("click", skip);
      window.removeEventListener("keydown", onKey, true);
      stopSmokeSfx();
    };
  }, [
    ensureSwapToAct2,
    finishOnce,
    forceMp4,
    reduced,
    onBridgeRevealChange,
    onDismissChapterToast,
    stopSmokeSfx,
    teardownAfterDismiss,
  ]);

  const handleError = useCallback(() => {
    if (!forceMp4) {
      setForceMp4(true);
      dismissingRef.current = false;
      return;
    }
    teardownAfterDismiss();
  }, [forceMp4, teardownAfterDismiss]);

  if (reduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[250] min-h-[100dvh] w-full overflow-hidden bg-transparent [isolation:isolate]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: EXIT_DURATION_S, ease: [0.22, 1, 0.36, 1] } }}
    >
      {/*
        Même stratégie que volet langue : dégradé derrière VP9/WebM avec zones quasi transparentes —
        évite trous noirs lorsque le MP4 n’a pas d’alpha.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 95% 80% at 50% 32%, rgba(118, 82, 52, 0.42) 0%, rgba(36, 22, 14, 0.88) 42%, rgba(8, 5, 3, 0.97) 100%), linear-gradient(180deg, #100a07 0%, #060403 100%)",
        }}
      />
      <video
        ref={videoRef}
        key={forceMp4 ? "act12-mp4" : "act12-webm"}
        className="pointer-events-auto absolute inset-0 z-[1] h-full w-full cursor-pointer bg-transparent object-cover object-center"
        style={{ backgroundColor: "transparent" }}
        playsInline
        muted
        preload="auto"
        onError={handleError}
      >
        {forceMp4 ? (
          <source src={ACT12_TRANSITION_MP4} type="video/mp4" />
        ) : (
          <>
            <source src={ACT12_TRANSITION_WEBM} type='video/webm; codecs="vp09.00.10.08"' />
            <source src={ACT12_TRANSITION_MP4} type="video/mp4" />
          </>
        )}
      </video>
    </motion.div>
  );
};

export default ChapterAct12Bridge;
