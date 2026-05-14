'use client';

import { useEffect, useLayoutEffect, useRef, useCallback, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import gsap from 'gsap';
import { useAppCopy } from '../../hooks/useAppCopy';
import { useLanguageStore } from '../../stores/languageStore';
import ShootingStars from '../ShootingStars';
import {
  ACT3_FIXED_STARFIELD_BG,
  ACT3_SKY_RADIAL_CSS,
  ACT3_SKY_CONIC_CSS,
  ACT3_DUST_GRAIN_CSS,
  ACT3_DUST_GRAIN_SIZE,
} from '../../lib/act3NightSky';

/** Durée totale du défilement (secondes). Augmenter si contenu plus long / typo plus grande. */
const SCROLL_DURATION_S = 52;

/** Logo institutionnel - PNG « blanc sur noir » sans alpha : rendu via masque luminance + dégradé (fond noir ignoré). */
const MMI_LOGO_SRC = `${import.meta.env.BASE_URL}images/logo-mmi.png`;

type Props = {
  open: boolean;
  onClose: () => void;
  midnight: boolean;
  /** Raccourci optionnel : sauter le défilement (ex. lien de test / message parent). */
  skipScrollAnimation?: boolean;
  /** Ouverture depuis le mot-clé final acte III : prolonge le ciel / nuit du gate, sans fondu noir. */
  fromAct3Finale?: boolean;
};

export default function VoyageCreditsOverlay({
  open,
  onClose,
  midnight,
  skipScrollAnimation = false,
  fromAct3Finale = false,
}: Props) {
  const copy = useAppCopy();
  const lang = useLanguageStore((s) => s.language);
  const prefersReducedMotion = useReducedMotion();
  /** Seulement si le hook est explicitement vrai - évite de bloquer le défilement quand la valeur est encore `null`. */
  const reduceMotion = prefersReducedMotion === true;
  const prefersReducedMotionRef = useRef(false);
  prefersReducedMotionRef.current = reduceMotion;
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const [done, setDone] = useState(false);
  const muted = 'text-solar-gold/52';
  const body = 'text-da-parchment-bright/88';
  const sectionHead = 'text-solar-gold/78';

  /* ── Défilement GSAP (réf PRM stable : évite de relancer l’effet si le hook change) ── */
  const startScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) {
      setDone(true);
      return;
    }
    if (prefersReducedMotionRef.current) {
      tweenRef.current?.kill();
      tweenRef.current = null;
      gsap.set(el, { y: 0 });
      setDone(true);
      return;
    }
    tweenRef.current?.kill();
    const dist = Math.max(0, el.scrollHeight - window.innerHeight * 0.15);
    gsap.set(el, { y: '100vh' });
    tweenRef.current = gsap.to(el, {
      y: -dist,
      duration: SCROLL_DURATION_S,
      ease: 'none',
      onComplete: () => {
        setDone(true);
      },
    });
  }, []);

  /* Position initiale hors écran : GSAP seul pilote `transform` (évite le conflit Tailwind translate + GSAP). */
  useLayoutEffect(() => {
    if (!open) return;
    const el = trackRef.current;
    if (!el || reduceMotion) return;
    gsap.set(el, { y: '100vh' });
  }, [open, reduceMotion]);

  /* Lance l'animation à l'ouverture - dépend uniquement de `open` pour ne pas reprogrammer au moindre re-render */
  useEffect(() => {
    if (!open) {
      tweenRef.current?.kill();
      tweenRef.current = null;
      setDone(false);
      return;
    }
    if (skipScrollAnimation) {
      tweenRef.current?.kill();
      tweenRef.current = null;
      const t = window.setTimeout(() => {
        const el = trackRef.current;
        if (!el) {
          setDone(true);
          return;
        }
        const vh = window.innerHeight;
        /* Aligner le bas du générique avec le bas du viewport (pas scrollHeight − 0.15vh),
         * sinon la « fenêtre » tombe dans le grand padding vide sous le logo. */
        const dist = Math.max(0, el.scrollHeight - vh);
        gsap.set(el, { y: -dist });
        setDone(true);
      }, 200);
      return () => window.clearTimeout(t);
    }
    const delay = fromAct3Finale ? 220 : 800;
    const id = window.setTimeout(() => {
      /* Double rAF : scrollHeight / polices stabilisés avant la mesure GSAP. */
      requestAnimationFrame(() => {
        requestAnimationFrame(startScroll);
      });
    }, delay);
    return () => {
      window.clearTimeout(id);
    };
  }, [open, startScroll, skipScrollAnimation, fromAct3Finale]);

  /* Échap = fermer (seulement quand les crédits sont finis) */
  useEffect(() => {
    if (!open || !done) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, done, onClose]);

  if (!open) return null;

  const skipBtn =
    'pointer-events-auto cursor-pointer fixed left-1/2 top-[50%] z-[70] max-w-[min(calc(100vw-2rem),28rem)] min-h-[48px] -translate-x-1/2 -translate-y-1/2 ' +
    'border border-solar-gold/35 bg-da-depth-night/85 px-8 py-3.5 font-sans text-[11px] font-medium uppercase sm:px-10 sm:py-4 sm:text-xs ' +
    'tracking-[0.28em] text-solar-gold/72 backdrop-blur-sm transition-colors hover:border-solar-gold/65 hover:text-solar-gold ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-gold/30';

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-label={copy.orientationCreditsLabel}
      className={`fixed inset-0 z-[525] bg-da-depth-night ${reduceMotion ? 'overflow-y-auto' : 'overflow-hidden'}`}
      initial={fromAct3Finale ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: fromAct3Finale ? 0 : 0.65,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {fromAct3Finale ? (
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <div
            className="absolute inset-0 opacity-[0.36]"
            style={{ backgroundImage: ACT3_FIXED_STARFIELD_BG }}
          />
          <div className="absolute inset-0" style={{ background: ACT3_SKY_RADIAL_CSS }} />
          <div
            className="absolute inset-0 opacity-[0.12] mix-blend-soft-light"
            style={{ background: ACT3_SKY_CONIC_CSS }}
          />
          <div className="absolute inset-0 z-[1] overflow-hidden opacity-[0.88]" aria-hidden>
            <ShootingStars />
          </div>
          <div
            className="absolute inset-0 z-[2] opacity-[0.2] mix-blend-soft-light"
            style={{
              backgroundImage: ACT3_DUST_GRAIN_CSS,
              backgroundSize: ACT3_DUST_GRAIN_SIZE,
            }}
          />
        </div>
      ) : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(6,14,38,0.9), transparent 68%), ' +
              'radial-gradient(ellipse 55% 40% at 80% 75%, rgba(139,213,255,0.03), transparent 60%)',
          }}
        />
      )}

      {/* Masques haut / bas - dégradé doux pour ne pas rogner les capitales du titre */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-28 sm:h-32"
        style={{
          background:
            'linear-gradient(to bottom, rgba(5,8,15,0.78) 0%, rgba(5,8,15,0.2) 55%, transparent 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-28 sm:h-32"
        style={{
          background:
            'linear-gradient(to top, rgba(5,8,15,0.78) 0%, rgba(5,8,15,0.2) 55%, transparent 100%)',
        }}
      />

      {/* Piste de défilement */}
      <div
        ref={trackRef}
        dir={lang === 'ar-dz' ? 'rtl' : 'ltr'}
        className={
          'absolute inset-x-0 top-0 z-[2] mx-auto w-full max-w-xl px-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] text-center sm:max-w-2xl ' +
          (!reduceMotion ? 'will-change-transform' : '')
        }
      >
        {/* Titre - line-height + padding pour ascendantes (Bahlull + bg-clip-text) */}
        <h1 className="font-bahlull text-[clamp(3.25rem,8.5vw,5.5rem)] italic leading-[1.14] tracking-tight text-transparent bg-gradient-to-br from-da-parchment-bright/90 via-solar-gold/80 to-da-oxide/70 bg-clip-text [padding-block:0.15em_0.2em] [box-decoration-break:clone]">
          {copy.voyageCreditsTitle}
        </h1>
        <p className={`mt-5 font-sans text-xs uppercase tracking-[0.34em] sm:text-[13px] sm:tracking-[0.36em] ${muted}`}>
          {copy.voyageCreditsSubtitle}
        </p>

        {/* Séparateur */}
        <div className="mx-auto my-16 h-px w-20 bg-solar-gold/22" aria-hidden />

        {/* Blocs */}
        <div className="space-y-16">
          {copy.voyageCreditsBlocks.map((block) => (
            <section key={block.heading}>
              <h2 className={`font-sans text-[10px] font-semibold uppercase tracking-[0.42em] sm:text-[11px] sm:tracking-[0.46em] ${sectionHead}`}>
                {block.heading}
              </h2>
              <ul className={`mt-5 space-y-3 font-sans text-[15px] leading-[1.8] sm:text-base sm:leading-[1.82] ${body}`}>
                {block.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Fin */}
        <div className="mx-auto my-16 h-px w-20 bg-solar-gold/22" aria-hidden />
        <p className={`font-serif text-[clamp(1.08rem,2.8vw,1.3rem)] italic leading-[1.65] ${muted}`}>
          {copy.voyageCreditsFin}
        </p>

        <div className="mx-auto mt-14 h-px w-24 bg-solar-gold/20" aria-hidden />

        {/* Logo institutionnel : masque luminance → le noir du PNG devient transparent */}
        <div className="pointer-events-none mt-12 flex flex-col items-center pb-8 md:mt-14 md:pb-10">
          <div
            role="img"
            aria-label="MMI - IUT de Toulon"
            className="mx-auto block aspect-[203/88] h-[clamp(52px,10vw,80px)] w-auto max-w-[min(92vw,22rem)] opacity-95 md:h-[clamp(60px,8vw,88px)]"
            style={{
              background:
                "linear-gradient(165deg, #fdf8ee 0%, #e8d4a4 42%, #c5a059 92%)",
              WebkitMaskImage: `url(${MMI_LOGO_SRC})`,
              maskImage: `url(${MMI_LOGO_SRC})`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              maskMode: "luminance",
              WebkitMaskSourceType: "luminance",
            }}
          />
        </div>

        {/* Espace bas pour que le logo et la dernière ligne montent bien hors écran */}
        <div className="h-[55vh]" aria-hidden />
      </div>

      {/* Bouton Fermer - visible uniquement quand les crédits sont terminés */}
      {done && (
        <motion.button
          type="button"
          onClick={onClose}
          className={skipBtn}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {copy.voyageCreditsClose}
        </motion.button>
      )}
    </motion.div>
  );
}
