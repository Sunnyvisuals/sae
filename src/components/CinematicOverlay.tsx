import { motion, useScroll, useTransform } from "motion/react";

export default function CinematicOverlay() {
  const { scrollYProgress } = useScroll();
  
  // Dynamic light leak based on scroll
  const lightLeakOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.1, 0.2, 0.1]);
  const lightLeakX = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[11]">
      {/* 1. Grain/Noise Layer */}
      <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] w-full h-full" />
      </div>

      {/* 2. Dynamic Light Leak - Amber/Solar Glow */}
      <motion.div 
        style={{ opacity: lightLeakOpacity, x: lightLeakX }}
        className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.15)_0%,transparent_60%)] blur-[100px]"
      />

      {/* 3. Vignette - Cinematic Framing */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)]" />

      {/* 4. Subtle Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.005),rgba(0,0,128,0.01))] bg-[size:100%_2px,3px_100%] pointer-events-none opacity-20" />

    </div>
  );
}
