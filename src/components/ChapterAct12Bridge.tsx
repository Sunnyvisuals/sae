import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FC } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useMasterVolumeStore } from "../stores/masterVolumeStore";
import {
  transitionBridgeRevealFromTimeRatio,
  ACT12_SWAP_TO_ACT2_RAW_RATIO,
  ACT12_WEBM_PLAY_DELAY_MS,
  TRANSITION_BRIDGE_SMOKE_SFX,
} from "../lib/transitionBridgeReveal";

const ACT12_TRANSITION_WEBM = `${import.meta.env.BASE_URL}transitions/trans2-alpha-act12.webm`;
const ACT12_TRANSITION_MP4 = `${import.meta.env.BASE_URL}transitions/trans2-alpha-act12.mp4`;

const EXIT_DURATION_S = 0.42;

/** Après fin / skip : court délai avant `onFinish` (retrait calque App). Réduit pour clics iframe plus tôt. */
const BRIDGE_TEARDOWN_BUFFER_MS = 280;

type ChapterAct12BridgeProps = {
  /** 0→1 suivant la WebM (`timeupdate`) - même fonction que Intro → langues. */
  onBridgeRevealChange: (value01: number) => void;
  onDismissChapterToast: () => void;
  onSwapPhase: () => void;
  onFinish: () => void;
};

/**
 * Pont WebM Acte I → II : calque au-dessus de la carte (z-[380]) ; l’acte II monte tôt sous la WebM
 * (`ACT12_SWAP_TO_ACT2_RAW_RATIO`) pour une transi lisible entre les deux mondes.
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
  /** Dès la fin du clip : laisser les clics traverser vers l’iframe acte II avant retrait du calque. */
  const [clicksPassThrough, setClicksPassThrough] = useState(false);

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
    setClicksPassThrough(true);
    ensureSwapToAct2();
    stopSmokeSfx();
    videoRef.current?.pause();
    onBridgeRevealChange(1);
    onDismissChapterToast();
    window.setTimeout(() => finishOnce(), BRIDGE_TEARDOWN_BUFFER_MS);
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
    setClicksPassThrough(false);
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
    try {
      v.pause();
    } catch {
      /* ignore */
    }

    const tickRatio = () => {
      const d = v.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      const rawRatio = Math.min(1, Math.max(0, v.currentTime / d));
      if (rawRatio >= ACT12_SWAP_TO_ACT2_RAW_RATIO) {
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

    const startPlayback = () => {
      if (cancelled || !videoRef.current) return;
      const video = videoRef.current;
      void video
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
    };

    const playDelay = Math.max(0, ACT12_WEBM_PLAY_DELAY_MS);
    let playDelayTimer = 0;
    if (playDelay > 0) {
      playDelayTimer = window.setTimeout(() => {
        startPlayback();
      }, playDelay);
    } else {
      requestAnimationFrame(() => {
        if (!cancelled) startPlayback();
      });
    }

    v.addEventListener("timeupdate", tickRatio);
    v.addEventListener("loadedmetadata", tickRatio);
    v.addEventListener("ended", onEnded);
    v.addEventListener("click", skip);
    window.addEventListener("keydown", onKey, true);

    return () => {
      cancelled = true;
      if (playDelayTimer !== 0) window.clearTimeout(playDelayTimer);
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
      className="pointer-events-none fixed inset-0 z-[380] min-h-[100dvh] w-full overflow-hidden bg-transparent [isolation:isolate]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: EXIT_DURATION_S, ease: [0.22, 1, 0.36, 1] } }}
    >
      {/*
        Fond sous VP9 : plus léger que le pont langue - la WebM alpha laisse voir l’acte I puis le parchemin ;
        le MP4 (sans alpha) reste lisible grâce à un léger voile seulement.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 95% 80% at 50% 32%, rgba(118, 82, 52, 0.22) 0%, rgba(36, 22, 14, 0.44) 44%, rgba(8, 5, 3, 0.58) 100%), linear-gradient(180deg, rgba(16, 10, 7, 0.4) 0%, rgba(6, 4, 3, 0.55) 100%)",
        }}
      />
      <video
        ref={videoRef}
        key={forceMp4 ? "act12-mp4" : "act12-webm"}
        className={
          (clicksPassThrough ? "pointer-events-none " : "pointer-events-auto ") +
          "absolute inset-0 z-[1] h-full w-full cursor-pointer bg-transparent object-cover object-center"
        }
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
