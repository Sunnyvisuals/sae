import { motion, useScroll, useTransform, useSpring, useMotionValue } from "motion/react";
import { useRef, useState, useEffect } from "react";

const FRAGMENTS = [
  { word: "poésie", line: "La poésie est une arme de paix.", targetX: -180 },
  { word: "est", line: "Elle est le souffle des humbles.", targetX: -80 },
  { word: "une", line: "Une promesse d'aurore.", targetX: -10 },
  { word: "lumière", line: "La lumière qui déchire l'ombre.", targetX: 80 },
  { word: "dans", line: "Dans le creux de chaque main.", targetX: 180 },
  { word: "le", line: "Le silence qui parle enfin.", targetX: 260 },
  { word: "désert", line: "Le désert est mon jardin d'étoiles.", targetX: 360 },
  // Extra fragments from user list that float but don't join the final sentence
  { word: "soleil", line: "Le soleil est mon sang.", targetX: null },
  { word: "corps", line: "Mon corps est une géographie de l'exil.", targetX: null },
  { word: "Algérie", line: "Algérie, ma mère de lumière.", targetX: null },
  { word: "liberté", line: "La liberté est un cri.", targetX: null },
  { word: "fraternité", line: "Fraternité des ombres.", targetX: null },
];

export default function PoeticFragments() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) - 0.5);
      mouseY.set((e.clientY / window.innerHeight) - 0.5);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Assembly progress: starts halfway through the section
  const assemblyProgress = useTransform(scrollYProgress, [0.4, 0.8], [0, 1]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section ref={containerRef} className="relative h-[300vh] w-full pointer-events-none">
      <motion.div 
        style={{ opacity: bgOpacity }}
        className="sticky top-0 h-screen w-full bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center overflow-hidden"
      >
        {/* Background Particles (Sand dissolving into words effect) */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-solar-gold rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ y: 0, opacity: 0.2 }}
              animate={{
                y: [0, -100, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>

        <div className="relative w-full h-full flex items-center justify-center pointer-events-auto">
          {FRAGMENTS.map((fragment, i) => (
            <Fragment 
              key={i} 
              fragment={fragment} 
              index={i} 
              assemblyProgress={assemblyProgress}
              springX={springX}
              springY={springY}
              isHovered={hoveredIndex === i}
              onHover={() => setHoveredIndex(i)}
              onLeave={() => setHoveredIndex(null)}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function Fragment({ 
  fragment, 
  index, 
  assemblyProgress, 
  springX, 
  springY, 
  isHovered, 
  onHover, 
  onLeave 
}: any) {
  // Random initial positions
  const initialX = useRef((Math.random() - 0.5) * 800).current;
  const initialY = useRef((Math.random() - 0.5) * 600).current;
  const randomRotation = useRef((Math.random() - 0.5) * 40).current;

  // Mouse parallax intensity based on index
  const mouseMoveX = useTransform(springX, [-0.5, 0.5], [-(index + 1) * 20, (index + 1) * 20]);
  const mouseMoveY = useTransform(springY, [-0.5, 0.5], [-(index + 1) * 15, (index + 1) * 15]);

  // Assembly transforms
  const x = useTransform(assemblyProgress, [0, 1], [initialX, fragment.targetX ?? initialX]);
  const y = useTransform(assemblyProgress, [0, 1], [initialY, 0]);
  const rotate = useTransform(assemblyProgress, [0, 1], [randomRotation, 0]);
  const opacity = useTransform(assemblyProgress, [0, 0.2], [0, 1]);
  
  // If it's not part of the final sentence, fade it out during assembly
  const finalOpacity = useTransform(
    assemblyProgress, 
    [0.6, 0.8], 
    [1, fragment.targetX !== null ? 1 : 0]
  );

  return (
    <motion.div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ 
        x, 
        y, 
        rotate, 
        opacity: fragment.targetX !== null ? opacity : finalOpacity,
        translateX: mouseMoveX,
        translateY: mouseMoveY,
      }}
      className="absolute cursor-none group"
    >
      <div className="relative flex flex-col items-center">
        <motion.span 
          animate={{ 
            color: isHovered ? "#fff" : "rgba(197, 160, 89, 0.7)",
            scale: isHovered ? 1.1 : 1,
            textShadow: isHovered ? "0 0 20px rgba(255,255,255,0.5)" : "none"
          }}
          className="text-3xl md:text-5xl font-serif italic tracking-widest transition-colors duration-500"
        >
          {fragment.word}
        </motion.span>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 20 : 10
          }}
          className="absolute top-full whitespace-nowrap pointer-events-none"
        >
          <span className="text-solar-gold/60 text-sm uppercase tracking-[0.3em] font-light">
            {fragment.line}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
