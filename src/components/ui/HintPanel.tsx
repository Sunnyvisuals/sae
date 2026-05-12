'use client';

import { useEffect, useState, type ReactNode, useMemo } from 'react';
import { IconCheck } from './icons';
import { motion, AnimatePresence } from 'motion/react';
import { useAppCopy } from '../../hooks/useAppCopy';

export type Act1QuestProgress = {
  hover: boolean;
  clickWord: boolean;
  zoom: boolean;
};

export type Act2QuestProgress = {
  scroll: boolean;
};

const ACT1_QUEST_KEYS: (keyof Act1QuestProgress)[] = ['hover', 'clickWord', 'zoom'];
const ACT2_QUEST_KEYS: (keyof Act2QuestProgress)[] = ['scroll'];

type Phase = 'intro' | 'act1' | 'act2';

interface Hint {
  icon: ReactNode;
  label: string;
  desc: string;
}

const ACT1_ICONS: ReactNode[] = [
  (
    <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="6.5" cy="6.5" r="2" fill="currentColor" />
    </svg>
  ),
  (
    <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
      <path
        d="M6.5 1L8.2 4.5L12 5.1L9.25 7.8L9.9 11.6L6.5 9.8L3.1 11.6L3.75 7.8L1 5.1L4.8 4.5L6.5 1Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  ),
  (
    <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  ),
];

const ACT2_ICONS: ReactNode[] = [
  (
    <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
      <path
        d="M6.5 2L6.5 11M3 5L6.5 2L10 5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
];

interface Props {
  phase: Phase;
  /** Masque les consignes sans démonter (menu pause / vidéo) - évite de réinitialiser « fermé par l'utilisateur » au remontage. */
  suppress?: boolean;
  act1Quest?: Act1QuestProgress;
  act2Quest?: Act2QuestProgress;
}

export default function HintPanel({ phase, suppress = false, act1Quest, act2Quest }: Props) {
  const copy = useAppCopy();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<Phase>(phase);

  const HINTS: Record<Phase, Hint[]> = useMemo(
    () => ({
      intro: [],
      act1: copy.hintStepsAct1.map((t, i) => ({
        icon: ACT1_ICONS[i]!,
        label: t.label,
        desc: t.desc,
      })),
      act2: copy.hintStepsAct2.map((t, i) => ({
        icon: ACT2_ICONS[i]!,
        label: t.label,
        desc: t.desc,
      })),
    }),
    [copy],
  );

  const TITLES: Record<Phase, string> = useMemo(
    () => ({
      intro: '',
      act1: copy.hintTitles.act1,
      act2: copy.hintTitles.act2,
    }),
    [copy],
  );

  useEffect(() => {
    if (phase === 'intro') return;
    setDismissed(false);
    setCurrentPhase(phase);
    const t = window.setTimeout(() => setVisible(true), 900);
    return () => window.clearTimeout(t);
  }, [phase]);

  /** Fermeture auto une fois tous les gestes validés (« compris ») */
  useEffect(() => {
    if (phase === 'intro' || dismissed || !visible) return;

    const act1Done =
      phase === 'act1' &&
      act1Quest &&
      ACT1_QUEST_KEYS.every((k) => act1Quest[k]);

    const act2Done =
      phase === 'act2' &&
      act2Quest &&
      ACT2_QUEST_KEYS.every((k) => act2Quest[k]);

    if (!act1Done && !act2Done) return;

    const lingerMs = 1100;
    const exitMotionMs = 580;
    const timer = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(() => {
        setDismissed(true);
      }, exitMotionMs);
    }, lingerMs);
    return () => window.clearTimeout(timer);
  }, [phase, dismissed, visible, act1Quest, act2Quest]);

  const hints = HINTS[currentPhase] ?? [];
  const title = TITLES[currentPhase];
  /** Même palette dorée « chapitre I » pour actes I et II (pas le bleu nuit). */
  const nightChapter = false;
  const doneCount =
    currentPhase === 'act1' && act1Quest
      ? [act1Quest.hover, act1Quest.clickWord, act1Quest.zoom].filter(Boolean).length
      : currentPhase === 'act2' && act2Quest
        ? [act2Quest.scroll].filter(Boolean).length
        : 0;
  const act2Total = 1;
  const act1Total = 3;

  if (dismissed || hints.length === 0) return null;

  if (suppress) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={currentPhase}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={
            'pointer-events-auto fixed select-none ' +
            (currentPhase === 'act2'
              ? /* Au-dessus de la scène (z-20), sous tout le chrome / halo - traitement « arrière-plan » */
                'z-[21] '
              : 'z-[50] ') +
            'left-[max(1rem,calc(env(safe-area-inset-left)+0.5rem))] md:left-[max(1.5rem,calc(env(safe-area-inset-left)+0.75rem))] ' +
            (currentPhase === 'act1'
              ? 'top-[max(7.25rem,calc(env(safe-area-inset-top)+5.5rem))] md:top-[max(9rem,calc(env(safe-area-inset-top)+7rem))]'
              : 'top-[max(5rem,calc(env(safe-area-inset-top)+3.5rem))]')
          }
        >
          <div
            className={
              'relative w-[min(248px,calc(100vw-2rem))] overflow-hidden rounded-[2px] backdrop-blur-xl ' +
              (nightChapter
                ? 'border border-[rgba(139,213,255,0.26)] bg-[rgba(2,6,18,0.88)] shadow-[0_16px_52px_rgba(0,0,0,0.58),0_0_0_1px_rgba(90,168,255,0.07),0_0_48px_rgba(90,168,255,0.07)]'
                : 'border border-solar-gold/[0.28] bg-[#080604]/[0.88] shadow-[0_16px_48px_rgba(0,0,0,0.65),0_0_0_1px_rgba(197,160,89,0.06)]')
            }
          >
            <span
              className={
                'pointer-events-none absolute left-2 top-2 h-2.5 w-2.5 border-l border-t ' +
                (nightChapter ? 'border-[rgba(139,213,255,0.35)]' : 'border-solar-gold/25')
              }
              aria-hidden
            />

            <div className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2.5">
              <div className="min-w-0 flex items-baseline gap-2.5">
                <p
                  className={
                    'text-[9px] font-semibold uppercase tracking-[0.42em] ' +
                    (nightChapter ? 'text-[rgba(234,215,164,0.72)]' : 'text-solar-gold/80')
                  }
                >
                  {title}
                </p>
                {currentPhase === 'act1' && act1Quest && (
                  <p
                    className={
                      'text-[9px] tabular-nums ' +
                      (nightChapter ? 'text-[rgba(139,213,255,0.45)]' : 'text-solar-gold/45')
                    }
                  >
                    {doneCount}/{act1Total}
                  </p>
                )}
                {currentPhase === 'act2' && act2Quest && (
                  <p
                    className={
                      'text-[9px] tabular-nums ' +
                      (nightChapter ? 'text-[rgba(139,213,255,0.45)]' : 'text-solar-gold/45')
                    }
                  >
                    {doneCount}/{act2Total}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setVisible(false);
                  setDismissed(true);
                }}
                className={
                  'flex h-5 w-5 shrink-0 items-center justify-center transition-colors duration-200 focus-visible:outline-none ' +
                  (nightChapter
                    ? 'text-[rgba(139,213,255,0.28)] hover:text-[rgba(234,215,164,0.55)]'
                    : 'text-solar-gold/20 hover:text-solar-gold/50')
                }
                aria-label={copy.hintCloseAria}
              >
                <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                  <line x1="1" y1="1" x2="7" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  <line x1="7" y1="1" x2="1" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div
              className={
                'mx-3.5 h-px ' + (nightChapter ? 'bg-[rgba(139,213,255,0.14)]' : 'bg-solar-gold/[0.1]')
              }
            />

            <ul className="flex flex-col">
              {hints.map((hint, i) => {
                const questKey =
                  currentPhase === 'act1'
                    ? ACT1_QUEST_KEYS[i]
                    : currentPhase === 'act2'
                      ? ACT2_QUEST_KEYS[i]
                      : undefined;
                const done =
                  questKey !== undefined && currentPhase === 'act1' && act1Quest
                    ? act1Quest[questKey as keyof Act1QuestProgress]
                    : questKey !== undefined && currentPhase === 'act2' && act2Quest
                      ? act2Quest[questKey as keyof Act2QuestProgress]
                      : false;
                return (
                  <motion.li
                    key={hint.label}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.08 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    className={
                      'flex items-start gap-2.5 px-3.5 py-3 ' +
                      (i < hints.length - 1
                        ? nightChapter
                          ? 'border-b border-[rgba(139,213,255,0.09)] '
                          : 'border-b border-solar-gold/[0.07] '
                        : '') +
                      (done ? (nightChapter ? 'bg-[rgba(90,168,255,0.06)]' : 'bg-[rgba(197,160,89,0.05)]') : '')
                    }
                  >
                    <div className="mt-px flex h-4 w-4 shrink-0 items-center justify-center">
                      {done ? (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                          className={
                            'flex h-4 w-4 items-center justify-center rounded-full ' +
                            (nightChapter
                              ? 'bg-[rgba(90,168,255,0.18)] text-[#ead7a4] shadow-[0_0_10px_rgba(90,168,255,0.25)]'
                              : 'bg-solar-gold/20 text-solar-gold shadow-[0_0_10px_rgba(197,160,89,0.35)]')
                          }
                          aria-hidden
                        >
                          <IconCheck className="h-2.5 w-2.5" aria-hidden />
                        </motion.span>
                      ) : (
                        <span
                          className={
                            nightChapter ? 'text-[rgba(139,213,255,0.78)]' : 'text-solar-gold/70'
                          }
                        >
                          {hint.icon}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={
                          'text-[9px] font-semibold uppercase tracking-[0.24em] ' +
                          (done
                            ? nightChapter
                              ? 'text-[#ead7a4]'
                              : 'text-solar-gold'
                            : nightChapter
                              ? 'text-[rgba(234,215,164,0.78)]'
                              : 'text-solar-gold/75')
                        }
                      >
                        {hint.label}
                      </p>
                      <p
                        className={
                          'mt-1 text-[11px] font-normal leading-relaxed ' +
                          (done
                            ? nightChapter
                              ? 'text-[rgba(250,246,235,0.88)]'
                              : 'text-white/80'
                            : nightChapter
                              ? 'text-[rgba(250,246,235,0.74)]'
                              : 'text-white/70')
                        }
                      >
                        {hint.desc}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </ul>

            <span
              className={
                'pointer-events-none absolute bottom-2 right-2 h-2.5 w-2.5 border-b border-r ' +
                (nightChapter
                  ? 'border-[rgba(197,160,89,0.35)]'
                  : 'border-solar-gold/25')
              }
              aria-hidden
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
