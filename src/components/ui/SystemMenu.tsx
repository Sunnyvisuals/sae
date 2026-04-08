import type { ReactNode } from 'react';
import { motion } from 'motion/react';

type Props = {
  onClose: () => void;
  /** Ouvre uniquement la vidéo en surcouche — ne recharge pas la page ni l’acte */
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
  onClick,
}: {
  children: ReactNode;
  variant?: 'gold' | 'mist' | 'ember';
  onClick: () => void;
}) {
  const styles = {
    gold: 'border-solar-gold/45 text-solar-gold/95 shadow-[inset_0_1px_0_rgba(253,248,238,0.06)] hover:border-solar-gold/70 hover:shadow-[0_0_40px_rgba(197,160,89,0.12),inset_0_0_30px_rgba(197,160,89,0.06)]',
    mist: 'border-white/18 text-white/[0.92] hover:border-solar-gold/45 hover:text-white hover:shadow-[inset_0_0_24px_rgba(197,160,89,0.05)]',
    ember:
      'border-red-900/50 text-red-100/85 hover:border-red-800/65 hover:bg-red-950/30 hover:shadow-[0_0_32px_rgba(127,29,29,0.15)]',
  }[variant];

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.008 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-[2px] border bg-black/30 px-4 py-3.5 text-center text-[8px] uppercase leading-snug tracking-[0.28em] backdrop-blur-[2px] transition-colors duration-500 sm:px-6 sm:py-4 sm:text-[9px] sm:tracking-[0.38em] md:py-5 md:tracking-[0.42em] ${styles}`}
    >
      <span
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-solar-gold/0 via-solar-gold/35 to-solar-gold/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-y-0 right-0 w-[3px] bg-gradient-to-b from-solar-gold/0 via-solar-gold/35 to-solar-gold/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
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
 * Menu pause — plein viewport, scroll si besoin, safe areas. Pas d’anneau animé (meilleure lisibilité mobile).
 */
export default function SystemMenu({ onClose, onReplayIntroVideo, onRestartExperience }: Props) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="system-menu-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[560] flex min-h-dvh w-full cursor-none flex-col bg-[#020100] [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)]"
    >
      {/* Fond — halos uniquement (pas de cercle / « 3D ») */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_65%_at_50%_12%,rgba(197,160,89,0.12),transparent_52%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(60,35,20,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")`,
            backgroundRepeat: 'repeat',
          }}
        />
      </div>

      {/* Plein viewport + centrage réel (flex) ; zone scroll limitée si trop haut */}
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-6 sm:px-8 sm:py-10">
        <div className="flex max-h-[min(92dvh,920px)] w-full max-w-xl flex-col items-center justify-center overflow-x-hidden overflow-y-auto overscroll-contain sm:max-w-2xl">
        <motion.div
          className="flex w-full min-w-0 flex-col items-center"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Bloc encadré */}
          <div className="relative w-full max-w-[min(100%,36rem)] border border-solar-gold/25 bg-[#050302]/85 p-6 text-center shadow-[0_0_0_1px_rgba(197,160,89,0.08),inset_0_0_60px_rgba(197,160,89,0.03)] backdrop-blur-md sm:p-10 md:p-12">
            <div
              className="pointer-events-none absolute left-3 top-3 h-8 w-8 border-l border-t border-solar-gold/30 sm:left-4 sm:top-4"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-3 right-3 h-8 w-8 border-b border-r border-solar-gold/30 sm:bottom-4 sm:right-4"
              aria-hidden
            />

            <motion.div variants={item} className="text-center">
              <p
                id="system-menu-title"
                className="text-[7px] uppercase tracking-[0.75em] text-solar-gold/55 sm:text-[8px] sm:tracking-[0.85em] md:text-[9px]"
              >
                Pause
              </p>
              <h2
                className="font-bahlull mt-4 text-[clamp(2rem,7.5vw,3.5rem)] italic leading-none text-transparent sm:mt-5"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #fdfaf6 0%, #e8d4a8 35%, #c5a059 55%, #fdfaf6 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 36px rgba(197,160,89,0.22))',
                }}
              >
                Al-Rihla
              </h2>
            </motion.div>

            <motion.div
              variants={item}
              className="relative mx-auto mt-6 flex w-full max-w-xs items-center justify-center gap-2 sm:mt-8 sm:max-w-sm sm:gap-3"
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-solar-gold/45 to-solar-gold/20" />
              <div
                className="h-2.5 w-2.5 shrink-0 rotate-45 border border-solar-gold/50 bg-solar-gold/[0.12] shadow-[0_0_16px_rgba(197,160,89,0.15)] sm:h-3 sm:w-3"
                aria-hidden
              />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-solar-gold/45 to-solar-gold/20" />
            </motion.div>

            <motion.p
              variants={item}
              className="font-serif mx-auto mt-5 max-w-[28ch] text-center text-[12px] italic leading-relaxed text-solar-gold/50 sm:mt-6 sm:max-w-md sm:text-[14px] md:text-[15px]"
            >
              <span className="text-solar-gold/35">«</span>
              &nbsp;Reprenez le voyage, ou ouvrez un autre passage.&nbsp;
              <span className="text-solar-gold/35">»</span>
            </motion.p>

            <motion.nav
              variants={item}
              className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:gap-4"
              aria-label="Actions du menu pause"
            >
              <MajesticButton variant="gold" onClick={onClose}>
                Continuer
              </MajesticButton>

              <div className="flex flex-col gap-1.5">
                <MajesticButton
                  variant="mist"
                  onClick={() => {
                    onReplayIntroVideo();
                  }}
                >
                  Revoir la vidéo d’introduction
                </MajesticButton>
                <p className="text-center text-[9px] leading-relaxed text-solar-gold/32 sm:text-[10px]">
                  Lecture par-dessus l’expérience — pas de rechargement, votre progression est conservée.
                </p>
              </div>

              <MajesticButton
                variant="ember"
                onClick={() => {
                  onClose();
                  onRestartExperience();
                }}
              >
                Recommencer l’expérience
              </MajesticButton>
            </motion.nav>
          </div>

          <motion.div variants={item} className="mt-8 flex w-full flex-col items-center gap-2 sm:mt-10">
            <div className="h-px w-12 bg-gradient-to-r from-transparent via-solar-gold/25 to-transparent sm:w-16" />
            <p className="text-center text-[7px] uppercase tracking-[0.45em] text-solar-gold/28 sm:text-[8px] sm:tracking-[0.55em] md:text-[9px]">
              Échap · fermer
            </p>
          </motion.div>
        </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
