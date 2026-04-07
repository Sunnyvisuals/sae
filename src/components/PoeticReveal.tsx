import { motion, useScroll, useTransform } from "motion/react";
import React, { useMemo } from "react";

interface PoeticRevealProps {
  quote: string;
  startProgress: number;
  endProgress: number;
}

export default function PoeticReveal({ quote, startProgress, endProgress }: PoeticRevealProps) {
  const { scrollYProgress } = useScroll();
  const words = useMemo(() => quote.split(" "), [quote]);
  
  // Calculate the progress range for each word
  const wordDuration = (endProgress - startProgress) / words.length;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20 px-6">
      {/* Subtle Background Astrolabe Ring for Poetic Reveal */}
      <motion.div 
        style={{ 
          opacity: useTransform(scrollYProgress, [startProgress - 0.1, startProgress, endProgress, endProgress + 0.1], [0, 0.15, 0.15, 0]),
          rotate: useTransform(scrollYProgress, [startProgress, endProgress], [0, 45])
        }}
        className="absolute w-[80vmax] h-[80vmax] border border-solar-gold/20 rounded-full flex items-center justify-center"
      >
        <div className="w-[95%] h-[95%] border border-dashed border-solar-gold/10 rounded-full" />
      </motion.div>

      <div className="max-w-4xl w-full text-center flex flex-wrap justify-center gap-x-3 gap-y-4">
        {words.map((word, index) => {
          const wordStart = startProgress + index * wordDuration;
          const wordEnd = wordStart + wordDuration * 1.5; // Slight overlap for smoother feel
          
          // Word-specific transforms
          const opacity = useTransform(scrollYProgress, [wordStart, wordStart + wordDuration * 0.5, wordEnd - wordDuration * 0.5, wordEnd], [0, 1, 1, 0]);
          const y = useTransform(scrollYProgress, [wordStart, wordEnd], [20, -20]);
          const blur = useTransform(scrollYProgress, [wordStart, wordStart + wordDuration * 0.3, wordEnd - wordDuration * 0.3, wordEnd], ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)"]);
          const scale = useTransform(scrollYProgress, [wordStart, wordEnd], [0.9, 1.1]);

          return (
            <motion.span
              key={index}
              style={{ 
                opacity, 
                y, 
                filter: blur,
                scale,
                display: "inline-block"
              }}
              className="font-serif italic text-3xl md:text-5xl lg:text-6xl text-white drop-shadow-[0_0_15px_rgba(197,160,89,0.3)]"
            >
              {word}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
