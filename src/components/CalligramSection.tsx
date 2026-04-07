import React, { useMemo, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";

const POEM_FRAGMENTS = [
  "Le soleil est notre seule patrie",
  "Citoyen de beauté",
  "Algérie au cœur",
  "Poésie Solaire",
  "Fraternité",
  "L'azur",
  "Le cri",
  "La joie",
  "Sénac",
  "Jean",
  "1926-1973",
  "Béni Saf",
  "Alger",
  "La cave à poèmes",
  "Corps à corps",
  "Matinale d'Alger",
  "Poèmes à l'autre France",
  "L'enfant de la lumière",
  "Le poète assassiné",
  "Soleil de ma terre"
];

const DECORATIVE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789✦✧☼☀";

interface Particle {
  id: number;
  char: string;
  initialX: number;
  initialY: number;
  targetX: number;
  targetY: number;
  targetRotate: number;
  size: number;
  delay: number;
  duration: number;
  isMain: boolean;
}

export default function CalligramSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 40,
    damping: 25
  });

  const particles = useMemo(() => {
    const items: Particle[] = [];
    let id = 0;

    // 1. Create the "SUN" shape particles
    const rayCount = 12;
    const particlesPerRay = 15;
    
    for (let r = 0; r < rayCount; r++) {
      const angle = (r / rayCount) * Math.PI * 2;
      const fragment = POEM_FRAGMENTS[r % POEM_FRAGMENTS.length];
      
      for (let p = 0; p < particlesPerRay; p++) {
        const dist = 140 + p * 35; // Distance from center
        const char = fragment[p % fragment.length] || DECORATIVE_CHARS[Math.floor(Math.random() * DECORATIVE_CHARS.length)];
        
        items.push({
          id: id++,
          char,
          initialX: 50 + (Math.random() - 0.5) * 200,
          initialY: -20 - Math.random() * 150,
          targetX: 50 + Math.cos(angle) * (dist / 10),
          targetY: 50 + Math.sin(angle) * (dist / 10),
          targetRotate: (angle * 180) / Math.PI + 90,
          size: 12 + Math.random() * 28,
          delay: Math.random() * 0.3,
          duration: 0.3 + Math.random() * 0.3,
          isMain: p < fragment.length
        });
      }
    }

    // 2. Create the "SÉNAC" center particles
    const centerWord = "SÉNAC";
    for (let i = 0; i < centerWord.length; i++) {
      items.push({
        id: id++,
        char: centerWord[i],
        initialX: 50 + (i - 2) * 15,
        initialY: -80,
        targetX: 50 + (i - 2) * 10,
        targetY: 50,
        targetRotate: 0,
        size: 160, // Even larger for impact
        delay: 0.1,
        duration: 0.6,
        isMain: true
      });
    }

    // 3. Add background "noise" particles
    for (let i = 0; i < 150; i++) {
      items.push({
        id: id++,
        char: DECORATIVE_CHARS[Math.floor(Math.random() * DECORATIVE_CHARS.length)],
        initialX: Math.random() * 100,
        initialY: -150 - Math.random() * 300,
        targetX: Math.random() * 100,
        targetY: Math.random() * 100,
        targetRotate: Math.random() * 360,
        size: 10 + Math.random() * 25,
        delay: Math.random() * 0.3,
        duration: 0.3 + Math.random() * 0.3,
        isMain: false
      });
    }

    return items;
  }, []);

  return (
    <section ref={containerRef} className="relative h-[350vh] w-full bg-solar-brown overflow-visible z-20">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Background Glow */}
        <motion.div 
          style={{ 
            scale: useTransform(smoothProgress, [0, 0.5, 1], [0.8, 1.8, 1.2]),
            opacity: useTransform(smoothProgress, [0, 0.3, 0.7, 1], [0, 0.4, 0.4, 0]),
            rotate: useTransform(smoothProgress, [0, 1], [0, 90])
          }}
          className="absolute w-[90vw] h-[90vw] pointer-events-none"
        >
          {/* Central Solar Ornament */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.15)_0%,transparent_70%)] blur-[100px]" />
            
            {/* Rotating Rings */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute w-[60%] h-[60%] border border-solar-gold/10 rounded-full"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute w-[70%] h-[70%] border border-dashed border-solar-gold/5 rounded-full"
            />
            
            {/* Diamond HUD Accents */}
            {[...Array(4)].map((_, i) => (
              <div 
                key={i}
                style={{ transform: `rotate(${i * 90}deg) translateY(-35vh)` }}
                className="absolute w-8 h-8 border border-solar-gold/20 rotate-45"
              />
            ))}
          </div>
        </motion.div>

        {/* Shimmering Particles Background */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={`bg-shimmer-${i}`}
              initial={{ opacity: 0.1, scale: 1, x: 0, y: 0 }}
              animate={{ 
                opacity: [0.1, 0.4, 0.1],
                scale: [1, 1.5, 1],
                x: [0, Math.random() * 40 - 20, Math.random() * 80 - 40],
                y: [0, Math.random() * 40 - 20, Math.random() * 80 - 40]
              }}
              transition={{ 
                duration: 4 + Math.random() * 6, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              className="absolute w-2 h-2 bg-solar-gold/15 rounded-full blur-sm"
            />
          ))}
        </div>

        {particles.map((p) => (
          <TypographicParticle 
            key={p.id} 
            particle={p} 
            progress={smoothProgress} 
          />
        ))}

        {/* Central Quote that appears at the end */}
        <motion.div
          style={{
            opacity: useTransform(smoothProgress, [0.7, 0.9], [0, 1]),
            y: useTransform(smoothProgress, [0.7, 0.9], [80, 0]),
            letterSpacing: useTransform(smoothProgress, [0.7, 0.9], ["2em", "0.8em"])
          }}
          className="absolute bottom-24 text-center px-6"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-solar-gold/40 to-transparent" />
            <p className="text-solar-gold font-serif italic text-2xl md:text-3xl font-light uppercase drop-shadow-[0_0_10px_rgba(197,160,89,0.3)]">
              "Le soleil est notre seule patrie"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-1.5 bg-solar-gold rotate-45" />
              <div className="h-px w-12 bg-solar-gold/20" />
              <div className="w-1.5 h-1.5 bg-solar-gold rotate-45" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TypographicParticle({ particle, progress }: { particle: Particle; progress: any }) {
  const start = Math.min(particle.delay, 0.6);
  const end = Math.min(start + particle.duration, 0.7);

  // Vortex effect: spiral in from outside
  const x = useTransform(
    progress,
    [0, start, end, 1],
    [`${particle.initialX + (Math.random() - 0.5) * 100}%`, `${particle.initialX}%`, `${particle.targetX}%`, `${particle.targetX}%`]
  );

  // Y movement: from top to target, then continue falling slowly
  const y = useTransform(
    progress,
    [0, start, end, 1],
    [`${particle.initialY}%`, `${particle.initialY}%`, `${particle.targetY}%`, `${particle.targetY + 15}%`]
  );

  const rotate = useTransform(
    progress,
    [0, start, end, 1],
    [particle.targetRotate + 360, particle.targetRotate + 360, particle.targetRotate, particle.targetRotate + (Math.random() - 0.5) * 20]
  );

  const opacity = useTransform(
    progress,
    [0, start, Math.min(start + 0.05, 0.65), end, 0.9, 1],
    [0, 0, 1, 1, 1, 0]
  );

  const scale = useTransform(
    progress,
    [0, start, end, 1],
    [3, 3, 1, 1]
  );

  const blur = useTransform(
    progress,
    [0, start, Math.min(start + 0.1, 0.7), Math.max(end - 0.1, 0), end],
    ["15px", "15px", "0px", "0px", "0px"]
  );

  // Shimmer effect for main letters
  const shimmer = useTransform(
    progress,
    [0, end, Math.min(end + 0.1, 0.9), Math.min(end + 0.2, 1), 1],
    ["1", "1", "1.5", "1", "1"]
  );

  return (
    <motion.div
      style={{
        left: x,
        top: y,
        rotate,
        opacity,
        scale: particle.isMain ? shimmer : scale,
        filter: blur,
        fontSize: particle.size,
        position: "absolute",
        translateX: "-50%",
        translateY: "-50%"
      }}
      className={`font-serif select-none pointer-events-none transition-colors duration-1000 ${
        particle.isMain 
          ? "text-solar-gold font-bold drop-shadow-[0_0_20px_rgba(197,160,89,0.8)]" 
          : "text-solar-gold/10 font-light"
      }`}
    >
      {particle.char}
    </motion.div>
  );
}
