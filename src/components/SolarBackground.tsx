'use client';
import { motion } from "motion/react";
import React from "react";

export default function SolarBackground() {
  return (
    <div className="fixed inset-0 bg-solar-brown overflow-hidden pointer-events-none z-0">
      <svg className="hidden">
        <defs>
          <filter id="liquid-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="3" result="noise" seed="1">
              <animate attributeName="baseFrequency" values="0.01 0.01;0.015 0.015;0.01 0.01" dur="25s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="80" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Animated Light Leaks / Gradients */}
      <motion.div 
        animate={{ 
          filter: ['url(#liquid-filter) hue-rotate(0deg)', 'url(#liquid-filter) hue-rotate(10deg)', 'url(#liquid-filter) hue-rotate(0deg)'] 
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0"
      >
        {/* Solar Gold Glow */}
        <motion.div
          animate={{
            x: ["-10%", "10%", "-5%"],
            y: ["-10%", "5%", "10%"],
            scale: [1, 1.2, 0.9, 1],
            opacity: [0.3, 0.5, 0.4, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-solar-gold/30 blur-[120px]"
        />

        {/* Deep Orange Accent (Solar Flare) */}
        <motion.div
          animate={{
            x: ["20%", "-10%", "10%"],
            y: ["10%", "30%", "10%"],
            scale: [1.2, 1, 1.1, 1.2],
            opacity: [0.2, 0.4, 0.3, 0.2],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute bottom-[-10%] right-[-5%] w-[70%] h-[70%] rounded-full bg-[#e67e22]/20 blur-[100px]"
        />

        {/* Solar Cream Soft Light */}
        <motion.div
          animate={{
            x: ["-5%", "5%", "0%"],
            y: ["20%", "-10%", "10%"],
            scale: [0.8, 1.1, 1, 0.8],
            opacity: [0.1, 0.3, 0.2, 0.1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
          className="absolute top-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-solar-cream/10 blur-[150px]"
        />

        {/* Deep Red / Earthy Accent */}
        <motion.div
          animate={{
            x: ["10%", "-20%", "0%"],
            y: ["-20%", "10%", "-10%"],
            scale: [1, 0.9, 1.2, 1],
            opacity: [0.15, 0.25, 0.2, 0.15],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute top-[-10%] left-[20%] w-[60%] h-[60%] rounded-full bg-[#c0392b]/10 blur-[130px]"
        />

        {/* Solar Sand Warmth */}
        <motion.div
          animate={{
            x: ["-15%", "10%", "-5%"],
            y: ["10%", "20%", "0%"],
            scale: [1.1, 1, 0.9, 1.1],
            opacity: [0.2, 0.3, 0.25, 0.2],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
          className="absolute bottom-[20%] left-[10%] w-[55%] h-[55%] rounded-full bg-solar-sand/15 blur-[110px]"
        />
      </motion.div>

      {/* Grain Overlay (already in index.css but reinforcing here for depth) */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")`,
          backgroundSize: '200px',
        }}
      />
    </div>
  );
}
