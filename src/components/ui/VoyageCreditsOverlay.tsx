'use client';

import { useEffect, useLayoutEffect, useRef, useCallback, useState, type MutableRefObject } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import gsap from 'gsap';
import { useAppCopy } from '../../hooks/useAppCopy';
import type { VoyageCreditsBlock } from '../../lib/appCopy';
import { useLanguageStore } from '../../stores/languageStore';
import ShootingStars from '../ShootingStars';
import VoyageCreditsAmbient from './VoyageCreditsAmbient';
import { ACT3_DUST_GRAIN_SIZE } from '../../lib/act3NightSky';
import { useCreditsDaScroll } from '../../hooks/useCreditsDaScroll';
import {
  VOYAGE_CREDITS_VIGNETTE,
  blendCreditsBaseBg,
  blendCreditsHaloOverlay,
  creditsRootBgColor,
  voyageCreditsDaFinale,
  voyageCreditsDaWarm,
} from '../../lib/voyageCreditsDa';

/** Durée totale du défilement (secondes). Augmenter si contenu plus long / typo plus grande. */
const SCROLL_DURATION_S = 88;
/** Déclenche fondu + bouton dès que le bas du générique entre dans le cadre (pas à 100 %). */
/** ~6 s plus tard qu’à 81 % (défilement 88 s) — fondu quand le bas du générique est bien entré. */
const FINALE_SCROLL_PROGRESS = 0.88;
/** Fondu noir de clôture (secondes). */
const FINALE_FADE_TO_BLACK_S = 3.85;
/** Bouton Fermer : peu après le début du fondu (pas après la fin du fondu). */
const FINALE_BTN_DELAY_S = 1.2;
/** Fondu entrant depuis l’acte III (croisé avec le fondu sortant de la scène). */
const ACT3_FINALE_ENTER_FADE_S = 2.85;

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
  const finaleTriggeredRef = useRef(false);
  /** 0→1 : pilote parallaxe ciel / brume / fumée / arche pendant le défilement GSAP. */
  const creditsProgressRef = useRef(0);
  const creditsImmersion = useCreditsDaScroll(open, fromAct3Finale, creditsProgressRef);

  const [scrollDone, setScrollDone] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const eyebrow =
    'font-sans text-[11px] font-medium uppercase tracking-[0.48em] text-solar-gold/55 [text-shadow:0_0_12px_rgba(0,0,0,0.82)] sm:text-[12px]';
  const body =
    'font-sans text-[15px] font-normal leading-[1.76] tracking-[0.02em] text-[rgba(253,250,246,0.48)] [text-shadow:0_0_10px_rgba(0,0,0,0.72)] sm:text-[16px] sm:leading-[1.78]';
  const sectionHead = eyebrow;
  const creditsLead =
    'mt-5 font-sans text-[17px] font-medium leading-snug tracking-[0.03em] text-[rgba(253,250,246,0.78)] [text-shadow:0_0_12px_rgba(0,0,0,0.75)] sm:text-[18px]';
  const creditsGroupLabel =
    'mt-7 font-sans text-[10px] font-medium uppercase tracking-[0.42em] text-solar-gold/42 first:mt-5 sm:text-[11px]';
  const creditsList =
    `mx-auto mt-3 max-w-[min(100%,24rem)] list-none space-y-2.5 pl-0 text-center ${body} text-balance [text-wrap:pretty]`;

  /* ── Défilement GSAP (réf PRM stable : évite de relancer l’effet si le hook change) ── */
  const startScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) {
      setScrollDone(true);
      return;
    }
    if (prefersReducedMotionRef.current) {
      tweenRef.current?.kill();
      tweenRef.current = null;
      gsap.set(el, { y: 0 });
      setScrollDone(true);
      return;
    }
    tweenRef.current?.kill();
    finaleTriggeredRef.current = false;
    creditsProgressRef.current = 0;
    const dist = Math.max(0, el.scrollHeight - window.innerHeight * 0.15);
    gsap.set(el, { y: '100vh' });
    const triggerFinale = () => {
      if (finaleTriggeredRef.current) return;
      finaleTriggeredRef.current = true;
      setScrollDone(true);
    };
    tweenRef.current = gsap.to(el, {
      y: -dist,
      duration: SCROLL_DURATION_S,
      ease: 'none',
      onUpdate() {
        const p = this.progress();
        creditsProgressRef.current = p;
        if (p >= FINALE_SCROLL_PROGRESS) triggerFinale();
      },
      onComplete: () => {
        creditsProgressRef.current = 1;
        triggerFinale();
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
      finaleTriggeredRef.current = false;
      creditsProgressRef.current = 0;
      setScrollDone(false);
      setShowClose(false);
      return;
    }
    if (skipScrollAnimation) {
      tweenRef.current?.kill();
      tweenRef.current = null;
      const t = window.setTimeout(() => {
        const el = trackRef.current;
        if (!el) {
          setScrollDone(true);
          return;
        }
        const vh = window.innerHeight;
        /* Aligner le bas du générique avec le bas du viewport (pas scrollHeight - 0.15vh),
         * sinon la « fenêtre » tombe dans le grand padding vide sous le logo. */
        const dist = Math.max(0, el.scrollHeight - vh);
        gsap.set(el, { y: -dist });
        creditsProgressRef.current = 1;
        setScrollDone(true);
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

  /* Fondu noir puis bouton Fermer */
  useEffect(() => {
    if (!open || !scrollDone) return;
    if (reduceMotion) {
      setShowClose(true);
      return;
    }
    const delayMs = FINALE_BTN_DELAY_S * 1000;
    const id = window.setTimeout(() => setShowClose(true), delayMs);
    return () => window.clearTimeout(id);
  }, [open, scrollDone, reduceMotion]);

  /* Échap = fermer (seulement quand le bouton est affiché) */
  useEffect(() => {
    if (!open || !showClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, showClose, onClose]);

  if (!open) return null;

  const skipBtn =
    'pointer-events-auto cursor-pointer fixed left-1/2 top-[50%] z-[70] max-w-[min(calc(100vw-2rem),28rem)] min-h-[48px] -translate-x-1/2 -translate-y-1/2 ' +
    'border border-solar-gold/35 bg-black/55 px-8 py-3.5 font-sans text-[12px] font-medium uppercase sm:px-10 sm:py-4 sm:text-[13px] ' +
    'tracking-[0.28em] text-solar-gold/72 backdrop-blur-sm transition-colors hover:border-solar-gold/65 hover:text-solar-gold ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-gold/30';

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-label={copy.orientationCreditsLabel}
      className={`fixed inset-0 z-[525] ${reduceMotion ? 'overflow-y-auto' : 'overflow-hidden'}`}
      style={{ backgroundColor: creditsRootBgColor(creditsImmersion) }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: fromAct3Finale
          ? reduceMotion
            ? 0.28
            : ACT3_FINALE_ENTER_FADE_S
          : 0.65,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <CreditsDaBackground
        fromAct3Finale={fromAct3Finale}
        reduceMotion={reduceMotion}
        creditsProgressRef={creditsProgressRef}
        immersion={creditsImmersion}
      />
      
      {/* Masques haut / bas - dégradé doux pour ne pas rogner les capitales du titre */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-20 sm:h-24"
        style={{
          background:
            'linear-gradient(to bottom, rgba(5, 5, 8, 0.55) 0%, rgba(5, 5, 8, 0.12) 70%, transparent 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-20 sm:h-24"
        style={{
          background:
            'linear-gradient(to top, rgba(5, 5, 8, 0.55) 0%, rgba(5, 5, 8, 0.12) 70%, transparent 100%)',
        }}
      />

      {/* Piste de défilement */}
      <div
        ref={trackRef}
        dir={lang === 'ar-dz' ? 'rtl' : 'ltr'}
        className={
          'absolute inset-x-0 top-0 z-[2] mx-auto w-full max-w-2xl px-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-[max(12vh,4.5rem)] text-center sm:max-w-3xl ' +
          (!reduceMotion ? 'will-change-transform' : '')
        }
      >
        {/* Titre - Bahlull : interligne + marge pour éviter rognage (bg-clip-text + italique). */}
        <motion.div className="mx-auto flex w-full max-w-[min(100%,44rem)] justify-center overflow-visible px-3 py-5 text-center sm:px-4 sm:py-6">
          <h1
            className={
              lang === 'ar-dz'
                ? 'mx-auto max-w-[min(100%,28ch)] font-arabic-ui text-[clamp(2.2rem,7.4vw,4.25rem)] font-normal leading-[1.12] tracking-[0.02em] text-da-parchment/92 [text-shadow:0_0_22px_rgba(197,160,89,0.22)]'
                : 'font-bahlull mx-auto box-border w-fit max-w-full overflow-visible text-[clamp(2.35rem,7.6vw,4.85rem)] italic leading-[1.18] tracking-[-0.02em] text-transparent [padding-block:0.18em] [padding-inline:0.08em] bg-clip-text'
            }
            style={
              lang === 'ar-dz'
                ? undefined
                : midnight
                  ? {
                      backgroundImage:
                        'linear-gradient(165deg, #e8f6ff 0%, #94c8ff 38%, #5aa8ff 58%, #e0f4ff 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      WebkitBoxDecorationBreak: 'clone',
                      boxDecorationBreak: 'clone',
                      filter: 'drop-shadow(0 0 20px rgba(90,168,255,0.22))',
                    }
                  : {
                      backgroundImage:
                        'linear-gradient(165deg, #fdf8ee 0%, #e8d4a4 42%, #c5a059 92%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      WebkitBoxDecorationBreak: 'clone',
                      boxDecorationBreak: 'clone',
                      filter: 'drop-shadow(0 0 20px rgba(197, 160, 89, 0.28))',
                    }
            }
          >
            {copy.voyageCreditsTitle}
          </h1>
        </motion.div>
        <p className={`mt-5 ${eyebrow}`}>
          {copy.voyageCreditsSubtitle}
        </p>

        {/* Séparateur */}
        <div className="mx-auto my-16 h-px w-20 bg-solar-gold/22" aria-hidden />

        {/* Blocs */}
        <div className="mx-auto max-w-[min(100%,28rem)] space-y-16 text-center">
          {copy.voyageCreditsBlocks.map((block) => (
            <CreditsBlockSection
              key={block.heading}
              block={block}
              sectionHead={sectionHead}
              creditsLead={creditsLead}
              creditsGroupLabel={creditsGroupLabel}
              creditsList={creditsList}
            />
          ))}
        </div>

        {/* Fin */}
        <div className="mx-auto my-16 h-px w-20 bg-solar-gold/22" aria-hidden />
        <p
          className={
            'mx-auto max-w-[min(100%,24rem)] text-center font-sans text-[clamp(1.08rem,3vw,1.42rem)] font-normal uppercase leading-[1.65] tracking-[0.14em] ' +
            'text-[rgba(212,197,176,0.72)] [text-shadow:0_0_10px_rgba(0,0,0,0.72)]'
          }
        >
          {copy.voyageCreditsFin}
        </p>

        <div className="mx-auto mt-14 h-px w-24 bg-solar-gold/20" aria-hidden />

        {/* Logo institutionnel : masque luminance → le noir du PNG devient transparent */}
        <div className="pointer-events-none mt-12 flex flex-col items-center pb-8 md:mt-14 md:pb-10">
          <div
            role="img"
            aria-label="MMI - IUT de Toulon"
            className="mx-auto block aspect-[203/88] h-[clamp(58px,11vw,88px)] w-auto max-w-[min(92vw,22rem)] opacity-95 md:h-[clamp(66px,9vw,96px)]"
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

      {/* Fondu au noir quand le défilement est terminé */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[62] bg-[#050508]"
        initial={false}
        animate={{ opacity: scrollDone ? 1 : 0 }}
        transition={{
          duration: reduceMotion ? 0 : FINALE_FADE_TO_BLACK_S,
          ease: [0.22, 1, 0.36, 1],
        }}
      />

      {/* Bouton Fermer - après le fondu */}
      {showClose && (
        <motion.button
          type="button"
          onClick={onClose}
          aria-label={copy.voyageCreditsCloseAria}
          className={skipBtn}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: reduceMotion ? 0 : 0.65,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {copy.voyageCreditsClose}
        </motion.button>
      )}
    </motion.div>
  );
}

function CreditsLinesList({
  lines,
  className,
}: {
  lines: string[];
  className: string;
}) {
  return (
    <ul className={className}>
      {lines.map((line) => (
        <li key={line} className="leading-[1.76]">
          {line}
        </li>
      ))}
    </ul>
  );
}

function CreditsBlockSection({
  block,
  sectionHead,
  creditsLead,
  creditsGroupLabel,
  creditsList,
}: {
  block: VoyageCreditsBlock;
  sectionHead: string;
  creditsLead: string;
  creditsGroupLabel: string;
  creditsList: string;
}) {
  return (
    <section className="text-center">
      <h2 className={`${sectionHead} text-center`}>{block.heading}</h2>
      {block.lead ? <p className={creditsLead}>{block.lead}</p> : null}
      {block.lines ? (
        <CreditsLinesList lines={block.lines} className={creditsList} />
      ) : null}
      {block.groups?.map((group) => (
        <div key={group.label}>
          <h3 className={creditsGroupLabel}>{group.label}</h3>
          <CreditsLinesList lines={group.lines} className={creditsList} />
        </div>
      ))}
    </section>
  );
}

/** Fond plein écran - DA parchemin `.voyage-credits` (chaud) ou prolongation nuit acte III. */
function CreditsDaBackground({
  fromAct3Finale,
  reduceMotion,
  creditsProgressRef,
  immersion,
}: {
  fromAct3Finale: boolean;
  reduceMotion: boolean;
  creditsProgressRef: MutableRefObject<number>;
  immersion: number;
}) {
  const warm = voyageCreditsDaWarm;
  const night = voyageCreditsDaFinale;
  const nightMix = Math.min(1, Math.max(0, immersion));
  const warmMix = 1 - nightMix;
  const starsOpacity = 0.28 + nightMix * 0.58;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{ background: blendCreditsBaseBg(immersion) }}
      />
      <VoyageCreditsAmbient
        fromAct3Finale={fromAct3Finale}
        reduceMotion={reduceMotion}
        creditsProgressRef={creditsProgressRef}
        immersion={immersion}
      />
      <div
        className="absolute inset-0 z-[4]"
        style={{ backgroundImage: warm.starfield, opacity: warmMix * 0.42 }}
      />
      <div
        className="absolute inset-0 z-[4]"
        style={{ backgroundImage: night.starfield, opacity: nightMix * 0.36 }}
      />
      <div
        className="absolute inset-0 z-[4]"
        style={{ background: warm.skyRadial, opacity: warmMix }}
      />
      <div
        className="absolute inset-0 z-[4]"
        style={{ background: night.skyRadial, opacity: nightMix }}
      />
      {!reduceMotion ? (
        <div
          className="absolute inset-0 z-[5] overflow-hidden"
          style={{ opacity: starsOpacity }}
          aria-hidden
        >
          <ShootingStars />
        </div>
      ) : null}
      <div
        className="absolute inset-0 z-[5] mix-blend-soft-light"
        style={{
          backgroundImage: warm.dustGrain,
          backgroundSize: ACT3_DUST_GRAIN_SIZE,
          opacity: warmMix * 0.24,
        }}
      />
      <div
        className="absolute inset-0 z-[5] mix-blend-soft-light"
        style={{
          backgroundImage: night.dustGrain,
          backgroundSize: ACT3_DUST_GRAIN_SIZE,
          opacity: nightMix * 0.2,
        }}
      />
      <div
        className="absolute inset-0 z-[6] border-t"
        style={{
          background: blendCreditsHaloOverlay(immersion),
          borderColor: `rgba(197, 160, 89, ${0.14 * warmMix + 0.08 * nightMix})`,
        }}
      />
      <div
        className="absolute inset-0 z-[7]"
        style={{ background: VOYAGE_CREDITS_VIGNETTE }}
      />
    </div>
  );
}
