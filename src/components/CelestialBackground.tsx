import { motion, useScroll, useTransform } from "motion/react";
import React from "react";

export default function CelestialBackground() {
  const { scrollYProgress } = useScroll();
  
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.3, 0.6, 0.6, 0.2]);

  return (
    <motion.div 
      style={{ opacity }}
      className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
    >
      {/* Large Rotating Rings */}
      <motion.div 
        style={{ rotate: rotate1 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] border border-solar-gold/10 rounded-full"
      />
      <motion.div 
        style={{ rotate: rotate2 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vmax] h-[120vmax] border border-solar-gold/5 rounded-full"
      />
      
      {/* Intricate Astrolabe Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="gold-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c5a059" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#c5a059" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Central Compass/Astrolabe */}
        <g transform="translate(500, 500)" filter="url(#glow)">
          {/* Main axis lines */}
          {[...Array(24)].map((_, i) => (
            <line
              key={i}
              x1="0" y1="-500" x2="0" y2="500"
              stroke="#c5a059"
              strokeWidth="0.3"
              transform={`rotate(${i * 7.5})`}
              className="opacity-20"
            />
          ))}
          
          {/* Concentric Circles */}
          <circle cx="0" cy="0" r="450" fill="none" stroke="#c5a059" strokeWidth="0.2" className="opacity-10" />
          <circle cx="0" cy="0" r="400" fill="none" stroke="#c5a059" strokeWidth="0.5" className="opacity-20" />
          <circle cx="0" cy="0" r="350" fill="none" stroke="#c5a059" strokeWidth="0.2" className="opacity-10" />
          <circle cx="0" cy="0" r="300" fill="none" stroke="#c5a059" strokeWidth="0.8" className="opacity-40" />
          <circle cx="0" cy="0" r="150" fill="none" stroke="#c5a059" strokeWidth="1.5" className="opacity-60" />
          
          {/* Islamic Geometric Patterns (Simplified) */}
          {[...Array(8)].map((_, i) => (
            <rect
              key={i}
              x="-250" y="-250" width="500" height="500"
              fill="none"
              stroke="#c5a059"
              strokeWidth="0.4"
              transform={`rotate(${i * 45 / 2})`}
              className="opacity-15"
            />
          ))}
          
          {/* Small Decorative Circles on Rings */}
          {[...Array(12)].map((_, i) => (
            <g key={i} transform={`rotate(${i * 30})`}>
              <circle cx="0" cy="-300" r="3" fill="#c5a059" className="opacity-60" />
              <circle cx="0" cy="-300" r="8" fill="none" stroke="#c5a059" strokeWidth="0.5" className="opacity-30" />
            </g>
          ))}
        </g>
        
        {/* Distant Grid/Map Lines */}
        <path d="M 0 500 L 1000 500" stroke="#c5a059" strokeWidth="0.1" className="opacity-10" />
        <path d="M 500 0 L 500 1000" stroke="#c5a059" strokeWidth="0.1" className="opacity-10" />
        
        {/* Constellation-like dots */}
        {[...Array(80)].map((_, i) => (
          <circle
            key={i}
            cx={Math.random() * 1000}
            cy={Math.random() * 1000}
            r={Math.random() * 1.2}
            fill="#c5a059"
            className="opacity-30 animate-pulse"
            style={{ animationDelay: `${Math.random() * 5}s` }}
          />
        ))}
      </svg>
      
      {/* Vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </motion.div>
  );
}
