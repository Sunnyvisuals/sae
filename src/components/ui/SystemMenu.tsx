import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useCursorStore } from '../../hooks/useCursorContext';
import SplashCursor from '../SplashCursor';

type Props = {
  onClose: () => void;
  /** Ouvre uniquement la vidéo en surcouche - ne recharge pas la page ni l’acte */
  onReplayIntroVideo: () => void;
  onRestartExperience: () => void;
};

const easeMajestic = [0.22, 1, 0.36, 1] as const;

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
}: {
  children: ReactNode;
  variant?: 'gold' | 'mist' | 'ember';
  /** Acte II - bleu constellation au lieu du doré désert */
  midnight: boolean;
  onClick: () => void;
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
      className={`group relative w-full overflow-hidden rounded-[2px] border bg-black/30 px-5 py-4 text-center text-[10px] uppercase leading-snug tracking-[0.26em] backdrop-blur-[2px] transition-colors duration-500 sm:px-7 sm:py-[1.15rem] sm:text-[11px] sm:tracking-[0.34em] md:py-6 md:text-[12px] md:tracking-[0.38em] ${styles}`}
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

/**
 * Menu pause - plein viewport, scroll si besoin, safe areas. Pas d’anneau animé (meilleure lisibilité mobile).
 */
export default function SystemMenu({ onClose, onReplayIntroVideo, onRestartExperience }: Props) {
  const midnight = useCursorStore((s) => s.ambient === 'midnight');

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
          ? 'fixed inset-0 z-[560] flex min-h-dvh w-full cursor-none flex-col bg-[#030810] [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)]'
          : 'fixed inset-0 z-[560] flex min-h-dvh w-full cursor-none flex-col bg-[#020100] [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)]'
      }
    >
      {/* Fluide intégré à la modale : au-dessus du fond, sous le contenu/menu. */}
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
        <SplashCursor
          key={midnight ? 'menu-splash-midnight' : 'menu-splash-solar'}
          syncPaletteFromAmbient
          DYE_RESOLUTION={640}
          SIM_RESOLUTION={128}
          DENSITY_DISSIPATION={10}
          VELOCITY_DISSIPATION={5}
          PRESSURE={0.1}
          CURL={10}
          SPLAT_RADIUS={0.05}
          SPLAT_FORCE={10000}
          COLOR_UPDATE_SPEED={10}
          zIndex={1}
        />
      </div>

      {/* Fond - halos solaire vs nuit saharienne */}
      <div className="pointer-events-none absolute inset-0 z-[2]" aria-hidden>
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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
          </>
        )}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")`,
            backgroundRepeat: 'repeat',
          }}
        />
      </div>

      <motion.button
        type="button"
        onClick={onClose}
        aria-label="Fermer le menu (Échap)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className={
          midnight
            ? 'pointer-events-auto fixed z-[570] flex h-10 w-10 items-center justify-center rounded-[2px] border border-[rgba(139,213,255,0.32)] bg-[rgba(2,8,24,0.52)] text-[rgba(207,238,255,0.9)] shadow-[inset_0_1px_0_rgba(180,228,255,0.06),0_8px_28px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-[color,border-color,background-color,box-shadow] duration-300 hover:border-[rgba(148,218,255,0.52)] hover:bg-[rgba(4,14,38,0.62)] hover:text-sky-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(90,168,255,0.42)] sm:h-11 sm:w-11 top-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] right-[max(1rem,calc(env(safe-area-inset-right)+0.5rem))] md:top-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))] md:right-[max(1.25rem,calc(env(safe-area-inset-right)+0.75rem))]'
            : 'pointer-events-auto fixed z-[570] flex h-10 w-10 items-center justify-center rounded-[2px] border border-solar-gold/35 bg-black/55 text-solar-gold/85 shadow-[inset_0_1px_0_rgba(253,248,238,0.05),0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-[color,border-color,background-color,box-shadow] duration-300 hover:border-solar-gold/55 hover:bg-black/70 hover:text-solar-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-solar-gold/40 sm:h-11 sm:w-11 top-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] right-[max(1rem,calc(env(safe-area-inset-right)+0.5rem))] md:top-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))] md:right-[max(1.25rem,calc(env(safe-area-inset-right)+0.75rem))]'
        }
      >
        <X className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={1.35} aria-hidden />
      </motion.button>

      {/* Plein viewport + centrage réel (flex) ; zone scroll limitée si trop haut */}
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-6 sm:px-8 sm:py-10">
        <div className="flex max-h-[min(92dvh,960px)] w-full max-w-2xl flex-col items-center justify-center overflow-x-hidden overflow-y-auto overscroll-contain px-0 pt-1 pb-2 sm:max-w-[42rem]">
        <motion.div
          className="flex w-full min-w-0 flex-col items-center"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Bloc encadré */}
          <div
            className={
              midnight
                ? 'relative w-full max-w-[min(100%,40rem)] border border-[rgba(90,168,255,0.26)] bg-[#040a14]/85 p-7 text-center shadow-[0_0_0_1px_rgba(90,168,255,0.1),inset_0_0_60px_rgba(45,110,190,0.05)] backdrop-blur-md sm:p-11 md:p-14'
                : 'relative w-full max-w-[min(100%,40rem)] border border-solar-gold/25 bg-[#050302]/85 p-7 text-center shadow-[0_0_0_1px_rgba(197,160,89,0.08),inset_0_0_60px_rgba(197,160,89,0.03)] backdrop-blur-md sm:p-11 md:p-14'
            }
          >
            <div
              className={
                midnight
                  ? 'pointer-events-none absolute left-3 top-3 h-9 w-9 border-l border-t border-[rgba(139,213,255,0.38)] sm:left-5 sm:top-5 sm:h-10 sm:w-10'
                  : 'pointer-events-none absolute left-3 top-3 h-9 w-9 border-l border-t border-solar-gold/30 sm:left-5 sm:top-5 sm:h-10 sm:w-10'
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

            <motion.div variants={item} className="overflow-visible px-1 text-center">
              <p
                id="system-menu-title"
                className={
                  midnight
                    ? 'text-[8px] uppercase tracking-[0.72em] text-sky-300/62 sm:text-[9px] sm:tracking-[0.8em] md:text-[10px]'
                    : 'text-[8px] uppercase tracking-[0.72em] text-solar-gold/55 sm:text-[9px] sm:tracking-[0.8em] md:text-[10px]'
                }
              >
                Pause
              </p>
              <h2
                className="font-bahlull mx-auto mt-5 mb-5 box-border flex w-full max-w-[min(100%,28ch)] flex-col items-center justify-center overflow-visible px-0.5 pb-1.5 pt-0.5 text-[clamp(2.35rem,8vw,4rem)] italic leading-[1.18] text-transparent sm:mt-5 sm:mb-5"
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
                Al-Rihla
              </h2>
            </motion.div>

            <motion.div
              variants={item}
              className="relative mx-auto mt-7 flex w-full max-w-sm items-center justify-center gap-2.5 sm:mt-9 sm:max-w-md sm:gap-3"
            >
              <div
                className={
                  midnight
                    ? 'h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(139,213,255,0.45)] to-[rgba(90,168,255,0.15)]'
                    : 'h-px flex-1 bg-gradient-to-r from-transparent via-solar-gold/45 to-solar-gold/20'
                }
              />
              <div
                className={
                  midnight
                    ? 'h-3 w-3 shrink-0 rotate-45 border border-[rgba(139,213,255,0.45)] bg-[rgba(90,168,255,0.08)] shadow-[0_0_16px_rgba(90,168,255,0.22)] sm:h-3.5 sm:w-3.5'
                    : 'h-3 w-3 shrink-0 rotate-45 border border-solar-gold/50 bg-solar-gold/[0.12] shadow-[0_0_16px_rgba(197,160,89,0.15)] sm:h-3.5 sm:w-3.5'
                }
                aria-hidden
              />
              <div
                className={
                  midnight
                    ? 'h-px flex-1 bg-gradient-to-l from-transparent via-[rgba(139,213,255,0.45)] to-[rgba(90,168,255,0.15)]'
                    : 'h-px flex-1 bg-gradient-to-l from-transparent via-solar-gold/45 to-solar-gold/20'
                }
              />
            </motion.div>

            <motion.p
              variants={item}
              className={
                midnight
                  ? 'font-serif mx-auto mt-6 max-w-[30ch] text-center text-[13px] italic leading-relaxed text-sky-200/52 sm:mt-7 sm:max-w-lg sm:text-[15px] md:text-[16px]'
                  : 'font-serif mx-auto mt-6 max-w-[30ch] text-center text-[13px] italic leading-relaxed text-solar-gold/50 sm:mt-7 sm:max-w-lg sm:text-[15px] md:text-[16px]'
              }
            >
              <span className={midnight ? 'text-sky-300/42' : 'text-solar-gold/35'}>«</span>
              &nbsp;Reprenez le voyage, ou ouvrez un autre passage.&nbsp;
              <span className={midnight ? 'text-sky-300/42' : 'text-solar-gold/35'}>»</span>
            </motion.p>

            <motion.nav
              variants={item}
              className="mt-9 flex w-full flex-col gap-3.5 sm:mt-11 sm:gap-[1.15rem]"
              aria-label="Actions du menu pause"
            >
              <MajesticButton variant="gold" midnight={midnight} onClick={onClose}>
                Continuer
              </MajesticButton>

              <div className="flex flex-col gap-1.5">
                <MajesticButton
                  variant="mist"
                  midnight={midnight}
                  onClick={() => {
                    onReplayIntroVideo();
                  }}
                >
                  Revoir la vidéo d’introduction
                </MajesticButton>
                <p
                  className={
                    midnight ? 'text-center text-[10px] leading-relaxed text-sky-300/42 sm:text-[11px]' : 'text-center text-[10px] leading-relaxed text-solar-gold/36 sm:text-[11px]'
                  }
                >
                  Lecture par-dessus l’expérience, pas de rechargement, votre progression est conservée.
                </p>
              </div>

              <MajesticButton
                variant="ember"
                midnight={midnight}
                onClick={() => {
                  onClose();
                  onRestartExperience();
                }}
              >
                Recommencer l’expérience
              </MajesticButton>
            </motion.nav>
          </div>
        </motion.div>
        </div>
      </div>

      {/* Crédit - hors du cadre, bas d’écran, typo alignée sur « Pause » */}
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
          Une création de{' '}
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
      </div>
    </motion.div>
  );
}
