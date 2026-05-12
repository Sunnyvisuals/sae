import { motion, useScroll, useTransform } from "motion/react";

export default function CinematicOverlay() {
  const { scrollYProgress } = useScroll();

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

  return (
    <div className="fixed inset-0 pointer-events-none z-[11]">
      {lightLeak}
      {vignette}
    </div>
  );
}
