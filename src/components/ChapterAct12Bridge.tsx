import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FC } from "react";
import { motion, useReducedMotion } from "motion/react";

const ACT12_TRANSITION_WEBM = `${import.meta.env.BASE_URL}transitions/trans2-alpha-act12.webm`;
const ACT12_TRANSITION_MP4 = `${import.meta.env.BASE_URL}transitions/trans2-alpha-act12.mp4`;

/** Fondu de sortie du pont une fois bundle toast + vidéo terminés. */
const EXIT_DURATION_S = 0.72;

type ChapterAct12BridgeProps = {
  chapterToast: boolean;
  onSwapPhase: () => void;
  onFinish: () => void;
};

/**
 * Pont WebM Acte I → II : passe derrière un toast léger lisible mais visible dès « chapitre accompli ».
 * La vidéo démarre tout de suite ; la couche retire seulement quand la clip est finie **et** le toast fermé.
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
  const chapterToastRef = useRef(chapterToast);
  const videoEndedRef = useRef(false);

  chapterToastRef.current = chapterToast;

  const finishOnce = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  }, [onFinish]);

  /** Ne enlève pas le pont pendant que le message de réussite est encore là. */
  const tryFinishWhenReady = useCallback(() => {
    if (finishedRef.current) return;
    if (!videoEndedRef.current) return;
    if (chapterToastRef.current) return;
    finishOnce();
  }, [finishOnce]);

  const reduced = prefersReducedMotion === true;

  useLayoutEffect(() => {
    onSwapPhase();
    if (reduced) finishOnce();
  }, [reduced, onSwapPhase, finishOnce]);

  /** Lecture dès montage du pont (avec le toast : même instant). */
  useEffect(() => {
    if (reduced) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.volume = 0;
    v.currentTime = 0;
    void v.play().catch(() => {
      videoEndedRef.current = true;
      tryFinishWhenReady();
    });
  }, [reduced, forceMp4, tryFinishWhenReady]);

  /** Toast refermé alors que la WebM existe déjà : terminer le pont. */
  useEffect(() => {
    if (!chapterToast) tryFinishWhenReady();
  }, [chapterToast, tryFinishWhenReady]);

  const handleError = useCallback(() => {
    if (!forceMp4) {
      setForceMp4(true);
      videoEndedRef.current = false;
      return;
    }
    videoEndedRef.current = true;
    tryFinishWhenReady();
  }, [forceMp4, tryFinishWhenReady]);

  const handleEnded = useCallback(() => {
    videoEndedRef.current = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => tryFinishWhenReady());
    });
  }, [tryFinishWhenReady]);

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
