import { motion, useScroll, useTransform, useMotionValue, useSpring } from "motion/react";
import React, { useMemo, useEffect } from "react";

export default function DesertLandscape() {
  const { scrollYProgress } = useScroll();
  
  // Mouse movement tracking for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for mouse movement
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position from -0.5 to 0.5
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Opacity and scale transitions for the landscape appearance
  const opacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1]);
  
  // Camera movement: subtle rotation and tilt (scroll + mouse)
  const rotateX = useTransform(scrollYProgress, [0, 1], [2, -2]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [-1, 1]);

  // Mouse-based parallax transforms for different layers
  const mouseMoveX1 = useTransform(springX, [-0.5, 0.5], [-30, 30]);
  const mouseMoveY1 = useTransform(springY, [-0.5, 0.5], [-20, 20]);
  
  const mouseMoveX2 = useTransform(springX, [-0.5, 0.5], [-20, 20]);
  const mouseMoveY2 = useTransform(springY, [-0.5, 0.5], [-15, 15]);
  
  const mouseMoveX3 = useTransform(springX, [-0.5, 0.5], [-15, 15]);
  const mouseMoveY3 = useTransform(springY, [-0.5, 0.5], [-10, 10]);
  
  const mouseMoveX4 = useTransform(springX, [-0.5, 0.5], [-10, 10]);
  const mouseMoveY4 = useTransform(springY, [-0.5, 0.5], [-5, 5]);

  const mouseMoveX5 = useTransform(springX, [-0.5, 0.5], [-5, 5]);
  const mouseMoveY5 = useTransform(springY, [-0.5, 0.5], [-2, 2]);

  // Fade out the landscape as we scroll towards the poetic fragments
  const landscapeFade = useTransform(scrollYProgress, [0.4, 0.6], [1, 0]);

  // Combine initial appearance opacity with the fade-out
  const finalOpacity = useTransform([opacity, landscapeFade], ([o, f]) => (o as number) * (f as number));

  // Generate sand particles
  const particles = useMemo(() => {
    return [...Array(120)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      duration: 20 + Math.random() * 30,
      delay: Math.random() * 10,
      opacity: 0.05 + Math.random() * 0.3,
    }));
  }, []);

  // Generate light particles (dust motes)
  const lightParticles = useMemo(() => {
    return [...Array(40)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 5,
      opacity: 0.03 + Math.random() * 0.1,
    }));
  }, []);

  // Generate fine dust particles (very small, high density)
  const fineDust = useMemo(() => {
    return [...Array(80)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1 + 0.2,
      duration: 10 + Math.random() * 15,
      delay: Math.random() * 8,
      opacity: 0.02 + Math.random() * 0.08,
    }));
  }, []);

  return (
    <motion.div 
      style={{ 
        opacity: finalOpacity, 
        scale,
        rotateX,
        rotateY,
        perspective: "1000px"
      }}
      className="fixed inset-0 w-full h-full bg-solar-sand overflow-hidden z-10"
    >
      {/* SVG Filter for Watercolor effect */}
      <svg className="hidden">
        <filter id="watercolor">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="30" />
        </filter>
      </svg>

      {/* Watercolor Background Layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#fdfaf6_0%,#f5f0e6_60%,#c5a059_100%)] opacity-70" />
      
      {/* Stylized Dunes - Layered with parallax */}
      <div className="absolute inset-0">
        {/* Layer 5: Far Horizon */}
        <motion.div 
          style={{ 
            y: useTransform(scrollYProgress, [0, 1], [0, -40]),
            x: mouseMoveX5,
            translateY: mouseMoveY5,
            scaleY: 0.6,
            filter: 'url(#watercolor)' 
          }}
          className="absolute bottom-0 left-[-10%] w-[120%] h-[70%] bg-[#e8d5b5] blur-[100px] opacity-30 rounded-[100%_100%_0_0] origin-bottom"
        />

        {/* Layer 4: Distant Dunes */}
        <motion.div 
          style={{ 
            y: useTransform(scrollYProgress, [0, 1], [0, -80]), 
            x: useTransform(
              [scrollYProgress, mouseMoveX4],
              ([s, m]) => ((s as number) * 20) + (m as number)
            ),
            translateY: mouseMoveY4,
            scaleY: 0.5,
            filter: 'url(#watercolor)' 
          }}
          className="absolute bottom-0 left-[-15%] w-[130%] h-[60%] bg-[#d4b475] blur-[80px] opacity-40 rounded-[100%_100%_0_0] origin-bottom"
        />
        
        {/* Layer 3: Middle Dunes */}
        <motion.div 
          style={{ 
            y: useTransform(scrollYProgress, [0, 1], [0, -140]), 
            x: useTransform(
              [scrollYProgress, mouseMoveX3],
              ([s, m]) => ((s as number) * -30) + (m as number)
            ),
            translateY: mouseMoveY3,
            scaleY: 0.4,
            filter: 'url(#watercolor)' 
          }}
          className="absolute bottom-0 left-[-20%] w-[140%] h-[50%] bg-[#c5a059] blur-[60px] opacity-50 rounded-[100%_100%_0_0] origin-bottom"
        />
        
        {/* Layer 2: Near Dunes */}
        <motion.div 
          style={{ 
            y: useTransform(scrollYProgress, [0, 1], [0, -220]), 
            x: useTransform(
              [scrollYProgress, mouseMoveX2],
              ([s, m]) => ((s as number) * 40) + (m as number)
            ),
            translateY: mouseMoveY2,
            scaleY: 0.3,
            filter: 'url(#watercolor)' 
          }}
          className="absolute bottom-0 left-[-10%] w-[120%] h-[40%] bg-[#b08d4a] blur-[30px] opacity-60 rounded-[100%_100%_0_0] origin-bottom"
        />

        {/* Layer 1: Foreground Texture */}
        <motion.div 
          style={{ 
            y: useTransform(scrollYProgress, [0, 1], [0, -350]),
            x: mouseMoveX1,
            translateY: mouseMoveY1,
            scaleY: 0.2,
            filter: 'url(#watercolor)' 
          }}
          className="absolute bottom-0 left-[-5%] w-[110%] h-[30%] bg-[#96753a] blur-[15px] opacity-40 rounded-[100%_100%_0_0] origin-bottom"
        />
      </div>

      {/* Artistic Texture Overlay */}
      <div className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]" />

      {/* Floating Sand/Light Particles */}
      <motion.div 
        style={{ x: mouseMoveX3, y: mouseMoveY3 }}
        className="absolute inset-0 pointer-events-none"
      >
        {particles.map((p) => (
          <motion.div
            key={`sand-${p.id}`}
            className="absolute bg-solar-gold rounded-full blur-[1px]"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: p.opacity,
            }}
            initial={{ x: 0, y: 0, opacity: p.opacity }}
            animate={{
              x: [0, Math.random() * 50 - 25, Math.random() * 100 - 50],
              y: [0, Math.random() * 50 - 25, Math.random() * 100 - 50],
              opacity: [p.opacity, p.opacity * 2, p.opacity],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            }}
          />
        ))}
        {lightParticles.map((p) => (
          <motion.div
            key={`light-${p.id}`}
            className="absolute bg-white rounded-full blur-[4px]"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: p.opacity,
            }}
            initial={{ y: 0, x: 0, opacity: 0 }}
            animate={{
              y: [0, -50, -100],
              x: [0, Math.random() * 20 - 10, Math.random() * 40 - 20],
              opacity: [0, p.opacity, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay,
            }}
          />
        ))}
        {fineDust.map((p) => (
          <motion.div
            key={`fine-${p.id}`}
            className="absolute bg-[#fdfaf6] rounded-full blur-[0.5px]"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: p.opacity,
            }}
            initial={{ x: 0, y: 0, opacity: p.opacity }}
            animate={{
              x: [0, Math.random() * 10 - 5, Math.random() * 20 - 10],
              y: [0, Math.random() * 10 - 5, Math.random() * 20 - 10],
              opacity: [p.opacity, p.opacity * 1.5, p.opacity],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            }}
          />
        ))}
      </motion.div>

      {/* Horizon Glow */}
      <div className="absolute top-[40%] left-0 w-full h-px bg-gradient-to-r from-transparent via-solar-gold/20 to-transparent blur-md" />
    </motion.div>
  );
}
