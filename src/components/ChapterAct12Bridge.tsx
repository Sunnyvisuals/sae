import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FC } from "react";
import { motion, useReducedMotion } from "motion/react";

const ACT12_TRANSITION_WEBM = `${import.meta.env.BASE_URL}transitions/trans2-alpha-act12.webm`;
const ACT12_TRANSITION_MP4 = `${import.meta.env.BASE_URL}transitions/trans2-alpha-act12.mp4`;

/** Fondu de sortie du pont une fois la WebM terminée (sync avec l'apparition nette de l'Acte II). */
const EXIT_DURATION_S = 0.72;

type ChapterAct12BridgeProps = {
  /** Tant que le toast « Acte I accompli » est visible, la WebM reste en pause (l'Acte II charge derrière). */
  chapterToast: boolean;
  onSwapPhase: () => void;
  onFinish: () => void;
};

/**
 * Pont WebM Acte I → II : monte avec le toast, sous le toast (z-index).
 * Phase act2 dès le montage ; lecture WebM seulement après fermeture du toast ;
 * retrait du pont en fondu à la fin du clip — fond transparent pour laisser l'alpha VP9 agir.
 */
const ChapterAct12Bridge: FC<ChapterAct12BridgeProps> = ({
  chapterToast,
  onSwapPhase,
  onFinish,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [forceMp4, setForceMp4] = useState(false);
  const finishedRef = useRef(false);

  const finishOnce = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  }, [onFinish]);

  const reduced = prefersReducedMotion === true;

  useLayoutEffect(() => {
    onSwapPhase();
    if (reduced) onFinish();
  }, [reduced, onSwapPhase, onFinish]);

  /** Lecture uniquement après le toast : la transition visible enchaîne directement sur l'écran Acte II. */
  useEffect(() => {
    if (reduced) return;
    if (chapterToast) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.volume = 0;
    v.currentTime = 0;
    void v.play().catch(() => finishOnce());
  }, [reduced, forceMp4, chapterToast, finishOnce]);

  const handleError = useCallback(() => {
    if (!forceMp4) {
      setForceMp4(true);
      return;
    }
    finishOnce();
  }, [forceMp4, finishOnce]);

  const handleEnded = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => finishOnce());
    });
  }, [finishOnce]);

  if (reduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[188] min-h-[100dvh] w-full overflow-hidden bg-transparent [isolation:isolate]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: EXIT_DURATION_S, ease: [0.22, 1, 0.36, 1] } }}
    >
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
