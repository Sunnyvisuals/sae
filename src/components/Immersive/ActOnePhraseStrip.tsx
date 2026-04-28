import { motion, AnimatePresence } from 'motion/react';
import { REVELATION_WORDS, type RevelationWord } from './mapWordData';

/** DA : apparition lente (clip + blur), sortie douce entre deux vers. */
const VERSE_IN_DURATION = 2.45;
const VERSE_OUT_DURATION = 1.1;
const VERSE_EASE_IN: [number, number, number, number] = [0.33, 1, 0.68, 1];
const VERSE_EASE_OUT: [number, number, number, number] = [0.45, 0, 0.55, 1];

type Props = {
  revelationFound: string[];
  chapterComplete: boolean;
  /** N'affiche la phrase qu'après le premier zoom de l'utilisateur. */
  hasZoomed: boolean;
};

const STEPS: { word: RevelationWord; before: string; after: string }[] = [
  { word: 'naissance', before: '« ', after: ' du poème, naissance du jour »' },
  { word: 'soleil', before: '« ', after: ', soleil, tu brûles ma bouche »' },
  { word: 'mère', before: '« Terre-', after: ', soleil au front des vagues »' },
  { word: 'liberté', before: '« ', after: ', j’écris ton nom dans le sable »' },
  { word: 'corps', before: '« ', after: ' corail, corps de feu et de sel »' },
];

function BlankOrWord({ word, found }: { word: RevelationWord; found: boolean }) {
  if (found) {
    return (
      <motion.span
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.85, ease: VERSE_EASE_IN }}
        className="font-bahlull text-[1.35rem] not-italic text-white sm:text-[1.45rem] md:text-[1.55rem]"
        style={{ textShadow: '0 0 24px rgba(0,0,0,0.85), 0 0 18px rgba(197,160,89,0.35)' }}
      >
        {word}
      </motion.span>
    );
  }
  return (
    <span
      className="inline-block min-w-[4.25rem] border-b-2 border-dashed border-white/35 pb-1 font-mono text-base tracking-[0.1em] text-white/45 sm:min-w-[4.75rem] sm:text-lg [text-shadow:0_0_14px_rgba(0,0,0,0.95)]"
      aria-label={`Mot à trouver : ${word}`}
    >
      ·····
    </span>
  );
}

export default function ActOnePhraseStrip({ revelationFound, chapterComplete, hasZoomed }: Props) {
  const has = (w: RevelationWord) => revelationFound.includes(w);
  const allDone = REVELATION_WORDS.every((w) => has(w));

  const firstMissing = REVELATION_WORDS.findIndex((w) => !has(w));
  const activeIdx = firstMissing === -1 ? 0 : firstMissing;
  const step = STEPS[activeIdx]!;

  if (!hasZoomed) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[38] flex justify-center overflow-x-hidden"
      aria-live="polite"
    >
      {/* Centré sur tout l’écran (pas seulement la zone à gauche du panneau latéral) */}
      <div className="w-full max-w-[min(42rem,calc(100vw-1.5rem))] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 sm:px-8 md:pb-[max(2rem,env(safe-area-inset-bottom))] md:pt-10">
        <div className="mx-auto w-full min-w-0 text-center">
          {chapterComplete || allDone ? (
            <motion.p
              initial={{ opacity: 0.75, clipPath: 'inset(0 100% 0 0)', filter: 'blur(12px)' }}
              animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)', filter: 'blur(0px)' }}
              transition={{ duration: 2.1, ease: VERSE_EASE_IN }}
              className="text-center font-serif text-[17px] italic leading-relaxed text-white sm:text-[18px] md:text-[19px]"
              style={{
                textShadow: '0 0 28px rgba(0,0,0,0.95), 0 2px 14px rgba(0,0,0,0.88), 0 0 20px rgba(197,160,89,0.15)',
              }}
            >
              Sous l’oasis du texte, la phrase entière se lit - le vers vous retient encore un instant.
            </motion.p>
          ) : (
            <>
              <div className="relative min-h-[5rem] overflow-hidden sm:min-h-[5.5rem]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step.word}
                    role="status"
                    variants={{
                      initial: {
                        opacity: 0.6,
                        clipPath: 'inset(0 100% 0 0)',
                        filter: 'blur(16px)',
                      },
                      animate: {
                        opacity: 1,
                        clipPath: 'inset(0 0% 0 0)',
                        filter: 'blur(0px)',
                        transition: { duration: VERSE_IN_DURATION, ease: VERSE_EASE_IN },
                      },
                      exit: {
                        opacity: 0,
                        clipPath: 'inset(0 0 0 100%)',
                        filter: 'blur(10px)',
                        transition: { duration: VERSE_OUT_DURATION, ease: VERSE_EASE_OUT },
                      },
                    }}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="text-center font-serif text-[18px] italic leading-[1.75] text-white sm:text-[20px] sm:leading-[1.85] md:text-[22px] md:leading-[1.9]"
                    style={{
                      textShadow:
                        '0 0 32px rgba(0,0,0,0.95), 0 3px 18px rgba(0,0,0,0.92), 0 0 28px rgba(197,160,89,0.12)',
                    }}
                  >
                    {step.before}
                    <BlankOrWord word={step.word} found={has(step.word)} />
                    {step.after}
                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
