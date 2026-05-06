import { motion } from 'motion/react';
import { useAppCopy } from '../../hooks/useAppCopy';

type Props = {
  chapterTitle: string;
  subtitle: string;
};

/**
 * Chapitre accompli - entrée sobre (pas de zoom / flou agressif), alignée carte / or du projet.
 */
export default function ChapterCompleteToast({ chapterTitle, subtitle }: Props) {
  const copy = useAppCopy();
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[190] flex cursor-none flex-col items-center justify-center bg-gradient-to-b from-black/90 via-[#0a0806]/92 to-black/90 px-6 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
        className="max-w-lg text-center"
      >
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
          className="text-[10px] uppercase tracking-[0.52em] text-solar-gold/48"
        >
          {copy.chapterToastKicker}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="font-bahlull mt-5 text-4xl italic text-white md:text-5xl"
          style={{ textShadow: '0 1px 0 rgba(0,0,0,0.65), 0 0 40px rgba(197,160,89,0.12)' }}
        >
          {chapterTitle}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.38 }}
          className="mt-7 font-serif text-base italic leading-relaxed text-solar-gold/50 md:text-lg"
        >
          {subtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scaleX: 0.35 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.55, duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-11 h-px w-[min(12rem,72vw)] origin-center bg-gradient-to-r from-transparent via-solar-gold/45 to-transparent"
        />
      </motion.div>
    </motion.div>
  );
}
