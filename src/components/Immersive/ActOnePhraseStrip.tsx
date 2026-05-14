import { motion, AnimatePresence } from 'motion/react';
import { REVELATION_WORDS, type RevelationWord } from './mapWordData';
import { useAppCopy } from '../../hooks/useAppCopy';
import { revelationWordUISurface } from '../../lib/appCopy';
import { useLanguageStore } from '../../stores/languageStore';

/** DA : apparition lente (clip), sortie douce entre deux vers. */
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

function BlankOrWord({
  word,
  found,
  surface,
  aria,
}: {
  word: RevelationWord;
  found: boolean;
  surface: string;
  aria: string;
}) {
  if (found) {
    return (
      <motion.span
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.85, ease: VERSE_EASE_IN }}
        className="font-bahlull text-[1.35rem] not-italic text-white sm:text-[1.45rem] md:text-[1.55rem]"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.42), 0 0 14px rgba(197,160,89,0.28)" }}
      >
        {surface}
      </motion.span>
    );
  }
  return (
    <span
      className="inline-block min-w-[4.25rem] border-b-2 border-dashed border-white/35 pb-1 font-mono text-base tracking-[0.1em] text-white/45 sm:min-w-[4.75rem] sm:text-lg [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]"
      aria-label={aria}
    >
      ·····
    </span>
  );
}

export default function ActOnePhraseStrip({ revelationFound, chapterComplete, hasZoomed }: Props) {
  const copy = useAppCopy();
  const lang = useLanguageStore((s) => s.language);
  const steps = copy.phraseStripSteps;

  const has = (w: RevelationWord) => revelationFound.includes(w);
  const allDone = REVELATION_WORDS.every((w) => has(w));

  const firstMissing = REVELATION_WORDS.findIndex((w) => !has(w));
  const activeIdx = firstMissing === -1 ? 0 : firstMissing;
  const step = steps[activeIdx]!;

  if (!hasZoomed) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[38] flex flex-col justify-end items-center overflow-x-hidden"
      aria-live="polite"
    >
      <div className="w-full max-w-[min(42rem,calc(100vw-1.5rem))] px-5 pb-[max(0.65rem,calc(env(safe-area-inset-bottom)+0.35rem))] pt-2 sm:px-8 md:pb-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.45rem))] md:pt-3">
        <div className="mx-auto w-full min-w-0 text-center">
          {chapterComplete || allDone ? (
            <motion.p
              initial={{ opacity: 0.75, clipPath: 'inset(0 100% 0 0)' }}
              animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
              transition={{ duration: 2.1, ease: VERSE_EASE_IN }}
              className="text-center font-serif text-[17px] italic leading-relaxed text-white sm:text-[18px] md:text-[19px]"
              style={{
                textShadow: "0 1px 2px rgba(0,0,0,0.38), 0 0 18px rgba(197,160,89,0.14)",
              }}
            >
              {copy.phraseStripComplete}
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
                      },
                      animate: {
                        opacity: 1,
                        clipPath: 'inset(0 0% 0 0)',
                        transition: { duration: VERSE_IN_DURATION, ease: VERSE_EASE_IN },
                      },
                      exit: {
                        opacity: 0,
                        clipPath: 'inset(0 0 0 100%)',
                        transition: { duration: VERSE_OUT_DURATION, ease: VERSE_EASE_OUT },
                      },
                    }}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="text-center font-serif text-[18px] italic leading-[1.75] text-white sm:text-[20px] sm:leading-[1.85] md:text-[22px] md:leading-[1.9]"
                    style={{
                      textShadow: "0 1px 2px rgba(0,0,0,0.4), 0 0 20px rgba(197,160,89,0.12)",
                    }}
                  >
                    {step.before}
                    <BlankOrWord
                      word={step.word}
                      found={has(step.word)}
                      surface={revelationWordUISurface(step.word, lang)}
                      aria={copy.revelationWordAria[step.word]}
                    />
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
