import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCursorStore } from '../../hooks/useCursorContext';

gsap.registerPlugin(ScrollTrigger);

const VERSES = [
  { arabic: 'الجزائر', french: 'Algérie', poem: 'Citoyens de beauté' },
  { arabic: 'الشمس', french: 'Soleil', poem: 'Vocation de l\'arbre' },
  { arabic: 'الصحراء', french: 'Désert', poem: 'Diwan du Noûn' },
  { arabic: 'الحرية', french: 'Liberté', poem: 'Matinale de mon peuple' },
  { arabic: 'الذاكرة', french: 'Mémoire', poem: 'Corps corail' },
];

const FULL_VERSES = [
  'Je suis de ce pays qui se lève',
  'Comme une aube sur la mer',
  'Algérie, ma douleur, ma lumière',
  'Ton nom brûle dans ma bouche',
  'Comme le soleil dans le sable',
];

export default function PoeticScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef     = useRef<HTMLDivElement>(null);
  const { setMode }  = useCursorStore();

  useEffect(() => {
    const container = containerRef.current;
    const track     = trackRef.current;
    if (!container || !track) return;

    // Scroll horizontal via GSAP ScrollTrigger
    const panels = gsap.utils.toArray<HTMLElement>('.poetic-panel', track);
    const totalWidth = panels.reduce((acc, p) => acc + p.offsetWidth + 80, 0);

    const scrollTween = gsap.to(track, {
      x: () => -(totalWidth - window.innerWidth),
      ease: 'none',
      scrollTrigger: {
        trigger: container,
        pin: true,
        scrub: 1,
        end: () => `+=${totalWidth}`,
        invalidateOnRefresh: true,
      },
    });

    // Stagger lettre par lettre sur chaque panel
    panels.forEach((panel) => {
      const chars = panel.querySelectorAll<HTMLElement>('.char');
      gsap.fromTo(
        chars,
        { opacity: 0, y: 20, filter: 'blur(8px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          stagger: 0.04,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: panel,
            containerAnimation: scrollTween,
            start: 'left 80%',
            end: 'left 20%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ height: '100vh' }}
      onMouseEnter={() => setMode('feather', 'explorer')}
      onMouseLeave={() => setMode('default')}
    >
      {/* Titre de section */}
      <div className="absolute top-12 left-16 z-10 pointer-events-none">
        <p className="text-[9px] tracking-[0.6em] text-solar-gold/50 uppercase">Acte II</p>
        <h2 className="font-bahlull text-2xl italic text-white/70 mt-1">Le Parcours Poétique</h2>
      </div>

      {/* Track horizontal */}
      <div
        ref={trackRef}
        className="flex items-center gap-20 absolute top-0 left-0 h-full"
        style={{ paddingLeft: '10vw', paddingRight: '10vw' }}
      >
        {FULL_VERSES.map((verse, vi) => {
          const info = VERSES[vi % VERSES.length]!;
          return (
            <div
              key={vi}
              className="poetic-panel flex-shrink-0 flex flex-col justify-center"
              style={{ width: 'clamp(320px, 38vw, 560px)' }}
            >
              {/* Mot arabe en grand */}
              <p
                className="text-[clamp(4rem,10vw,8rem)] font-bahlull italic leading-none text-solar-gold/15 select-none mb-6"
                dir="rtl"
              >
                {info.arabic}
              </p>

              {/* Vers lettre par lettre */}
              <p className="text-[clamp(1.1rem,2.5vw,1.8rem)] font-bahlull italic text-white/90 leading-snug">
                {verse.split('').map((char, ci) => (
                  <span key={ci} className="char inline-block" style={{ whiteSpace: char === ' ' ? 'pre' : undefined }}>
                    {char}
                  </span>
                ))}
              </p>

              {/* Référence */}
              <p className="mt-6 text-[9px] tracking-[0.5em] uppercase text-solar-gold/40">
                — {info.poem}
              </p>

              {/* Ligne décorative */}
              <div className="mt-4 h-px w-16 bg-solar-gold/30" />
            </div>
          );
        })}

        {/* Panel final — CTA */}
        <div className="poetic-panel flex-shrink-0 flex flex-col justify-center" style={{ width: '40vw' }}>
          <p className="text-[9px] tracking-[0.6em] uppercase text-solar-gold/40 mb-4">Continuer</p>
          <p className="font-bahlull text-5xl italic text-white/80 leading-tight">
            {'Entrer dans\nla carte'.split('').map((c, i) => (
              <span key={i} className="char inline-block" style={{ whiteSpace: c === '\n' ? 'pre' : undefined }}>{c}</span>
            ))}
          </p>
          <div className="mt-8 h-px w-24 bg-solar-gold/40" />
        </div>
      </div>

      {/* Vignette bords */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: 'linear-gradient(to right, #0a0806 0%, transparent 12%, transparent 88%, #0a0806 100%)',
      }} />
    </section>
  );
}
