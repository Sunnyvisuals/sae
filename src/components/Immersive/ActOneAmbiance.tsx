/**
 * Fond acte I - mesh chaud, poussière, étoiles filantes, fuite de lumière.
 * Chapitre accompli : halos dorés + luminosité.
 */
import { motion } from 'motion/react';
import AuroraMeshBackground from '../AuroraMeshBackground';

type Props = {
  chapterComplete?: boolean;
};

export default function ActOneAmbiance({ chapterComplete = false }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      <motion.div
        className="absolute inset-0 z-0"
        animate={{ filter: chapterComplete ? 'brightness(1.08) saturate(1.12)' : 'brightness(1) saturate(1)' }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <AuroraMeshBackground fillContainer hideShootingStars={false} className="z-0" />
      </motion.div>

      <motion.div
        aria-hidden
        className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_95%_70%_at_8%_12%,rgba(213,175,110,0.18)_0%,rgba(120,82,48,0.08)_32%,transparent_58%)]"
        animate={{ filter: chapterComplete ? 'brightness(1.35)' : 'brightness(1)' }}
        transition={{ duration: 1.2 }}
      />
      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-[linear-gradient(165deg,rgba(35,24,16,0.55)_0%,transparent_38%,rgba(8,6,4,0.35)_100%)]"
      />
      <motion.div
        aria-hidden
        className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_72%_58%_at_50%_48%,transparent_0%,rgba(8,5,3,0.1)_48%,rgba(4,2,1,0.38)_100%)]"
        animate={{ opacity: chapterComplete ? 0.55 : 1 }}
        transition={{ duration: 1.2 }}
      />

      <motion.div
        aria-hidden
        className="absolute inset-0 z-[2] mix-blend-soft-light"
        initial={false}
        animate={{
          opacity: chapterComplete ? [0.42, 0.78, 0.42] : 0,
        }}
        transition={{
          duration: 3.4,
          repeat: chapterComplete ? Infinity : 0,
          ease: 'easeInOut',
        }}
        style={{
          background: `
            radial-gradient(ellipse 88% 78% at 84% 86%, rgba(255, 248, 235, 0.22) 0%, rgba(197, 160, 89, 0.38) 32%, rgba(140, 95, 48, 0.14) 52%, transparent 72%),
            radial-gradient(ellipse 55% 48% at 14% 16%, rgba(230, 200, 150, 0.28) 0%, transparent 58%)
          `,
        }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-0 z-[2] mix-blend-screen"
        initial={false}
        animate={{ opacity: chapterComplete ? 0.55 : 0 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background:
            'radial-gradient(ellipse 100% 90% at 50% 50%, rgba(253, 246, 230, 0.08) 0%, transparent 55%)',
        }}
      />

    </div>
  );
}
