import { useId, useState, type ChangeEvent, type ReactNode, type SVGProps } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useCursorStore } from '../../hooks/useCursorContext';
import { useCursorPrefsStore, type CursorExperienceMode } from '../../stores/cursorPrefsStore';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useLanguageStore } from '../../stores/languageStore';
import { useAppCopy } from '../../hooks/useAppCopy';
import { useMasterVolumeStore } from '../../stores/masterVolumeStore';
import { IconVolume2, IconVolumeX, IconX } from './icons';
import {
  exitDocumentFullscreen,
  isFullscreenApiSupported,
  requestDocumentFullscreen,
  useDocumentFullscreenActive,
} from '../../lib/fullscreenDocument';

const DEFAULT_MASTER_VOLUME = 0.2;
type Props = {
  onClose: () => void;
  /** Ouvre uniquement la vidéo en surcouche - ne recharge pas la page ni l’acte */
  onReplayIntroVideo: () => void;
  onRestartExperience: () => void;
  /** Petit écran (< md) : bloc Parcours dans le menu pause */
  embeddedParcours?: ReactNode;
};

const easeMajestic = [0.22, 1, 0.36, 1] as const;

/** Largeur commune : panneaux réglages + boutons d’action (Continuer, etc.). */
const PAUSE_MENU_STACK_CLASS = 'mx-auto w-full max-w-[min(100%,526px)] shrink-0';

const PAUSE_MENU_PANEL_SHELL_CLASS =
  'w-full rounded-[2px] px-3 py-1.5 sm:px-4 sm:py-2';

function IconChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeMajestic },
  },
};

function MajesticButton({
  children,
  variant = 'gold',
  midnight,
  onClick,
  'aria-pressed': ariaPressed,
  'aria-keyshortcuts': ariaKeyshortcuts,
}: {
  children: ReactNode;
  variant?: 'gold' | 'mist' | 'ember';
  /** Acte II - bleu constellation au lieu du doré désert */
  midnight: boolean;
  onClick: () => void;
  'aria-pressed'?: boolean | 'true' | 'false' | 'mixed';
  'aria-keyshortcuts'?: string;
}) {
  const palette = midnight
    ? ({
        gold: 'border-[rgba(139,213,255,0.42)] text-sky-100/95 shadow-[inset_0_1px_0_rgba(180,228,255,0.08)] hover:border-[rgba(148,218,255,0.72)] hover:shadow-[0_0_40px_rgba(90,168,255,0.14),inset_0_0_30px_rgba(90,168,255,0.06)]',
        mist:
          'border-white/16 text-white/[0.9] hover:border-[rgba(139,213,255,0.52)] hover:text-white hover:shadow-[inset_0_0_24px_rgba(90,168,255,0.08)]',
        ember:
          'border-red-900/50 text-red-100/85 hover:border-red-800/65 hover:bg-red-950/30 hover:shadow-[0_0_32px_rgba(127,29,29,0.15)]',
      } as const)
    : ({
        gold: 'border-solar-gold/45 text-solar-gold/95 shadow-[inset_0_1px_0_rgba(253,248,238,0.06)] hover:border-solar-gold/70 hover:shadow-[0_0_40px_rgba(197,160,89,0.12),inset_0_0_30px_rgba(197,160,89,0.06)]',
        mist: 'border-white/18 text-white/[0.92] hover:border-solar-gold/45 hover:text-white hover:shadow-[inset_0_0_24px_rgba(197,160,89,0.05)]',
        ember:
          'border-red-900/50 text-red-100/85 hover:border-red-800/65 hover:bg-red-950/30 hover:shadow-[0_0_32px_rgba(127,29,29,0.15)]',
      } as const);
  const styles = palette[variant];

  const stripeGrad = midnight
    ? 'bg-gradient-to-b from-transparent via-[rgba(139,213,255,0.45)] to-transparent'
    : 'bg-gradient-to-b from-solar-gold/0 via-solar-gold/35 to-solar-gold/0';

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.008 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      aria-pressed={ariaPressed}
      aria-keyshortcuts={ariaKeyshortcuts}
      className={`group relative w-full overflow-hidden rounded-[2px] border bg-black/30 px-4 py-3 text-center text-[11px] uppercase leading-snug tracking-[0.26em] backdrop-blur-[2px] transition-colors duration-500 sm:px-6 sm:py-[0.95rem] sm:text-[12px] sm:tracking-[0.32em] md:flex md:h-[57px] md:items-center md:justify-center md:py-[18px] md:text-[13px] md:tracking-[0.36em] ${styles}`}
    >
      <span
        className={`pointer-events-none absolute inset-y-0 left-0 w-[3px] ${stripeGrad} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
        aria-hidden
      />
      <span
        className={`pointer-events-none absolute inset-y-0 right-0 w-[3px] ${stripeGrad} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
        aria-hidden
      />
      <span className="relative z-10 block hyphens-none break-words">{children}</span>
      <span
        className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
        aria-hidden
      />
    </motion.button>
  );
}

/** Curseur — souris fine uniquement ; placé avant le son dans le menu pause. */
function PauseCursorPicker({ midnight }: { midnight: boolean }) {
  const copy = useAppCopy();
  const panelId = useId();
  const finePointer = useMediaQuery('(any-pointer: fine)');
  const [cursorOpen, setCursorOpen] = useState(true);
  const language = useLanguageStore((s) => s.language);
  const isArabic = language === 'ar-dz';

  const experience = useCursorPrefsStore((s) => s.experience);
  const setExperience = useCursorPrefsStore((s) => s.setExperience);
  const setMode = useCursorStore((s) => s.setMode);

  if (!finePointer) return null;

  const togglePanel = () => setCursorOpen((o) => !o);

  const currentLabel = experience === 'fluid' ? copy.cursorOptionFluid : copy.cursorOptionBasic;

  const applyExperience = (mode: CursorExperienceMode) => {
    setExperience(mode);
    if (mode === 'fluid') setMode('default');
    else setMode('stylus');
  };

  const notchBtn =
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] transition-[color,transform] duration-300 sm:h-8 sm:w-8 ' +
    (midnight ? 'text-sky-300/70 hover:text-sky-100' : 'text-solar-gold/68 hover:text-solar-gold');

  const optBase =
    'rounded-[2px] border px-3 py-2.5 text-start text-[10px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:py-3 ';

  const optIdle = midnight
    ? 'border-sky-400/25 text-sky-300/75 hover:border-sky-300/45 focus-visible:ring-[rgba(90,168,255,0.38)]'
    : 'border-solar-gold/30 text-solar-gold/75 hover:border-solar-gold/55 focus-visible:ring-solar-gold/40';

  const optActive = (active: boolean) =>
    active
      ? midnight
        ? 'border-sky-300/60 bg-sky-500/10 text-sky-100 focus-visible:ring-[rgba(90,168,255,0.38)]'
        : 'border-solar-gold/70 bg-solar-gold/10 text-solar-gold focus-visible:ring-solar-gold/40'
      : optIdle;

  return (
    <motion.div variants={item} className="mt-0 w-full px-0 sm:mt-0">
      <div
        className={
          PAUSE_MENU_PANEL_SHELL_CLASS + ' ' +
          (midnight ? 'bg-[rgba(4,10,22,0.22)]' : 'bg-black/12')
        }
      >
        <button
          type="button"
          id={panelId}
          aria-expanded={cursorOpen}
          aria-controls={`${panelId}-cursor`}
          onClick={togglePanel}
          aria-labelledby={`${panelId}-label`}
          className={
            'group flex w-full min-w-0 items-center justify-between gap-3 py-0 text-start outline-none transition-[opacity,color] duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ' +
            (midnight
              ? 'focus-visible:ring-[rgba(90,168,255,0.38)]'
              : 'focus-visible:ring-solar-gold/40')
          }
        >
          <span className={notchBtn} aria-hidden>
            <IconChevronDown
              strokeWidth={1.35}
              className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-out sm:h-4 sm:w-4 ${cursorOpen ? 'rotate-0' : '-rotate-90'}`}
            />
          </span>
          <p
            id={`${panelId}-label`}
            className={
              'flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[9px] uppercase tracking-[0.24em] sm:text-[10px] sm:tracking-[0.3em] ' +
              (midnight ? 'text-sky-400/62' : 'text-solar-gold/55')
            }
          >
            <span className={`min-w-0 ${isArabic ? 'text-right tracking-[0.08em] sm:tracking-[0.12em]' : 'shrink-0'}`}>
              {copy.cursorSectionHeading}
            </span>
            <span
              className={
                'min-w-0 max-w-full text-end text-[9px] font-light tracking-[0.12em] sm:max-w-[min(100%,18ch)] sm:truncate sm:text-[10px] sm:tracking-[0.18em] ' +
                (midnight ? 'text-sky-200/70' : 'text-[rgba(253,248,238,0.65)]')
              }
              title={currentLabel}
            >
              {currentLabel}
            </span>
          </p>
        </button>
        <div
          id={`${panelId}-cursor`}
          role="region"
          aria-labelledby={panelId}
          aria-hidden={!cursorOpen}
          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out ${cursorOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        >
          <div className={`min-h-0 overflow-hidden ${!cursorOpen ? 'pointer-events-none' : ''}`}>
            <div className="pt-2">
              <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
                <button
                  type="button"
                  onClick={() => applyExperience('fluid')}
                  tabIndex={cursorOpen ? 0 : -1}
                  aria-label={`${copy.cursorOptionFluid} — ${copy.cursorOptionFluidHint}`}
                  className={
                    optBase +
                    (!cursorOpen ? 'pointer-events-none opacity-40 ' : 'pointer-events-auto ') +
                    optActive(experience === 'fluid')
                  }
                >
                  <span className="block text-[9px] font-medium uppercase tracking-[0.22em]">
                    {copy.cursorOptionFluid}
                    <span
                      className={
                        "font-light normal-case tracking-[0.14em] " +
                        (midnight ? "text-sky-300/48" : "text-solar-gold/55")
                      }
                    >
                      {" "}
                      · {copy.cursorOptionDefaultBadge}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => applyExperience('basic')}
                  tabIndex={cursorOpen ? 0 : -1}
                  aria-label={`${copy.cursorOptionBasic} — ${copy.cursorOptionBasicHint}`}
                  className={
                    optBase +
                    (!cursorOpen ? 'pointer-events-none opacity-40 ' : 'pointer-events-auto ') +
                    optActive(experience === 'basic')
                  }
                >
                  <span className="block text-[9px] font-medium uppercase tracking-[0.22em]">
                    {copy.cursorOptionBasic}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Barre de volume - filet léger + remplissage (comme l’ornement au-dessus), icône fantôme sans cadre. */
function PauseVolumeSlider({ midnight }: { midnight: boolean }) {
  const copy = useAppCopy();
  const panelId = useId();
  const [soundOpen, setSoundOpen] = useState(false);
  const volume = useMasterVolumeStore((s) => s.volume);
  const setVolume = useMasterVolumeStore((s) => s.setVolume);
  const language = useLanguageStore((s) => s.language);
  const isArabic = language === 'ar-dz';

  const onRange = (e: ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const toggleSilent = () => {
    setVolume(volume > 0 ? 0 : DEFAULT_MASTER_VOLUME);
  };

  const toggleSoundPanel = () => setSoundOpen((o) => !o);

  /** Piste invisible : seule la pastille diamant contraste ; décor dessous montre le niveau. */
  const rangeTrackInvisible =
    '[&::-webkit-slider-runnable-track]:h-[5px] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent ' +
    '[&::-moz-range-track]:h-[5px] [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent';

  /** Même inset que le padding de l’input range pour aligner piste, remplissage et curseur. */
  const trackInsetClass = 'left-0 right-0 mx-[max(10px,0.55rem)]';

  const thumbStyle =
    '[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:-mt-[4px] [&::-webkit-slider-thumb]:rotate-45 [&::-webkit-slider-thumb]:rounded-[1px] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:-mt-0 ' +
    (midnight
      ? '[&::-webkit-slider-thumb]:border-[rgba(186,226,255,0.75)] [&::-webkit-slider-thumb]:bg-[rgba(6,14,28,0.96)] [&::-webkit-slider-thumb]:shadow-[0_0_22px_rgba(90,168,255,0.42),inset_0_0_0_1px_rgba(255,255,255,0.04)] [&::-moz-range-thumb]:rotate-45 [&::-moz-range-thumb]:rounded-[1px] [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-[rgba(186,226,255,0.75)] [&::-moz-range-thumb]:bg-[rgba(6,14,28,0.96)] [&::-moz-range-thumb]:shadow-[0_0_22px_rgba(90,168,255,0.42)]'
      : '[&::-webkit-slider-thumb]:border-[rgba(232,212,164,0.85)] [&::-webkit-slider-thumb]:bg-[#060504]/96 [&::-webkit-slider-thumb]:shadow-[0_0_22px_rgba(197,160,89,0.35),inset_0_0_0_1px_rgba(255,248,238,0.05)] [&::-moz-range-thumb]:rotate-45 [&::-moz-range-thumb]:rounded-[1px] [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-[rgba(232,212,164,0.65)] [&::-moz-range-thumb]:bg-[#060504]/96 [&::-moz-range-thumb]:shadow-[0_0_22px_rgba(197,160,89,0.32)]');

  const haloLine = midnight
    ? 'from-[rgba(90,168,255,0.06)] via-[rgba(139,213,255,0.52)] to-[rgba(139,213,255,0.06)]'
    : 'from-solar-gold/[0.04] via-solar-gold/45 to-solar-gold/[0.04]';

  const fillGlow = midnight
    ? 'bg-[linear-gradient(90deg,rgba(90,168,255,0.72),rgba(174,218,255,0.32),transparent)] opacity-[0.9]'
    : 'bg-[linear-gradient(90deg,rgba(197,160,89,0.65),rgba(232,212,164,0.28),transparent)] opacity-[0.92]';

  const trackGroove = midnight
    ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-1px_8px_rgba(0,0,0,0.55)]'
    : 'shadow-[inset_0_1px_0_rgba(253,248,238,0.05),inset_0_-1px_8px_rgba(0,0,0,0.55)]';

  const pct = Math.round(volume * 100);

  const notchBtn =
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] transition-[color,transform] duration-300 sm:h-8 sm:w-8 ' +
    (midnight ? 'text-sky-300/70 hover:text-sky-100' : 'text-solar-gold/68 hover:text-solar-gold');

  return (
    <motion.div variants={item} className="mt-3 w-full px-0 sm:mt-4">
      <div
        className={
          PAUSE_MENU_PANEL_SHELL_CLASS + ' ' +
          (midnight
            ? 'bg-[rgba(4,10,22,0.22)]'
            : 'bg-black/12')
        }
      >
        <button
          type="button"
          id={panelId}
          aria-expanded={soundOpen}
          aria-controls={`${panelId}-soundscape`}
          onClick={toggleSoundPanel}
          aria-labelledby={`${panelId}-label`}
          className={
            'group flex w-full min-w-0 items-center justify-between gap-3 py-0 text-start outline-none transition-[opacity,color] duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ' +
            (midnight
              ? 'focus-visible:ring-[rgba(90,168,255,0.38)]'
              : 'focus-visible:ring-solar-gold/40')
          }
        >
          <span className={notchBtn} aria-hidden>
            <IconChevronDown
              strokeWidth={1.35}
              className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-out sm:h-4 sm:w-4 ${soundOpen ? 'rotate-0' : '-rotate-90'}`}
            />
          </span>
          <p
            id={`${panelId}-label`}
            className={
              'flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[9px] uppercase tracking-[0.24em] sm:text-[10px] sm:tracking-[0.3em] ' +
              (midnight ? 'text-sky-400/62' : 'text-solar-gold/55')
            }
          >
            <span className={`min-w-0 ${isArabic ? 'text-right tracking-[0.08em] sm:tracking-[0.12em]' : 'shrink-0'}`}>
              {copy.menuSound}
            </span>
            <span
              className={
                'shrink-0 tabular-nums text-[11px] font-light tracking-[0.14em] sm:text-[12px] sm:tracking-[0.18em] ' +
                (midnight ? 'text-sky-200/72' : 'text-[rgba(253,248,238,0.68)]')
              }
            >
              {String(pct).padStart(2, '\u2007')}
              <span className="text-[8px] font-normal tracking-[0.1em] opacity-50 ml-[2px]">%</span>
            </span>
          </p>
        </button>
        <div
        id={`${panelId}-soundscape`}
        role="region"
        aria-labelledby={panelId}
        aria-hidden={!soundOpen}
          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out ${soundOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        >
          <div className={`min-h-0 overflow-hidden ${!soundOpen ? 'pointer-events-none' : ''}`}>
            <div className="pt-2">
              <div className="flex items-center gap-2.5 sm:gap-3.5">
              <button
                type="button"
                onClick={toggleSilent}
                tabIndex={soundOpen ? 0 : -1}
                aria-label={volume === 0 ? copy.menuAmbientMuteOn : copy.menuAmbientMuteOff}
                className={
                  (soundOpen ? 'pointer-events-auto ' : 'pointer-events-none ') +
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] border transition-[color,border-color,background-color,opacity,transform] duration-300 ease-out outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.96] sm:h-10 sm:w-10 ' +
                  (midnight
                    ? 'border-[rgba(90,168,255,0.26)] text-sky-400/72 hover:border-[rgba(139,213,255,0.48)] hover:bg-[rgba(90,168,255,0.08)] hover:text-sky-100 focus-visible:ring-[rgba(90,168,255,0.38)]'
                    : 'border-solar-gold/26 text-solar-gold/58 hover:border-solar-gold/48 hover:bg-[rgba(197,160,89,0.07)] hover:text-solar-gold focus-visible:ring-solar-gold/40')
                }
              >
                {volume === 0 ? (
                  <IconVolumeX className="h-[17px] w-[17px] sm:h-[18px] sm:w-[18px]" aria-hidden />
                ) : (
                  <IconVolume2 className="h-[17px] w-[17px] sm:h-[18px] sm:w-[18px]" aria-hidden />
                )}
              </button>

                <div className="relative flex min-h-[40px] min-w-0 flex-1 items-center py-0.5">
                <div
                  className={
                    'pointer-events-none absolute top-1/2 h-[7px] -translate-y-1/2 rounded-full border backdrop-blur-[1px] ' +
                    trackInsetClass +
                    ' ' +
                    trackGroove +
                    (midnight
                      ? ' border-[rgba(90,168,255,0.28)] bg-[rgba(3,10,28,0.35)]'
                      : ' border-solar-gold/[0.26] bg-[rgba(6,5,4,0.42)]')
                  }
                  aria-hidden
                />

                <div
                  className="pointer-events-none absolute top-1/2 h-[5px] -translate-y-1/2 overflow-hidden rounded-full"
                  style={{ left: 'max(10px, 0.55rem)', right: 'max(10px, 0.55rem)' }}
                  aria-hidden
                >
                  <span
                    className={
                      'pointer-events-none block h-full origin-left rounded-full transition-[width] duration-200 ease-out ' +
                      fillGlow
                    }
                    style={{ width: `${volume * 100}%` }}
                  />
                </div>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={volume}
                  onChange={onRange}
                  aria-label={copy.menuAmbientVolume}
                  disabled={!soundOpen}
                  className={
                      'pointer-events-auto relative z-[2] h-10 w-full min-h-[40px] cursor-pointer appearance-none rounded-full bg-transparent box-border px-[max(10px,0.55rem)] focus:outline-none focus-visible:ring-1 ' +
                    (midnight
                      ? 'focus-visible:ring-[rgba(90,168,255,0.38)] focus-visible:ring-offset-0 focus-visible:ring-offset-transparent'
                      : 'focus-visible:ring-solar-gold/38 focus-visible:ring-offset-0 focus-visible:ring-offset-transparent') +
                    ' ' +
                    rangeTrackInvisible +
                    ' ' +
                    thumbStyle +
                    (!soundOpen ? ' pointer-events-none opacity-40' : '')
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </motion.div>
  );
}

/** Langue - même schéma que la section son (ligne cliquable + panneau repliable). */
function PauseLanguagePicker({ midnight }: { midnight: boolean }) {
  const copy = useAppCopy();
  const panelId = useId();
  const [languageOpen, setLanguageOpen] = useState(false);
  const language = useLanguageStore((s) => s.language);
  const setLanguageWithTransition = useLanguageStore((s) => s.setLanguageWithTransition);
  const isArabic = language === 'ar-dz';

  const toggleLanguagePanel = () => setLanguageOpen((o) => !o);

  const currentLabel = language === 'ar-dz' ? copy.languageArabicBtn : copy.languageFrenchBtn;

  const notchBtn =
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] transition-[color,transform] duration-300 sm:h-8 sm:w-8 ' +
    (midnight ? 'text-sky-300/70 hover:text-sky-100' : 'text-solar-gold/68 hover:text-solar-gold');

  const haloLine = midnight
    ? 'from-[rgba(90,168,255,0.06)] via-[rgba(139,213,255,0.52)] to-[rgba(139,213,255,0.06)]'
    : 'from-solar-gold/[0.04] via-solar-gold/45 to-solar-gold/[0.04]';

  return (
    <motion.div variants={item} className="mt-2 w-full px-0 sm:mt-2.5">
      <div
        className={
          PAUSE_MENU_PANEL_SHELL_CLASS + ' ' +
          (midnight
            ? 'bg-[rgba(4,10,22,0.22)]'
            : 'bg-black/12')
        }
      >
        <button
          type="button"
          id={panelId}
          aria-expanded={languageOpen}
          aria-controls={`${panelId}-language`}
          onClick={toggleLanguagePanel}
          aria-labelledby={`${panelId}-label`}
          className={
            'group flex w-full min-w-0 items-center justify-between gap-3 py-0 text-start outline-none transition-[opacity,color] duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ' +
            (midnight
              ? 'focus-visible:ring-[rgba(90,168,255,0.38)]'
              : 'focus-visible:ring-solar-gold/40')
          }
        >
          <span className={notchBtn} aria-hidden>
            <IconChevronDown
              strokeWidth={1.35}
              className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-out sm:h-4 sm:w-4 ${languageOpen ? 'rotate-0' : '-rotate-90'}`}
            />
          </span>
          <p
            id={`${panelId}-label`}
            className={
              'flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[9px] uppercase tracking-[0.24em] sm:text-[10px] sm:tracking-[0.3em] ' +
              (midnight ? 'text-sky-400/62' : 'text-solar-gold/55')
            }
          >
            <span className={`min-w-0 ${isArabic ? 'text-right tracking-[0.08em] sm:tracking-[0.12em]' : 'shrink-0'}`}>
              {copy.languageSectionHeading}
            </span>
            <span
              className={
                'min-w-0 max-w-full text-end text-[9px] font-light tracking-[0.12em] sm:max-w-[min(100%,18ch)] sm:truncate sm:text-[10px] sm:tracking-[0.18em] ' +
                (midnight ? 'text-sky-200/70' : 'text-[rgba(253,248,238,0.65)]')
              }
              title={currentLabel}
            >
              {currentLabel}
            </span>
          </p>
        </button>
        <div
          id={`${panelId}-language`}
          role="region"
          aria-labelledby={panelId}
          aria-hidden={!languageOpen}
          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out ${languageOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        >
          <div className={`min-h-0 overflow-hidden ${!languageOpen ? 'pointer-events-none' : ''}`}>
            <div className="pt-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setLanguageWithTransition('fr')}
                  tabIndex={languageOpen ? 0 : -1}
                  className={
                    'rounded-[2px] border px-3 py-2 text-[10px] uppercase tracking-[0.14em] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ' +
                    (!languageOpen ? 'pointer-events-none opacity-40 ' : 'pointer-events-auto ') +
                    (language === 'fr'
                      ? midnight
                        ? 'border-sky-300/60 bg-sky-500/10 text-sky-100 focus-visible:ring-[rgba(90,168,255,0.38)]'
                        : 'border-solar-gold/70 bg-solar-gold/10 text-solar-gold focus-visible:ring-solar-gold/40'
                      : midnight
                        ? 'border-sky-400/25 text-sky-300/75 hover:border-sky-300/45 focus-visible:ring-[rgba(90,168,255,0.38)]'
                        : 'border-solar-gold/30 text-solar-gold/75 hover:border-solar-gold/55 focus-visible:ring-solar-gold/40')
                  }
                >
                  {copy.languageFrenchBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setLanguageWithTransition('ar-dz')}
                  tabIndex={languageOpen ? 0 : -1}
                  className={
                    'rounded-[2px] border px-3 py-2 text-[10px] tracking-[0.08em] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ' +
                    (!languageOpen ? 'pointer-events-none opacity-40 ' : 'pointer-events-auto ') +
                    (language === 'ar-dz'
                      ? midnight
                        ? 'border-sky-300/60 bg-sky-500/10 text-sky-100 focus-visible:ring-[rgba(90,168,255,0.38)]'
                        : 'border-solar-gold/70 bg-solar-gold/10 text-solar-gold focus-visible:ring-solar-gold/40'
                      : midnight
                        ? 'border-sky-400/25 text-sky-300/75 hover:border-sky-300/45 focus-visible:ring-[rgba(90,168,255,0.38)]'
                        : 'border-solar-gold/30 text-solar-gold/75 hover:border-solar-gold/55 focus-visible:ring-solar-gold/40')
                  }
                >
                  {copy.languageArabicBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PauseFullscreenPanel({ midnight }: { midnight: boolean }) {
  const copy = useAppCopy();
  const panelId = useId();
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const fsActive = useDocumentFullscreenActive();
  const supported = typeof window !== 'undefined' && isFullscreenApiSupported();

  const togglePanel = () => setFullscreenOpen((o) => !o);

  const notchBtn =
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] transition-[color,transform] duration-300 sm:h-8 sm:w-8 ' +
    (midnight ? 'text-sky-300/70 hover:text-sky-100' : 'text-solar-gold/68 hover:text-solar-gold');

  const onToggleFs = () => {
    void (fsActive ? exitDocumentFullscreen() : requestDocumentFullscreen());
  };

  const statusHint = fsActive
    ? `${copy.menuFullscreenStateOn} · ${copy.menuFullscreenShortcutExit}`
    : `${copy.menuFullscreenStateOff} · ${copy.menuFullscreenShortcutEnter}`;

  return (
    <motion.div variants={item} className="mt-2 w-full px-0 sm:mt-2.5">
      <div
        className={
          PAUSE_MENU_PANEL_SHELL_CLASS + ' ' +
          (midnight ? 'bg-[rgba(4,10,22,0.22)]' : 'bg-black/12')
        }
      >
        <button
          type="button"
          id={panelId}
          aria-expanded={fullscreenOpen}
          aria-controls={`${panelId}-fullscreen`}
          onClick={togglePanel}
          aria-labelledby={`${panelId}-label`}
          className={
            'group flex w-full min-w-0 items-center justify-between gap-3 py-0 text-start outline-none transition-[opacity,color] duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ' +
            (midnight
              ? 'focus-visible:ring-[rgba(90,168,255,0.38)]'
              : 'focus-visible:ring-solar-gold/40')
          }
        >
          <span className={notchBtn} aria-hidden>
            <IconChevronDown
              strokeWidth={1.35}
              className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-out sm:h-4 sm:w-4 ${fullscreenOpen ? 'rotate-0' : '-rotate-90'}`}
            />
          </span>
          <p
            id={`${panelId}-label`}
            className={
              'flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[9px] uppercase tracking-[0.24em] sm:text-[10px] sm:tracking-[0.3em] ' +
              (midnight ? 'text-sky-400/62' : 'text-solar-gold/55')
            }
          >
            <span className="shrink-0">{copy.menuFullscreenSection}</span>
            {supported ? (
              <span
                className={
                  'max-w-[min(100%,20ch)] text-end text-[9px] font-light normal-case tracking-[0.08em] sm:max-w-[min(100%,24ch)] sm:text-[10px] sm:tracking-[0.1em] ' +
                  (midnight ? 'text-sky-200/58' : 'text-[rgba(253,248,238,0.55)]')
                }
              >
                {statusHint}
              </span>
            ) : (
              <span
                className={
                  'text-end text-[9px] font-light normal-case tracking-normal sm:text-[10px] ' +
                  (midnight ? 'text-sky-300/45' : 'text-solar-gold/40')
                }
              >
                -
              </span>
            )}
          </p>
        </button>

        <div
          id={`${panelId}-fullscreen`}
          role="region"
          aria-labelledby={panelId}
          aria-hidden={!fullscreenOpen}
          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out ${fullscreenOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        >
          <div className={`min-h-0 overflow-hidden ${!fullscreenOpen ? 'pointer-events-none' : ''}`}>
            <div className="pt-2">
              {supported ? (
                <>
                  <MajesticButton
                    variant="gold"
                    midnight={midnight}
                    onClick={onToggleFs}
                    aria-pressed={fsActive}
                    aria-keyshortcuts={fsActive ? 'Escape F11' : 'F11'}
                  >
                    {fsActive ? copy.menuFullscreenExit : copy.menuFullscreenEnter}
                  </MajesticButton>
                </>
              ) : (
                <p
                  className={
                    'px-0.5 text-center text-[10px] leading-relaxed ' +
                    (midnight ? 'text-sky-300/45' : 'text-solar-gold/40')
                  }
                >
                  {copy.menuFullscreenUnsupported}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Confirmation rouge avant reset complet de l’expérience. */
function PauseRestartConfirm({
  open,
  isArabic,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  isArabic: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const copy = useAppCopy();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="pause-restart-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="pause-restart-confirm-title"
          aria-describedby="pause-restart-confirm-desc"
          dir={isArabic ? 'rtl' : 'ltr'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32 }}
          className="pointer-events-auto fixed inset-0 z-[580] flex items-center justify-center px-4 py-6 sm:px-6"
          onClick={onCancel}
        >
          <motion.div
            className="absolute inset-0 bg-[#020000]/78 backdrop-blur-[3px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_42%,rgba(127,29,29,0.22),transparent_62%)]"
            aria-hidden
          />

          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.42, ease: easeMajestic }}
            className="relative z-10 mx-auto w-full max-w-[min(100%,26rem)] border border-red-900/55 bg-[#0a0303]/92 px-5 py-6 text-center shadow-[0_0_0_1px_rgba(220,38,38,0.12),inset_0_0_48px_rgba(127,29,29,0.14),0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-md sm:max-w-md sm:px-7 sm:py-8"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="pointer-events-none absolute left-3 top-3 h-8 w-8 border-l border-t border-red-700/45 sm:left-4 sm:top-4 sm:h-9 sm:w-9"
              aria-hidden
            />
            <motion.div
              className="pointer-events-none absolute bottom-3 right-3 h-8 w-8 border-b border-r border-red-700/45 sm:bottom-4 sm:right-4 sm:h-9 sm:w-9"
              aria-hidden
            />

            <p
              className="text-[8px] font-medium uppercase tracking-[0.58em] text-red-400/58 sm:text-[9px] sm:tracking-[0.64em]"
            >
              {copy.menuRestart}
            </p>

            <p
              id="pause-restart-confirm-title"
              className="font-serif mt-4 text-[15px] italic leading-relaxed text-red-50/92 sm:mt-5 sm:text-[17px] sm:leading-relaxed"
            >
              {copy.menuRestartConfirmMessage}
            </p>
            <p id="pause-restart-confirm-desc" className="sr-only">
              {copy.menuRestartConfirmAria}
            </p>

            <motion.nav
              className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:gap-3.5"
              aria-label={copy.menuRestartConfirmAria}
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.008 }}
                whileTap={{ scale: 0.995 }}
                onClick={onConfirm}
                className="w-full rounded-[2px] border border-red-800/70 bg-red-950/35 px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-red-50/95 shadow-[inset_0_1px_0_rgba(254,226,226,0.06),0_0_28px_rgba(127,29,29,0.18)] transition-colors duration-500 hover:border-red-700/85 hover:bg-red-950/50 sm:flex-1 sm:py-[0.95rem] sm:text-[12px]"
              >
                {copy.menuRestartConfirmYes}
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.008 }}
                whileTap={{ scale: 0.995 }}
                onClick={onCancel}
                className="w-full rounded-[2px] border border-red-950/55 bg-black/25 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-red-200/62 transition-colors duration-500 hover:border-red-900/65 hover:bg-red-950/20 hover:text-red-100/78 sm:flex-1 sm:py-[0.95rem] sm:text-[12px]"
              >
                {copy.menuRestartConfirmNo}
              </motion.button>
            </motion.nav>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Menu pause - plein viewport, scroll si besoin, safe areas. Pas d’anneau animé (meilleure lisibilité mobile).
 */
export default function SystemMenu({
  onClose,
  onReplayIntroVideo,
  onRestartExperience,
  embeddedParcours,
}: Props) {
  const midnight = useCursorStore((s) => s.ambient === 'midnight');
  const finePointer = useMediaQuery('(any-pointer: fine)');
  const copy = useAppCopy();
  const language = useLanguageStore((s) => s.language);
  const isArabic = language === 'ar-dz';
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);

  /** Curseur personnalisé (fluide ou « basique ») : masque le pointeur OS dans le menu. */
  const shellCursor = finePointer ? 'cursor-none' : 'cursor-auto';

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="system-menu-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className={
        midnight
          ? `fixed inset-0 z-[560] flex min-h-dvh w-full ${shellCursor} flex-col bg-[#030810]/88 backdrop-blur-md supports-[backdrop-filter]:bg-[#030810]/76 [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)]`
          : `fixed inset-0 z-[560] flex min-h-dvh w-full ${shellCursor} flex-col bg-[#020100]/88 backdrop-blur-md supports-[backdrop-filter]:bg-[#020100]/76 [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)]`
      }
    >
      {/* Fond ? halos discrets (pas de grain SVG ni fluide WebGL : lisibilité pause). */}
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
        {midnight ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_65%_at_50%_12%,rgba(90,168,255,0.14),transparent_52%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(20,40,80,0.28),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_0%,rgba(0,0,0,0.55)_100%)]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_65%_at_50%_12%,rgba(197,160,89,0.12),transparent_52%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(60,35,20,0.22),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_0%,rgba(0,0,0,0.42)_100%)]" />
          </>
        )}
      </div>

      <motion.button
        type="button"
        onClick={onClose}
        aria-label={copy.menuClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className={
          midnight
            ? 'pointer-events-auto fixed z-[570] flex h-10 w-10 items-center justify-center rounded-[2px] border border-[rgba(139,213,255,0.32)] bg-[rgba(2,8,24,0.52)] text-[rgba(207,238,255,0.9)] shadow-[inset_0_1px_0_rgba(180,228,255,0.06),0_8px_28px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-[color,border-color,background-color,box-shadow] duration-300 hover:border-[rgba(148,218,255,0.52)] hover:bg-[rgba(4,14,38,0.62)] hover:text-sky-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(90,168,255,0.42)] sm:h-11 sm:w-11 top-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] right-[max(1rem,calc(env(safe-area-inset-right)+0.5rem))] md:top-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))] md:right-[max(1.25rem,calc(env(safe-area-inset-right)+0.75rem))]'
            : 'pointer-events-auto fixed z-[570] flex h-10 w-10 items-center justify-center rounded-[2px] border border-solar-gold/35 bg-black/55 text-solar-gold/85 shadow-[inset_0_1px_0_rgba(253,248,238,0.05),0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-[color,border-color,background-color,box-shadow] duration-300 hover:border-solar-gold/55 hover:bg-black/70 hover:text-solar-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-solar-gold/40 sm:h-11 sm:w-11 top-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] right-[max(1rem,calc(env(safe-area-inset-right)+0.5rem))] md:top-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))] md:right-[max(1.25rem,calc(env(safe-area-inset-right)+0.75rem))]'
        }
      >
        <IconX className="h-5 w-5 sm:h-[22px] sm:w-[22px]" aria-hidden />
      </motion.button>

      {/* Zone centrale : carte centrée ; scroll si le contenu dépasse. */}
      <motion.div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden px-3 py-3 sm:px-5 sm:py-4">
        <motion.div className="mx-auto flex w-full max-w-[min(100%,42rem)] min-h-0 max-h-full flex-1 flex-col items-center justify-center overflow-y-auto overflow-x-hidden overscroll-y-contain px-1 py-3 sm:px-2 sm:py-4">
        <motion.div
          className="flex w-full min-h-0 min-w-0 shrink-0 flex-col items-center justify-center"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Bloc encadré — centré viewport ; scroll sur le parent si contenu haut. */}
          <div
            dir={isArabic ? 'rtl' : 'ltr'}
            className={
              midnight
                ? 'relative mx-auto my-auto flex w-full max-w-[min(100%,40rem)] shrink-0 flex-col overflow-x-hidden border border-[rgba(90,168,255,0.26)] bg-[#040a14]/85 px-4 pb-12 pt-9 text-center shadow-[0_0_0_1px_rgba(90,168,255,0.1),inset_0_0_60px_rgba(45,110,190,0.05)] backdrop-blur-md sm:px-7 sm:pb-14 sm:pt-12 md:px-9 md:pb-16 md:pt-14'
                : 'relative mx-auto my-auto flex w-full max-w-[min(100%,40rem)] shrink-0 flex-col overflow-x-hidden border border-solar-gold/25 bg-[#050302]/85 px-4 pb-12 pt-9 text-center shadow-[0_0_0_1px_rgba(197,160,89,0.08),inset_0_0_60px_rgba(197,160,89,0.03)] backdrop-blur-md sm:px-7 sm:pb-14 sm:pt-12 md:px-9 md:pb-16 md:pt-14'
            }
          >
            <div
              className={
                midnight
                  ? 'pointer-events-none absolute left-3 top-5 h-9 w-9 border-l border-t border-[rgba(139,213,255,0.38)] sm:left-5 sm:top-6 sm:h-10 sm:w-10 md:top-7'
                  : 'pointer-events-none absolute left-3 top-5 h-9 w-9 border-l border-t border-solar-gold/30 sm:left-5 sm:top-6 sm:h-10 sm:w-10 md:top-7'
              }
              aria-hidden
            />
            <div
              className={
                midnight
                  ? 'pointer-events-none absolute bottom-3 right-3 h-9 w-9 border-b border-r border-[rgba(139,213,255,0.38)] sm:bottom-5 sm:right-5 sm:h-10 sm:w-10'
                  : 'pointer-events-none absolute bottom-3 right-3 h-9 w-9 border-b border-r border-solar-gold/30 sm:bottom-5 sm:right-5 sm:h-10 sm:w-10'
              }
              aria-hidden
            />

            <motion.div
              variants={item}
              className="overflow-visible px-1 pt-1 text-center sm:pt-2"
            >
              <p
                id="system-menu-title"
                className={
                  midnight
                    ? 'text-[8px] uppercase tracking-[0.72em] text-sky-300/62 sm:text-[9px] sm:tracking-[0.8em] md:text-[10px]'
                    : 'text-[8px] uppercase tracking-[0.72em] text-solar-gold/55 sm:text-[9px] sm:tracking-[0.8em] md:text-[10px]'
                }
              >
                {copy.menuPause}
              </p>
              <h2
                className="font-bahlull mx-auto mt-3 mb-3 box-border flex w-full max-w-[min(100%,28ch)] flex-col items-center justify-center overflow-visible px-0.5 pb-1 pt-0.5 text-[clamp(2.35rem,8vw,4rem)] italic leading-[1.18] text-transparent sm:mt-3.5 sm:mb-3.5"
                style={
                  midnight
                    ? {
                        backgroundImage:
                          'linear-gradient(135deg, #e8f6ff 0%, #94c8ff 35%, #5aa8ff 52%, #e0f4ff 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 28px rgba(90,168,255,0.22))',
                      }
                    : {
                        backgroundImage:
                          'linear-gradient(135deg, #fdfaf6 0%, #e8d4a8 35%, #c5a059 55%, #fdfaf6 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 28px rgba(197,160,89,0.18))',
                      }
                }
              >
                Al Rihla
              </h2>
            </motion.div>

            <motion.p
              variants={item}
              className={
                midnight
                  ? 'font-serif mx-auto mt-3.5 max-w-[30ch] text-center text-[13px] italic leading-relaxed text-sky-200/52 sm:mt-4 sm:max-w-lg sm:text-[15px] md:text-[16px]'
                  : 'font-serif mx-auto mt-3.5 max-w-[30ch] text-center text-[13px] italic leading-relaxed text-solar-gold/50 sm:mt-4 sm:max-w-lg sm:text-[15px] md:text-[16px]'
              }
            >
              <span className={midnight ? 'text-sky-300/42' : 'text-solar-gold/35'}>«</span>
              &nbsp;{copy.menuQuote}&nbsp;
              <span className={midnight ? 'text-sky-300/42' : 'text-solar-gold/35'}>»</span>
            </motion.p>

            <motion.div variants={item} className={`${PAUSE_MENU_STACK_CLASS} flex flex-col items-stretch`}>
            <PauseCursorPicker midnight={midnight} />

            <PauseVolumeSlider midnight={midnight} />

            <PauseLanguagePicker midnight={midnight} />

            <PauseFullscreenPanel midnight={midnight} />

            {embeddedParcours && (
              <motion.div variants={item} className="mt-2 w-full sm:mt-2.5">
                <details
                  className={
                    'group w-full ' +
                    PAUSE_MENU_PANEL_SHELL_CLASS +
                    ' ' +
                    (midnight ? 'bg-[rgba(4,10,22,0.22)]' : 'bg-black/12')
                  }
                >
                  <summary
                    className={
                      'flex cursor-pointer list-none items-center justify-between gap-3 py-0 outline-none transition-[color,opacity] duration-300 marker:content-none [&::-webkit-details-marker]:hidden ' +
                      (midnight
                        ? 'text-sky-400/72 focus-visible:ring-2 focus-visible:ring-[rgba(90,168,255,0.38)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'
                        : 'text-solar-gold/65 focus-visible:ring-2 focus-visible:ring-solar-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent')
                    }
                  >
                    <span className="text-[9px] font-semibold uppercase tracking-[0.38em] sm:text-[10px] sm:tracking-[0.42em]">
                      {copy.menuEmbeddedParcours}
                    </span>
                    <IconChevronDown
                      strokeWidth={1.35}
                      className="h-3.5 w-3.5 shrink-0 opacity-85 transition-transform duration-300 ease-out group-open:-rotate-180 sm:h-4 sm:w-4"
                      aria-hidden
                    />
                  </summary>
                  <div className="mt-3 max-h-[min(52vh,420px)] overflow-y-auto overflow-x-hidden pb-2 pr-0.5 [-webkit-overflow-scrolling:touch]">
                    {embeddedParcours}
                  </div>
                </details>
              </motion.div>
            )}

            <motion.nav
              variants={item}
              className="mt-5 flex w-full flex-col gap-5 sm:mt-6"
              aria-label={copy.menuNavAria}
            >
              <MajesticButton variant="gold" midnight={midnight} onClick={onClose}>
                {copy.menuContinue}
              </MajesticButton>

              <div className="flex flex-col gap-1.5">
                <MajesticButton
                  variant="mist"
                  midnight={midnight}
                  onClick={() => {
                    onReplayIntroVideo();
                  }}
                >
                  {copy.menuReplayVideo}
                </MajesticButton>
                <p
                  className={
                    midnight ? 'text-center text-[10px] leading-relaxed text-sky-300/42 sm:text-[11px]' : 'text-center text-[10px] leading-relaxed text-solar-gold/36 sm:text-[11px]'
                  }
                >
                  {copy.menuReplayHint}
                </p>
              </div>

              <MajesticButton
                variant="ember"
                midnight={midnight}
                onClick={() => setRestartConfirmOpen(true)}
              >
                {copy.menuRestart}
              </MajesticButton>
            </motion.nav>
            </motion.div>
          </div>
        </motion.div>
        </motion.div>
      </motion.div>

      <PauseRestartConfirm
        open={restartConfirmOpen}
        isArabic={isArabic}
        onCancel={() => setRestartConfirmOpen(false)}
        onConfirm={() => {
          setRestartConfirmOpen(false);
          onClose();
          onRestartExperience();
        }}
      />

      {/* Crédits - hors du cadre, bas d’écran */}
      <div className="pointer-events-none relative z-10 flex w-full shrink-0 flex-col items-center gap-1.5 px-4 pb-[max(1.35rem,env(safe-area-inset-bottom))] pt-4 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.42, ease: easeMajestic }}
          className={
            midnight
              ? 'text-[7px] font-medium uppercase leading-relaxed tracking-[0.34em] text-sky-400/52 sm:text-[8px] sm:tracking-[0.38em] md:text-[9px] md:tracking-[0.42em]'
              : 'text-[7px] font-medium uppercase leading-relaxed tracking-[0.34em] text-solar-gold/48 sm:text-[8px] sm:tracking-[0.38em] md:text-[9px] md:tracking-[0.42em]'
          }
        >
          BUT MMI
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5, ease: easeMajestic }}
          className={
            midnight
              ? 'text-[7px] font-medium uppercase leading-relaxed tracking-[0.3em] text-sky-300/55 sm:text-[8px] sm:tracking-[0.36em] md:text-[9px] md:tracking-[0.4em]'
              : 'text-[7px] font-medium uppercase leading-relaxed tracking-[0.3em] text-solar-gold/52 sm:text-[8px] sm:tracking-[0.36em] md:text-[9px] md:tracking-[0.4em]'
          }
        >
          {copy.menuCreditsBy}{' '}
          <span
            className={
              midnight ? 'font-bold text-sky-200/72' : 'font-bold text-solar-gold/62'
            }
          >
            Yacine Bouabdallah
          </span>
          <span className={midnight ? 'text-sky-400/45' : 'text-solar-gold/38'}> · </span>
          <span className="tabular-nums">2026</span>
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.58, ease: easeMajestic }}
          className={
            midnight
              ? 'text-[7px] font-medium uppercase leading-relaxed tracking-[0.28em] text-sky-300/45 sm:text-[8px] sm:tracking-[0.32em] md:text-[9px] md:tracking-[0.36em]'
              : 'text-[7px] font-medium uppercase leading-relaxed tracking-[0.28em] text-solar-gold/45 sm:text-[8px] sm:tracking-[0.32em] md:text-[9px] md:tracking-[0.36em]'
          }
        >
          {copy.menuMusicLine}
        </motion.p>
      </div>
    </motion.div>
  );
}
