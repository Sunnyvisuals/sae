import { motion } from 'motion/react';
import { ALGERIA_PATH } from '../Immersive/algeriaOutlinePath';

type PhaseLabel = 'intro' | 'act1' | 'act2';

type Props = {
  phase: PhaseLabel;
  /** Progression Acte I 0–5 */
  revelationCount?: number;
};

/**
 * Panneau droit : fil d’Ariane + mini carte (menu système en haut à gauche dans App).
 */
export default function OrientationPanel({ phase, revelationCount = 0 }: Props) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto fixed right-0 top-0 z-[40] flex h-full w-[min(200px,22vw)] cursor-none flex-col border-l border-solar-gold/15 bg-[#080705]/75 px-4 py-8 backdrop-blur-xl"
    >
      <p className="text-[8px] uppercase tracking-[0.45em] text-solar-gold/35">Parcours</p>
      <nav className="mt-4 flex flex-col gap-2 text-[9px] tracking-wide text-solar-gold/55" aria-label="Fil d'Ariane">
        <span className={phase === 'intro' ? 'text-solar-gold' : ''}>Intro — Prologue</span>
        <span className={phase === 'act1' ? 'text-solar-gold' : ''}>Acte I — Carte-mémoire</span>
        <span className={phase === 'act2' ? 'text-solar-gold' : ''}>Acte II — (suite)</span>
      </nav>

      {phase === 'act1' && (
        <div className="mt-8">
          <p className="text-[8px] uppercase tracking-[0.35em] text-solar-gold/30">Mini-carte</p>
          <div className="relative mt-2 aspect-square w-full overflow-hidden rounded border border-solar-gold/20 bg-black/40 p-2">
            <svg viewBox="0 0 400 400" className="h-full w-full text-solar-gold/50" aria-hidden>
              <path d={ALGERIA_PATH} fill="currentColor" fillOpacity={0.12} stroke="currentColor" strokeWidth={1.2} />
            </svg>
            <div className="absolute bottom-1 right-1 text-[7px] tabular-nums text-solar-gold/40">
              {revelationCount}/5
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
