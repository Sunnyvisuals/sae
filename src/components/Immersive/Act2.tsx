import { motion } from 'motion/react';

/**
 * Acte II — placeholder narratif (contenu à enrichir).
 */
export default function Act2() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0a0806] px-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(197,160,89,0.15), transparent 55%)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-2xl text-center"
      >
        <p className="text-[9px] uppercase tracking-[0.55em] text-solar-gold/45">Acte II</p>
        <h1 className="font-bahlull mt-4 text-5xl italic text-white/95 md:text-6xl" style={{ textShadow: '0 0 50px rgba(197,160,89,0.25)' }}>
          À suivre
        </h1>
        <p className="mt-6 font-serif text-lg italic leading-relaxed text-solar-gold/45">
          Le territoire intérieur s’ouvre — prochains fragments, prochains pas.
        </p>
      </motion.div>
    </div>
  );
}
