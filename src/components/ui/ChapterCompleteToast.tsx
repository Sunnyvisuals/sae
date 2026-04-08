import { motion } from 'motion/react';

type Props = {
  chapterTitle: string;
  subtitle: string;
};

/**
 * Notification plein écran type « succès de chapitre » (style showcase).
 */
export default function ChapterCompleteToast({ chapterTitle, subtitle }: Props) {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-0 z-[190] flex cursor-none flex-col items-center justify-center bg-black/88 px-6 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.92, y: 24, filter: 'blur(12px)' }}
        animate={{ scale: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ scale: 0.96, y: 8, opacity: 0, filter: 'blur(8px)' }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-lg text-center"
      >
        <p className="text-[10px] uppercase tracking-[0.65em] text-solar-gold/50">Chapitre accompli</p>
        <h2
          className="font-bahlull mt-4 text-4xl italic text-white md:text-5xl"
          style={{ textShadow: '0 0 60px rgba(197,160,89,0.35)' }}
        >
          {chapterTitle}
        </h2>
        <p className="mt-6 font-serif text-lg italic leading-relaxed text-solar-gold/55">{subtitle}</p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.35, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-10 h-px w-32 origin-center bg-gradient-to-r from-transparent via-solar-gold/50 to-transparent"
        />
      </motion.div>
    </motion.div>
  );
}
