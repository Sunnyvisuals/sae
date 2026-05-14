import { motion } from "motion/react";
import { useAppCopy } from "../../hooks/useAppCopy";

type Props = {
  chapterTitle: string;
  subtitle: string;
  /**
   * 0→1 : opacité contenu lorsque la WebM pont joue (`transitionBridgeRevealFromTimeRatio`).
   * À 1 (défaut) : comportement hors pont ou révélation complète.
   */
  bridgeReveal01?: number;
  /**
   * Voile plus léger + carte lisible sous la typo : laisse voir la WebM I→II derrière pendant
   * le toast « chapitre accompli ».
   */
  blendBridgeBackdrop?: boolean;
};

const easeEntrance = [0.22, 1, 0.36, 1] as const;
/** Sortie un peu plus résistante : sensation de lever de rideau avant la transition vidéo. */
const easeExit = [0.65, 0, 0.35, 1] as const;

/**
 * Chapitre accompli - entrée sobre (pas de zoom / flou agressif), alignée carte / or du projet.
 */
export default function ChapterCompleteToast({
  chapterTitle,
  subtitle,
  bridgeReveal01 = 1,
  blendBridgeBackdrop = false,
}: Props) {
  const copy = useAppCopy();

  const outer =
    "fixed inset-0 z-[182] flex cursor-none flex-col items-center justify-center px-6 ";
  const backdropHeavy =
    "bg-gradient-to-b from-black/90 via-da-depth-intro/92 to-black/90 backdrop-blur-xl";
  const backdropLight =
    "bg-gradient-to-b from-black/[0.48] via-da-depth-intro/[0.54] to-black/[0.5] backdrop-blur-md";

  const innerTint = blendBridgeBackdrop
    ? "relative rounded-[2px] border border-solar-gold/[0.14] bg-[rgba(10,10,18,0.78)] px-8 py-10 shadow-[0_8px_48px_rgba(0,0,0,0.55)] backdrop-blur-sm sm:px-10"
    : "";

  const reveal = blendBridgeBackdrop ? bridgeReveal01 : 1;

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: Math.min(1, Math.max(0, reveal)) }}
      exit={{
        opacity: 0,
        transition: { duration: 0.92, ease: easeExit, delay: 0.42 },
      }}
      transition={{ duration: 0.55, ease: easeEntrance }}
      className={outer + (blendBridgeBackdrop ? backdropLight : backdropHeavy)}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{
          opacity: 0,
          y: -22,
          scale: 0.985,
          transition: { duration: 0.72, ease: easeExit, delay: 0.24 },
        }}
        transition={{ duration: 0.95, ease: easeEntrance, delay: 0.06 }}
        className={"max-w-lg text-center " + innerTint}
      >
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{
            opacity: 0,
            y: -10,
            transition: { duration: 0.38, ease: easeExit, delay: 0.18 },
          }}
          transition={{ duration: 0.65, ease: easeEntrance, delay: 0.12 }}
          className="text-[10px] uppercase tracking-[0.52em] text-solar-gold/48"
        >
          {copy.chapterToastKicker}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{
            opacity: 0,
            y: -14,
            transition: { duration: 0.42, ease: easeExit, delay: 0.11 },
          }}
          transition={{ duration: 0.85, ease: easeEntrance, delay: 0.2 }}
          className="font-bahlull mt-5 text-4xl italic text-white md:text-5xl"
          style={{ textShadow: "0 1px 0 rgba(0,0,0,0.65), 0 0 40px rgba(197,160,89,0.12)" }}
        >
          {chapterTitle}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{
            opacity: 0,
            y: -12,
            transition: { duration: 0.4, ease: easeExit, delay: 0.05 },
          }}
          transition={{ duration: 0.75, ease: easeEntrance, delay: 0.38 }}
          className="mt-7 font-serif text-base italic leading-relaxed text-solar-gold/50 md:text-lg"
        >
          {subtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scaleX: 0.35 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{
            opacity: 0,
            scaleX: 0.25,
            transition: { duration: 0.4, ease: easeExit, delay: 0 },
          }}
          transition={{ delay: 0.55, duration: 1.05, ease: easeEntrance }}
          className="mx-auto mt-11 h-px w-[min(12rem,72vw)] origin-center bg-gradient-to-r from-transparent via-solar-gold/45 to-transparent"
        />
      </motion.div>
    </motion.div>
  );
}
