'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { IconChevronLeft } from './icons';
import { useReducedMotion } from 'motion/react';
import { ALGERIA_PATH } from '../Immersive/algeriaOutlinePath';
import { useAppCopy } from '../../hooks/useAppCopy';

type PhaseLabel = 'intro' | 'act1' | 'act2';

export type { PhaseLabel as ParcoursPhaseLabel };

/** Largeur repliée (px) - alignée avec AlgeriaMap (indicateur échelle). */
const PARCOURS_COLLAPSED_PX = 40;
const EXPANDED_MAX_PX = 248;
const GSAP_CLOSE_S = 0.9;
const GSAP_OPEN_S = 1.58;

type Props = {
  phase: PhaseLabel;
  revelationCount?: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** Acte II : rail « nuit » (bleu) vs doré selon l’immersion iframe parchemin. Si absent, comportement précédent (nuit tant qu’on est en acte II). */
  parcoursRailMidnight?: boolean;
  /** Générique de fin voyage (iframe) : le rail affiche « Crédits » comme étape en cours. */
  act2VoyageCreditsOpen?: boolean;
  /** Après traversée complète : étapes du fil cliquables pour revivre chaque acte. */
  journeyReplayUnlocked?: boolean;
  onNavigatePhase?: (phase: PhaseLabel) => void;
};

const PHASE_NAV_INDEX: Record<PhaseLabel, number> = { intro: 0, act1: 1, act2: 2 };

/** Lignes fixes du fil (actes réels + jalons à venir). */
type ParcoursRow = {
  key: string;
  /** `null` = placeholder (pas encore jouable). */
  phase: PhaseLabel | null;
  label: string;
  summary: string;
  variant: 'past' | 'current' | 'future';
  /** Ligne « Crédits » : affichage révélé (non cryptique) même si `phase` est null. */
  forceReveal?: boolean;
};

function navSummaryClass(active: boolean, night: boolean) {
  if (night) {
    return active
      ? 'text-[rgba(250,246,235,0.58)]'
      : 'text-[rgba(139,213,255,0.28)]';
  }
  return active ? 'text-solar-gold/52' : 'text-solar-gold/[0.28]';
}

/** Titres jalons encore verrouillés - lisibilité préservée (contraste sous actes « futurs »). */
function parcoursCrypticTitleClass(night: boolean) {
  return night
    ? 'font-medium text-[10px] sm:text-[11px] tracking-[0.05em] text-[rgba(190,216,246,0.78)] [text-shadow:0_1px_12px_rgba(0,0,0,0.88)]'
    : 'font-medium text-[10px] sm:text-[11px] tracking-[0.04em] text-[rgba(148,138,118,0.82)] [text-shadow:0_1px_8px_rgba(0,0,0,0.75)]';
}

/** Sous-texte ??? : monospace un peu étiré, mais lisible sur fond sombre. */
function parcoursCrypticSummaryClass(night: boolean) {
  return night
    ? 'font-mono text-[9px] sm:text-[10px] tracking-[0.36em] text-[rgba(160,192,226,0.58)]'
    : 'font-mono text-[9px] sm:text-[10px] tracking-[0.34em] text-[rgba(130,118,98,0.68)]';
}

/** Point sur la ligne de parcours : étapes passées / en cours / à venir. */
function TimelineDot({
  cryptic,
  variant,
  night,
}: {
  cryptic?: boolean;
  variant: 'past' | 'current' | 'future';
  night: boolean;
}) {
  if (cryptic) {
    return night ? (
      <span
        className={
          'relative z-[2] mx-auto mt-px block h-2 w-2 shrink-0 rounded-full ' +
          'border border-dashed border-[rgba(155,188,226,0.48)] bg-[rgba(18,34,54,0.72)] opacity-95 ' +
          'shadow-[inset_0_0_6px_rgba(0,0,0,0.42),0_0_12px_rgba(90,140,210,0.12)] ring-[3px] ring-[rgba(2,12,26,0.98)]'
        }
        aria-hidden
      />
    ) : (
      <span
        className={
          'relative z-[2] mx-auto mt-px block h-2 w-2 shrink-0 rounded-full ' +
          'border border-dashed border-solar-gold/35 bg-black/46 opacity-95 ring-[3px] ring-[#080705]'
        }
        aria-hidden
      />
    );
  }
  if (night) {
    if (variant === 'past') {
      return (
        <span
          className="relative z-[2] mx-auto mt-px block h-2 w-2 shrink-0 rounded-full bg-[rgba(139,213,255,0.58)] shadow-[0_0_14px_rgba(90,168,255,0.42)] ring-4 ring-[rgba(2,8,24,0.96)] ring-offset-0"
          aria-hidden
        />
      );
    }
    if (variant === 'current') {
      return (
        <span
          className={
            'relative z-[2] mx-auto mt-px flex h-[10px] w-[10px] shrink-0 items-center justify-center rounded-full ' +
            'bg-[rgba(234,215,164,0.96)] shadow-[0_0_18px_rgba(90,168,255,0.52),0_0_26px_rgba(234,215,164,0.35)] ring-4 ring-[rgba(2,8,24,0.96)]'
          }
          aria-hidden
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[rgba(2,8,24,0.85)]" aria-hidden />
        </span>
      );
    }
    return (
      <span
        className="relative z-[2] mx-auto mt-px block h-2 w-2 shrink-0 rounded-full border border-[rgba(139,213,255,0.42)] bg-[rgba(2,10,26,0.65)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.4)] ring-4 ring-[rgba(2,8,24,0.96)] ring-offset-0"
        aria-hidden
      />
    );
  }

  if (variant === 'past') {
    return (
      <span
        className="relative z-[2] mx-auto mt-px block h-2 w-2 shrink-0 rounded-full bg-solar-gold/72 shadow-[0_0_14px_rgba(197,160,89,0.42)] ring-4 ring-[#080705] ring-offset-0"
        aria-hidden
      />
    );
  }
  if (variant === 'current') {
    return (
      <span
        className="relative z-[2] mx-auto mt-px block h-[10px] w-[10px] shrink-0 rounded-full bg-[#f8f4eb] shadow-[0_0_20px_rgba(197,160,89,0.62),0_0_34px_rgba(197,160,89,0.28)] ring-4 ring-[#080705]"
        aria-hidden
      />
    );
  }
  return (
    <span
      className="relative z-[2] mx-auto mt-px block h-2 w-2 shrink-0 rounded-full border border-solar-gold/28 bg-black/35 ring-4 ring-[#080705] ring-offset-0"
      aria-hidden
    />
  );
}

function navItemClass(active: boolean, night: boolean) {
  if (night) {
    return active
      ? 'font-semibold text-[rgba(234,215,164,0.95)] [text-shadow:0_0_20px_rgba(90,168,255,0.35),0_1px_12px_rgba(0,0,0,0.92)]'
      : 'font-normal text-[rgba(139,213,255,0.42)] [text-shadow:0_1px_10px_rgba(0,0,0,0.88)]';
  }
  return active
    ? 'font-semibold text-solar-gold [text-shadow:0_0_22px_rgba(197,160,89,0.45),0_1px_12px_rgba(0,0,0,0.88)]'
    : 'font-normal text-solar-gold/[0.38] [text-shadow:0_1px_10px_rgba(0,0,0,0.82)]';
}

/** Corps du rail Parcours (fil, flux acte II, mini-carte) — réemployé dans le menu pause sous `md`. */
export function ParcoursPanelInnerContent({
  phase,
  revelationCount = 0,
  parcoursRailMidnight,
  act2VoyageCreditsOpen = false,
  journeyReplayUnlocked = false,
  onNavigatePhase,
  className = '',
}: Omit<Props, 'expanded' | 'onExpandedChange'> & { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const copy = useAppCopy();
  const nightRail =
    phase === 'act2' ? (typeof parcoursRailMidnight === 'boolean' ? parcoursRailMidnight : true) : false;
  const activeStep = PHASE_NAV_INDEX[phase];

  const lockedTitle = (p: PhaseLabel) =>
    p === 'intro'
      ? copy.orientationLockedIntro
      : p === 'act1'
        ? copy.orientationLockedAct1
        : copy.orientationLockedAct2;

  const navRows: ParcoursRow[] = (() => {
    const order: { label: string; phase: PhaseLabel }[] = [
      { label: copy.orientationPhaseIntroLabel, phase: 'intro' },
      { label: copy.orientationPhaseAct1Label, phase: 'act1' },
      { label: copy.orientationPhaseAct2Label, phase: 'act2' },
    ];
    const sums = copy.orientationSummaries;
    const baseRows: ParcoursRow[] = [
      ...order.map(({ label, phase: p }) => {
        const stepIdx = PHASE_NAV_INDEX[p];
        const variant: 'past' | 'current' | 'future' =
          stepIdx < activeStep ? 'past' : stepIdx === activeStep ? 'current' : 'future';
        return {
          key: p,
          phase: p,
          label,
          summary: sums[p],
          variant,
        };
      }),
      {
        key: 'act3-suivante',
        phase: null,
        label: copy.orientationFutureAct3,
        summary: '???',
        variant: 'future' as const,
      },
      {
        key: 'act4-suivante',
        phase: null,
        label: copy.orientationFutureAct4,
        summary: '???',
        variant: 'future' as const,
      },
    ];
    if (phase === 'act2' && act2VoyageCreditsOpen) {
      return [
        ...baseRows.map((row) =>
          row.phase !== null ? { ...row, variant: 'past' as const } : row
        ),
        {
          key: 'credits',
          phase: null,
          label: copy.orientationCreditsLabel,
          summary: copy.orientationCreditsSummary,
          variant: 'current' as const,
          forceReveal: true,
        },
      ];
    }
    return baseRows;
  })();

  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${className}`}>
      {journeyReplayUnlocked ? (
        <p
          className={
            'mb-3 shrink-0 px-0.5 text-[9px] font-normal leading-relaxed sm:text-[10px] ' +
            (nightRail ? 'text-[rgba(234,215,164,0.48)]' : 'text-solar-gold/40')
          }
        >
          {copy.orientationReplayHint}
        </p>
      ) : null}
      <nav
        className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden pl-0.5"
        aria-label={copy.orientationBreadcrumbAria}
      >
        <span
          aria-hidden
          className={
            'pointer-events-none absolute left-[13px] top-4 bottom-4 z-0 w-px rounded-full ' +
            (nightRail
              ? 'bg-gradient-to-b from-[rgba(139,213,255,0.05)] via-[rgba(139,213,255,0.22)] to-[rgba(139,213,255,0.07)]'
              : 'bg-gradient-to-b from-solar-gold/8 via-solar-gold/22 to-solar-gold/10')
          }
        />
        {navRows.map(({ key, phase: rowPhase, label, variant, summary, forceReveal }) => {
          /** Quand les crédits sont ouverts, seule la ligne Crédits (forceReveal) est active. */
          const creditsMode = phase === 'act2' && act2VoyageCreditsOpen;
          const active = !!forceReveal || (!creditsMode && rowPhase !== null && phase === rowPhase);
          const cryptic =
            !journeyReplayUnlocked &&
            !forceReveal &&
            (rowPhase === null || (rowPhase !== null && PHASE_NAV_INDEX[rowPhase] > activeStep));
          const showCrypticCopy = cryptic && rowPhase !== null;
          const rowLabel = showCrypticCopy ? lockedTitle(rowPhase) : label;
          const rowSummary = showCrypticCopy ? '???' : summary;
          const canNavigate =
            journeyReplayUnlocked && typeof onNavigatePhase === 'function' && rowPhase !== null && !forceReveal;
          return (
            <div
              key={key}
              className={
                'relative z-[1] flex items-start gap-3 py-3 pr-1 sm:py-3.5 ' +
                (cryptic ? 'select-none' : '')
              }
            >
              <div className="flex w-[22px] shrink-0 flex-col items-center pt-[3px]">
                <TimelineDot cryptic={cryptic} variant={variant} night={nightRail} />
              </div>
              <div className="min-w-0 flex-1">
                {canNavigate ? (
                  <button
                    type="button"
                    className={
                      'w-full rounded-[2px] text-left transition-[background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-1 ' +
                      (nightRail
                        ? 'focus-visible:ring-[rgba(139,213,255,0.35)] hover:bg-[rgba(8,18,38,0.35)]'
                        : 'focus-visible:ring-solar-gold/35 hover:bg-black/25')
                    }
                    onClick={() => onNavigatePhase(rowPhase)}
                  >
                    <p
                      className={
                        'rounded-[2px] pl-0.5 pr-1 leading-snug text-[10px] tracking-wide sm:text-[11px] ' +
                        navItemClass(active, nightRail)
                      }
                    >
                      {rowLabel}
                    </p>
                    <p
                      className={
                        'mt-1.5 pl-0.5 pr-1 text-[9px] font-normal leading-relaxed sm:text-[10px] ' +
                        navSummaryClass(active, nightRail)
                      }
                    >
                      {rowSummary}
                    </p>
                  </button>
                ) : (
                  <>
                    <p
                      className={
                        cryptic
                          ? 'rounded-[2px] pl-0.5 pr-1 leading-snug ' + parcoursCrypticTitleClass(nightRail)
                          : 'rounded-[2px] pl-0.5 pr-1 leading-snug text-[10px] tracking-wide sm:text-[11px] ' +
                            navItemClass(active, nightRail)
                      }
                    >
                      {rowLabel}
                    </p>
                    <p
                      className={
                        cryptic
                          ? 'mt-1.5 pl-0.5 pr-1 leading-relaxed ' + parcoursCrypticSummaryClass(nightRail)
                          : 'mt-1.5 pl-0.5 pr-1 text-[9px] font-normal leading-relaxed sm:text-[10px] ' +
                            navSummaryClass(active, nightRail)
                      }
                    >
                      {rowSummary}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {phase === 'act2' && (
        <div
          className={
            'mt-6 shrink-0 border-t pt-5 ' +
            (nightRail ? 'border-[rgba(139,213,255,0.12)]' : 'border-solar-gold/[0.1]')
          }
        >
          <p
            className={
              'text-center text-[8px] font-semibold uppercase tracking-[0.44em] ' +
              (nightRail ? 'text-[rgba(234,215,164,0.48)]' : 'text-solar-gold/45')
            }
          >
            {copy.orientationFlux}
          </p>
          <div
            className={
              'mx-auto mt-3 flex h-10 flex-col items-center justify-between gap-1.5 ' +
              (!prefersReducedMotion ? 'parcours-flux-stagger' : '')
            }
            aria-hidden
          >
            <span
              className={
                nightRail
                  ? 'h-1 w-1 rounded-full bg-[rgba(234,215,164,0.88)] shadow-[0_0_12px_rgba(90,168,255,0.35)]'
                  : 'h-1 w-1 rounded-full bg-solar-gold/88 shadow-[0_0_10px_rgba(197,160,89,0.45)]'
              }
            />
            <span
              className={
                nightRail
                  ? 'h-1 w-1 rounded-full bg-[rgba(234,215,164,0.88)] shadow-[0_0_12px_rgba(90,168,255,0.35)]'
                  : 'h-1 w-1 rounded-full bg-solar-gold/88 shadow-[0_0_10px_rgba(197,160,89,0.45)]'
              }
            />
            <span
              className={
                nightRail
                  ? 'h-1 w-1 rounded-full bg-[rgba(234,215,164,0.88)] shadow-[0_0_12px_rgba(90,168,255,0.35)]'
                  : 'h-1 w-1 rounded-full bg-solar-gold/88 shadow-[0_0_10px_rgba(197,160,89,0.45)]'
              }
            />
          </div>
          <p
            className={
              'mt-3 text-center text-[9px] font-normal leading-relaxed ' +
              (nightRail ? 'text-[rgba(250,246,235,0.42)]' : 'text-solar-gold/38')
            }
          >
            {act2VoyageCreditsOpen
              ? copy.orientationFluxCredits
              : copy.orientationFluxScroll}
          </p>
        </div>
      )}

      {phase === 'act1' && (
        <div className="mt-6 shrink-0">
          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.32em] text-solar-gold/40">
            {copy.orientationMiniMap}
          </p>
          <div className="relative aspect-square w-full overflow-hidden rounded-[2px] border border-solar-gold/18 bg-black/30 p-2">
            <svg viewBox="0 0 400 400" className="h-full w-full text-solar-gold" aria-hidden>
              <path
                d={ALGERIA_PATH}
                fill="currentColor"
                fillOpacity={0.15}
                stroke="currentColor"
                strokeOpacity={0.9}
                strokeWidth={1.85}
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute bottom-1.5 right-1.5 text-[9px] font-medium tabular-nums text-solar-gold/60 [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">
              {revelationCount}/5
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function useExpandedWidthPx() {
  const [px, setPx] = useState(() =>
    typeof window !== 'undefined'
      ? Math.min(EXPANDED_MAX_PX, Math.max(200, Math.round(window.innerWidth * 0.22)))
      : EXPANDED_MAX_PX
  );
  useEffect(() => {
    const upd = () =>
      setPx(Math.min(EXPANDED_MAX_PX, Math.max(200, Math.round(window.innerWidth * 0.22))));
    window.addEventListener('resize', upd, { passive: true });
    return () => window.removeEventListener('resize', upd);
  }, []);
  return px;
}

/** Après ce délai (rail replié), le fond / bordure s’estompent — restent le libellé + l’encoche. */
const COLLAPSED_MINIMAL_AFTER_MS = 10_000;

export default function OrientationPanel({
  phase,
  revelationCount = 0,
  expanded,
  onExpandedChange,
  parcoursRailMidnight,
  act2VoyageCreditsOpen,
  journeyReplayUnlocked,
  onNavigatePhase,
}: Props) {
  const copy = useAppCopy();
  const expandedW = useExpandedWidthPx();
  const shellRef = useRef<HTMLDivElement>(null);
  const didInit = useRef(false);
  const prevExpandedRef = useRef(expanded);
  /** Rail replié : au bout de 10 s, chrome du panneau retiré (texte + chevron seuls). */
  const [collapsedMinimal, setCollapsedMinimal] = useState(false);
  /**
   * contentOpen reste true pendant la fermeture le temps que le contenu
   * fade out, puis passe à false pour démonter et afficher le bouton replié.
   */
  const [contentOpen, setContentOpen] = useState(expanded);
  const contentCloseTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => {
    if (expanded) {
      setCollapsedMinimal(false);
      return;
    }
    const id = window.setTimeout(() => setCollapsedMinimal(true), COLLAPSED_MINIMAL_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [expanded]);

  /* Synchronise contentOpen avec expanded en ajoutant un délai à la fermeture */
  useEffect(() => {
    if (contentCloseTimerRef.current) {
      window.clearTimeout(contentCloseTimerRef.current);
      contentCloseTimerRef.current = null;
    }
    if (expanded) {
      setContentOpen(true);
    } else {
      /* Laisse le temps à l'opacity de transitionner (300 ms) avant de démonter */
      contentCloseTimerRef.current = window.setTimeout(() => {
        setContentOpen(false);
      }, 320);
    }
    return () => {
      if (contentCloseTimerRef.current) window.clearTimeout(contentCloseTimerRef.current);
    };
  }, [expanded]);

  useLayoutEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const target = expanded ? expandedW : PARCOURS_COLLAPSED_PX;
    if (!didInit.current) {
      gsap.set(el, { width: target });
      didInit.current = true;
      prevExpandedRef.current = expanded;
      return;
    }
    const wasExpanded = prevExpandedRef.current;
    prevExpandedRef.current = expanded;
    if (wasExpanded === expanded) return;
    gsap.killTweensOf(el);
    gsap.to(el, {
      width: target,
      duration: expanded ? GSAP_OPEN_S : GSAP_CLOSE_S,
      ease: 'power2.inOut',
      overwrite: true,
    });
  }, [expanded, expandedW]);

  useEffect(() => {
    if (!expanded || !didInit.current) return;
    const el = shellRef.current;
    if (!el) return;
    gsap.to(el, { width: expandedW, duration: 0.45, ease: 'power2.out', overwrite: true });
  }, [expandedW, expanded]);

  const nightRail =
    phase === 'act2' ? (typeof parcoursRailMidnight === 'boolean' ? parcoursRailMidnight : true) : false;

  const quietCollapsed = !expanded && collapsedMinimal;

  return (
    <div
      ref={shellRef}
      className={
        'hidden md:block pointer-events-auto fixed right-0 top-0 z-[40] h-full max-h-screen overflow-hidden ' +
        'will-change-[width] ' +
        (quietCollapsed
          ? 'border-l border-transparent bg-transparent shadow-none backdrop-blur-none ' +
            'transition-[background-color,backdrop-filter,box-shadow,border-color] duration-[850ms] ease-out ' +
            'hover:bg-black/[0.07] hover:backdrop-blur-[3px] hover:shadow-[-3px_0_14px_rgba(0,0,0,0.14)]'
          : 'shadow-[-4px_0_28px_rgba(0,0,0,0.12)] ' +
            'transition-[background-color,backdrop-filter,box-shadow,border-color] duration-300 ease-out ' +
            (nightRail
              ? 'border-l border-[rgba(139,213,255,0.14)] bg-[rgba(2,6,18,0.35)] backdrop-blur-[6px] ' +
                (expanded
                  ? 'bg-[rgba(2,8,24,0.88)] backdrop-blur-xl shadow-[-8px_0_44px_rgba(0,0,0,0.5)] border-[rgba(139,213,255,0.22)] '
                  : 'hover:bg-[rgba(3,10,28,0.82)] hover:backdrop-blur-xl hover:shadow-[-8px_0_44px_rgba(0,0,0,0.42)] hover:border-[rgba(139,213,255,0.26)] ')
              : 'border-l border-solar-gold/[0.1] bg-[#060402]/[0.14] backdrop-blur-[5px] ' +
                (expanded
                  ? 'bg-[#080705]/[0.82] backdrop-blur-xl shadow-[-8px_0_44px_rgba(0,0,0,0.38)] border-solar-gold/[0.18] '
                  : 'hover:bg-[#080705]/[0.78] hover:backdrop-blur-xl hover:shadow-[-8px_0_44px_rgba(0,0,0,0.38)] hover:border-solar-gold/[0.22] ')))
      }
      aria-expanded={expanded}
    >
      {!contentOpen ? (
        /* ── Bande repliée : clic = ouvrir ── */
        <button
          type="button"
          onClick={() => onExpandedChange(true)}
          className={
            'group flex h-full w-full min-w-0 flex-col items-center justify-center gap-3 bg-transparent px-0 py-10 focus-visible:outline-none focus-visible:ring-1 ' +
            (nightRail ? 'focus-visible:ring-[rgba(139,213,255,0.35)]' : 'focus-visible:ring-solar-gold/35')
          }
          aria-label={copy.orientationOpenPanel}
        >
          <span
            className={
              'pointer-events-none absolute left-0 top-1/2 h-14 w-px -translate-y-1/2 bg-gradient-to-b from-transparent to-transparent transition-opacity duration-[850ms] ease-out ' +
              (quietCollapsed ? 'opacity-0' : 'opacity-80') +
              ' ' +
              (nightRail
                ? 'via-[rgba(139,213,255,0.4)] group-hover:via-[rgba(139,213,255,0.6)]'
                : 'via-solar-gold/35 group-hover:via-solar-gold/55')
            }
            aria-hidden
          />
          <IconChevronLeft
            className={
              'relative h-4 w-4 shrink-0 transition-[color,transform,filter] duration-[850ms] ease-out group-hover:-translate-x-px ' +
              (quietCollapsed
                ? nightRail
                  ? 'text-[rgba(139,213,255,0.88)] drop-shadow-[0_1px_10px_rgba(0,0,0,0.65)] group-hover:text-[#ead7a4]'
                  : 'text-solar-gold/85 drop-shadow-[0_1px_10px_rgba(0,0,0,0.65)] group-hover:text-solar-gold'
                : 'drop-shadow-[0_1px_8px_rgba(0,0,0,0.95)] ' +
                  (nightRail
                    ? 'text-[rgba(139,213,255,0.72)] group-hover:text-[#ead7a4]'
                    : 'text-solar-gold/70 group-hover:text-solar-gold'))
            }
            strokeWidth={1.35}
            aria-hidden
          />
          <span
            className={
              'select-none text-[7px] font-semibold uppercase tracking-[0.38em] [writing-mode:vertical-rl] rotate-180 transition-[color,text-shadow] duration-[850ms] ease-out ' +
              (quietCollapsed
                ? nightRail
                  ? 'text-[rgba(234,215,164,0.88)] [text-shadow:0_0_14px_rgba(0,0,0,0.55),0_2px_12px_rgba(0,0,0,0.45)]'
                  : 'text-solar-gold/82 [text-shadow:0_0_14px_rgba(0,0,0,0.55),0_2px_12px_rgba(0,0,0,0.45)]'
                : '[text-shadow:0_0_18px_rgba(0,0,0,0.95),0_2px_8px_rgba(0,0,0,0.88)] ' +
                  (nightRail ? 'text-[rgba(234,215,164,0.58)]' : 'text-solar-gold/60'))
            }
          >
            {copy.orientationParcours}
          </span>
        </button>
      ) : (
        /* ── Panneau ouvert (fade out à la fermeture) ── */
        <div
          className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden px-5 pb-8 pt-7"
          style={{
            opacity: expanded ? 1 : 0,
            transition: 'opacity 0.28s ease',
            pointerEvents: expanded ? undefined : 'none',
          }}
        >

          {/* En-tête : titre + zone de fermeture discrète sur toute la largeur */}
          <button
            type="button"
            onClick={() => onExpandedChange(false)}
            className={
              'group -mx-1 mb-5 flex shrink-0 items-center gap-3 px-1 pb-4 border-b focus-visible:outline-none focus-visible:ring-1 ' +
              (nightRail
                ? 'border-[rgba(139,213,255,0.14)] focus-visible:ring-[rgba(139,213,255,0.3)]'
                : 'border-solar-gold/[0.12] focus-visible:ring-solar-gold/30')
            }
            aria-label={copy.orientationCollapsePanel}
          >
            {/* Trait décoratif gauche */}
            <span
              className={
                'h-3.5 w-px shrink-0 ' + (nightRail ? 'bg-[rgba(139,213,255,0.4)]' : 'bg-solar-gold/35')
              }
              aria-hidden
            />
            <span
              className={
                'flex-1 text-left text-[9px] font-semibold uppercase tracking-[0.42em] transition-colors duration-200 [text-shadow:0_1px_10px_rgba(0,0,0,0.8)] ' +
                (nightRail
                  ? 'text-[rgba(234,215,164,0.52)] group-hover:text-[rgba(234,215,164,0.78)]'
                  : 'text-solar-gold/55 group-hover:text-solar-gold/80')
              }
            >
              {copy.orientationParcours}
            </span>
            {/* Indicateur de fermeture : fine flèche vers la droite */}
            <span
              className={
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-[border-color,color] duration-200 ' +
                (nightRail
                  ? 'border-[rgba(139,213,255,0.22)] text-[rgba(139,213,255,0.4)] group-hover:border-[rgba(139,213,255,0.45)] group-hover:text-[rgba(234,215,164,0.65)]'
                  : 'border-solar-gold/20 text-solar-gold/35 group-hover:border-solar-gold/45 group-hover:text-solar-gold/65')
              }
              aria-hidden
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4h5M4.5 1.5L7 4l-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>

          <ParcoursPanelInnerContent
            phase={phase}
            revelationCount={revelationCount}
            parcoursRailMidnight={parcoursRailMidnight}
            act2VoyageCreditsOpen={act2VoyageCreditsOpen}
            journeyReplayUnlocked={journeyReplayUnlocked}
            onNavigatePhase={onNavigatePhase}
          />
        </div>
      )}
    </div>
  );
}
