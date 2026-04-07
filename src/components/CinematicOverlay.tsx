import { motion, useScroll, useTransform } from "motion/react";

interface CinematicOverlayProps {
  videoStarted?: boolean;
}

export default function CinematicOverlay({ videoStarted }: CinematicOverlayProps) {
  const { scrollYProgress } = useScroll();
  
  // Dynamic light leak based on scroll
  const lightLeakOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.1, 0.2, 0.1]);
  const lightLeakX = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
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

      {/* 5. Majestic Golden Frame / Corner Ornaments - Fades out when video starts */}
      <motion.div
        animate={{ opacity: videoStarted ? 0 : 1 }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        className="absolute inset-0"
      >
        <div className="absolute inset-8 border border-solar-gold/10 pointer-events-none" />
        <div className="absolute inset-10 border border-solar-gold/5 pointer-events-none" />
        
        {/* Corner Brackets */}
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-solar-gold/40" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-solar-gold/40" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-solar-gold/40" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-solar-gold/40" />
        
        {/* Fine Geometric Accents */}
        <div className="absolute top-1/2 left-8 -translate-y-1/2 w-4 h-px bg-solar-gold/30" />
        <div className="absolute top-1/2 right-8 -translate-y-1/2 w-4 h-px bg-solar-gold/30" />
        <div className="absolute left-1/2 top-8 -translate-x-1/2 h-4 w-px bg-solar-gold/30" />
        <div className="absolute left-1/2 bottom-8 -translate-x-1/2 h-4 w-px bg-solar-gold/30" />
      </motion.div>
    </div>
  );
}
