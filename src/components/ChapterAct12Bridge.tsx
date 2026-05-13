import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FC } from "react";
import { motion, useReducedMotion } from "motion/react";

const ACT12_TRANSITION_WEBM = `${import.meta.env.BASE_URL}transitions/trans2-alpha-act12.webm`;
const ACT12_TRANSITION_MP4 = `${import.meta.env.BASE_URL}transitions/trans2-alpha-act12.mp4`;

type ChapterAct12BridgeProps = {
  onSwapPhase: () => void;
  onFinish: () => void;
};

/**
 * Pont WebM entre Acte I et II : l’acte I reste affiché pendant le préchargement (voir App),
 * puis la vidéo joue en plein écran ; passage à l’acte II et retrait du voile à la fin du clip.
 */
const ChapterAct12Bridge: FC<ChapterAct12BridgeProps> = ({ onSwapPhase, onFinish }) => {
  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [forceMp4, setForceMp4] = useState(false);
  const swappedRef = useRef(false);
  const finishedRef = useRef(false);

  const swapOnce = useCallback(() => {
    if (swappedRef.current) return;
    swappedRef.current = true;
    onSwapPhase();
  }, [onSwapPhase]);

  const finishOnce = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  }, [onFinish]);

  const reduced = prefersReducedMotion === true;

  useLayoutEffect(() => {
    if (!reduced) return;
    onSwapPhase();
    onFinish();
  }, [reduced, onSwapPhase, onFinish]);

  useEffect(() => {
    if (reduced) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.volume = 0;
    v.currentTime = 0;
    void v.play().catch(() => {
      swapOnce();
      finishOnce();
    });
  }, [reduced, forceMp4, swapOnce, finishOnce]);

  const handleError = useCallback(() => {
    if (!forceMp4) {
      setForceMp4(true);
      return;
    }
    swapOnce();
    finishOnce();
  }, [forceMp4, swapOnce, finishOnce]);

  /** Fin du clip : Acte II derrière le voile, puis retrait du voile (l’acte I reste jusqu’ici). */
  const handleEnded = useCallback(() => {
    swapOnce();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => finishOnce());
    });
  }, [swapOnce, finishOnce]);

  if (reduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[205] min-h-[100dvh] w-full overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
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
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full bg-transparent object-cover object-center"
        style={{ backgroundColor: "transparent" }}
        playsInline
        muted
        preload="auto"
        onEnded={handleEnded}
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
