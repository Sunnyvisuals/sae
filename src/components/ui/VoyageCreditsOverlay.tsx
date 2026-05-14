'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import gsap from 'gsap';
import { useAppCopy } from '../../hooks/useAppCopy';
import { useLanguageStore } from '../../stores/languageStore';

/** Durée totale du défilement (secondes). Augmenter si contenu plus long. */
const SCROLL_DURATION_S = 46;

/** Logo institutionnel fourni — blanc sur fond sombre (`public/images/logo-mmi.png`). */
const MMI_LOGO_SRC = `${import.meta.env.BASE_URL}images/logo-mmi.png`;

type Props = {
  open: boolean;
  onClose: () => void;
  midnight: boolean;
};

export default function VoyageCreditsOverlay({ open, onClose, midnight }: Props) {
  const copy = useAppCopy();
  const lang = useLanguageStore((s) => s.language);
  const prefersReducedMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const [done, setDone] = useState(false);
  const muted = 'text-solar-gold/45';
  const body = 'text-da-parchment-bright/82';
  const sectionHead = 'text-solar-gold/72';

  /* ── Défilement GSAP ── */
  const startScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || prefersReducedMotion) {
      setDone(true);
      return;
    }
    const dist = el.scrollHeight - window.innerHeight * 0.15;
    tweenRef.current = gsap.fromTo(
      el,
      { y: '100vh' },
      {
        y: -dist,
        duration: SCROLL_DURATION_S,
        ease: 'none',
        onComplete: () => {
          setDone(true);
        },
      }
    );
  }, [prefersReducedMotion]);

  /* Lance l'animation à l'ouverture */
  useEffect(() => {
    if (!open) {
      tweenRef.current?.kill();
      tweenRef.current = null;
      setDone(false);
      return;
    }
    const id = window.setTimeout(startScroll, 800);
    return () => window.clearTimeout(id);
  }, [open, startScroll]);

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
    'pointer-events-auto cursor-pointer fixed left-1/2 top-[50%] z-[70] max-w-[min(calc(100vw-2rem),24rem)] -translate-x-1/2 -translate-y-1/2 ' +
    'border border-solar-gold/35 bg-da-depth-night/85 px-6 py-2.5 font-sans text-[10px] font-medium uppercase ' +
    'tracking-[0.32em] text-solar-gold/72 backdrop-blur-sm transition-colors hover:border-solar-gold/65 hover:text-solar-gold ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-gold/30';

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-label={copy.orientationCreditsLabel}
      className="fixed inset-0 z-[525] overflow-hidden bg-da-depth-night"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Fond étoilé léger */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(6,14,38,0.9), transparent 68%), ' +
            'radial-gradient(ellipse 55% 40% at 80% 75%, rgba(139,213,255,0.03), transparent 60%)',
        }}
      />

      {/* Masques haut / bas — dégradé doux pour ne pas rogner les capitales du titre */}
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
        className="absolute inset-x-0 z-[2] mx-auto w-full max-w-lg px-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] text-center"
        style={{ transform: 'translateY(100vh)' }}
      >
        {/* Titre — line-height + padding pour ascendantes (Bahlull + bg-clip-text) */}
        <h1 className="font-bahlull text-[clamp(3rem,8vw,5rem)] italic leading-[1.12] tracking-tight text-transparent bg-gradient-to-br from-da-parchment-bright/90 via-solar-gold/80 to-da-oxide/70 bg-clip-text [padding-block:0.15em_0.2em] [box-decoration-break:clone]">
          {copy.voyageCreditsTitle}
        </h1>
        <p className={`mt-4 font-sans text-[11px] uppercase tracking-[0.38em] ${muted}`}>
          {copy.voyageCreditsSubtitle}
        </p>

        {/* Séparateur */}
        <div className="mx-auto my-14 h-px w-16 bg-solar-gold/22" aria-hidden />

        {/* Blocs */}
        <div className="space-y-14">
          {copy.voyageCreditsBlocks.map((block) => (
            <section key={block.heading}>
              <h2 className={`font-sans text-[9px] font-semibold uppercase tracking-[0.5em] ${sectionHead}`}>
                {block.heading}
              </h2>
              <ul className={`mt-4 space-y-2.5 font-sans text-[14px] leading-[1.7] ${body}`}>
                {block.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Fin */}
        <div className="mx-auto my-14 h-px w-16 bg-solar-gold/22" aria-hidden />
        <p className={`font-serif text-[clamp(1rem,2.5vw,1.18rem)] italic leading-relaxed ${muted}`}>
          {copy.voyageCreditsFin}
        </p>

        <div className="mx-auto mt-14 h-px w-24 bg-solar-gold/20" aria-hidden />

        {/* Logo institutionnel : fin du défilement (avec le générique), pas fixe */}
        <div className="pointer-events-none mt-12 flex flex-col items-center pb-8 md:mt-14 md:pb-10">
          <img
            src={MMI_LOGO_SRC}
            alt="MMI — IUT de Toulon"
            className="block h-[clamp(52px,10vw,80px)] w-auto opacity-90 brightness-105 contrast-105 md:h-[clamp(60px,8vw,88px)]"
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        {/* Espace bas pour que le logo et la dernière ligne montent bien hors écran */}
        <div className="h-[55vh]" aria-hidden />
      </div>

      {/* Bouton Fermer — visible uniquement quand les crédits sont terminés */}
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
