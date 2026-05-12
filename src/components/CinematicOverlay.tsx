import { motion, useScroll, useTransform } from "motion/react";
import { NOISE_DATA_URI } from "../lib/noiseDataUri";

type CinematicOverlayProps = {
  /** Acte II : halo / vignette au-dessus du HintPanel (~z-50), sous le fluide (~z-120). */
  elevateOverHints?: boolean;
  disableGrain?: boolean;
};

export default function CinematicOverlay({
  elevateOverHints = false,
  disableGrain = false,
}: CinematicOverlayProps) {
  const { scrollYProgress } = useScroll();

  // Dynamic light leak based on scroll
  const lightLeakOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.1, 0.2, 0.1]);
  const lightLeakX = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  const lightLeak = (
    <motion.div
      style={{ opacity: lightLeakOpacity, x: lightLeakX }}
      className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.15)_0%,transparent_60%)] blur-[100px]"
    />
  );

  const vignette = (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)]" />
  );

  /** Acte II : au-dessus du HintPanel seulement halo + vignette - pas de grain / scanlines (conflit avec le parchemin, aspect « film » trop lourd). */
  if (elevateOverHints) {
    return (
      <div className="fixed inset-0 pointer-events-none z-[52]">
        {lightLeak}
        {vignette}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[11]">
      {!disableGrain && (
        <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none">
          <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url("${NOISE_DATA_URI}")` }} />
        </div>
      )}

      {lightLeak}

      {vignette}

      {/* Scanlines horizontales seules : le motif RVB 3px en largeur provoquait moiré / bandes sur ultrawide. */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.04)_50%)] bg-[length:100%_2px] pointer-events-none opacity-[0.14]" />
    </div>
  );
}
