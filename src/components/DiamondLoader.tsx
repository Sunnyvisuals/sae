import { motion } from "motion/react";

export type DiamondLoaderProps = {
  className?: string;
  /** Outer rotated-square wrapper (Intro skip uses w-14 h-14) */
  boxClassName?: string;
  /** One-shot stroke sweep (Intro skip timing) */
  progressDurationSec?: number;
  /** Infinite stroke sweep for loading */
  progressLoop?: boolean;
  showParticles?: boolean;
  /** Opacity pulse 100% → 0% → 100% (boot screen) */
  breathing?: boolean;
  /** Cycle length in seconds when `breathing` is true */
  breathingDurationSec?: number;
};

export default function DiamondLoader({
  className,
  boxClassName = "w-14 h-14",
  progressDurationSec,
  progressLoop,
  showParticles = false,
  breathing = false,
  breathingDurationSec = 3.2,
}: DiamondLoaderProps) {
  const showRing =
    progressDurationSec !== undefined || Boolean(progressLoop);

  return (
    <motion.div
      className={`relative flex items-center justify-center ${boxClassName} ${className ?? ""}`}
      animate={breathing ? { opacity: [1, 0, 1] } : undefined}
      transition={
        breathing
          ? {
              duration: breathingDurationSec,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : undefined
      }
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 border border-solar-gold/30 rotate-45"
      />

      <div className="absolute inset-2 border border-solar-gold bg-black/40 backdrop-blur-xl rotate-45 flex items-center justify-center group-hover:bg-solar-gold/20 transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(197,160,89,0.4)]">
        <div className="-rotate-45 flex items-center gap-0.5">
          <motion.div
            animate={{ x: [0, 2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-solar-gold rounded-full"
          />
          <motion.div
            animate={{ x: [0, 2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            className="w-1.5 h-1.5 bg-solar-gold rounded-full opacity-60"
          />
        </div>
      </div>

      {showRing && (
        <svg className="absolute inset-0 w-full h-full rotate-45" viewBox="0 0 56 56">
          {progressLoop ? (
            <motion.rect
              x="4"
              y="4"
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="192"
              initial={{ strokeDashoffset: 192 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
              className="text-solar-gold"
            />
          ) : (
            <motion.rect
              x="4"
              y="4"
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="192"
              initial={{ strokeDashoffset: 192 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{
                duration: progressDurationSec ?? 8,
                ease: "linear",
              }}
              className="text-solar-gold"
            />
          )}
        </svg>
      )}

      {showParticles && (
        <div className="absolute -inset-4 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 0.5, 0],
                y: [-20, -40],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
              className="absolute bottom-full left-1/2 w-0.5 h-0.5 bg-solar-gold rounded-full"
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
