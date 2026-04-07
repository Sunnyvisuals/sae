import { motion, useTransform, useSpring, AnimatePresence } from "motion/react";
import { useRef, useState, useEffect } from "react";
import { usePosterizedScroll } from "./Posterize";

const JOURNEY_DATA = [
  {
    year: "1926",
    title: "L'Aube à Béni Saf",
    text: "Jean Sénac naît dans une Algérie coloniale, au bord de la mer Méditerranée. C'est ici que son amour pour le soleil et l'azur prend racine.",
    image: "https://picsum.photos/seed/beni-saf/800/600",
    icon: "✦",
    crystalColor: "#c5a059"
  },
  {
    year: "1954",
    title: "Le Cri de Justice",
    text: "Le poète s'engage corps et âme pour l'indépendance de l'Algérie. Il refuse d'être un étranger sur sa propre terre.",
    image: "https://picsum.photos/seed/algeria-war/800/600",
    icon: "✧",
    crystalColor: "#e67e22"
  },
  {
    year: "1962",
    title: "Le Retour au Port",
    text: "Après l'indépendance, il revient à Alger. Il devient le 'Poète de la Joie' et anime des émissions de radio pour la jeunesse.",
    image: "https://picsum.photos/seed/alger-port/800/600",
    icon: "✦",
    crystalColor: "#3498db"
  },
  {
    year: "1973",
    title: "L'Étoile Assassinée",
    text: "Sénac est assassiné dans sa 'Cave à Poèmes'. Sa voix s'éteint, mais son héritage solaire demeure éternel.",
    image: "https://picsum.photos/seed/poet-cave/800/600",
    icon: "✧",
    crystalColor: "#e74c3c"
  }
];

export default function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollYProgress = usePosterizedScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  }, 12); // 12fps look for scroll-based animations

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section ref={containerRef} className="relative w-full bg-transparent pt-32 pb-64 overflow-hidden">
      {/* GENSHIN UI OVERLAYS */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Ornate Corners */}
        <div className="absolute top-8 left-8 w-32 h-32 border-t-2 border-l-2 border-solar-gold/30 rounded-tl-3xl" />
        <div className="absolute top-8 right-8 w-32 h-32 border-t-2 border-r-2 border-solar-gold/30 rounded-tr-3xl" />
        <div className="absolute bottom-8 left-8 w-32 h-32 border-b-2 border-l-2 border-solar-gold/30 rounded-bl-3xl" />
        <div className="absolute bottom-8 right-8 w-32 h-32 border-b-2 border-r-2 border-solar-gold/30 rounded-br-3xl" />
        
        {/* Vertical Scroll Indicator - Genshin Style */}
        <div className="absolute left-1/2 -translate-x-1/2 top-32 bottom-32 w-px bg-gradient-to-b from-transparent via-solar-gold/20 to-transparent">
          <motion.div 
            style={{ scaleY: smoothProgress }}
            className="w-full h-full bg-solar-gold origin-top shadow-[0_0_20px_rgba(197,160,89,0.5)]"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-20">
        <div className="flex flex-col items-center mb-64 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <span className="text-solar-gold tracking-[1em] text-xs uppercase mb-6 font-light block">
              Chroniques d'un Poète Solaire
            </span>
            <h2 className="text-6xl md:text-9xl font-serif text-white italic tracking-tighter drop-shadow-[0_0_30px_rgba(197,160,89,0.3)]">
              Le Voyage de Sénac
            </h2>
            
            {/* Ornate Underline */}
            <div className="flex items-center justify-center gap-4 mt-12">
              <div className="h-px w-32 bg-gradient-to-r from-transparent to-solar-gold/40" />
              <div className="w-4 h-4 border border-solar-gold rotate-45 flex items-center justify-center">
                <div className="w-1 h-1 bg-solar-gold rounded-full" />
              </div>
              <div className="h-px w-32 bg-gradient-to-l from-transparent to-solar-gold/40" />
            </div>
          </motion.div>
        </div>

        <div className="space-y-[50vh]">
          {JOURNEY_DATA.map((item, index) => (
            <TimelineItem key={index} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineItem({ item, index }: { item: typeof JOURNEY_DATA[0], index: number }) {
  const isEven = index % 2 === 0;
  const ref = useRef(null);
  const scrollYProgress = usePosterizedScroll({
    target: ref,
    offset: ["start end", "end start"]
  }, 12);

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8]);

  return (
    <motion.div 
      ref={ref}
      style={{ y, opacity, scale }}
      className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-16 lg:gap-32 items-center`}
    >
      {/* Image Side - Genshin Frame */}
      <div className="flex-1 relative group">
        <div className="relative p-2 border border-solar-gold/20 bg-black/40 backdrop-blur-md shadow-2xl overflow-hidden">
          {/* Ornate Frame Corners */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-solar-gold" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-solar-gold" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-solar-gold" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-solar-gold" />
          
          <div className="aspect-[4/3] overflow-hidden relative">
            <motion.img 
              src={item.image} 
              alt={item.title}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 5, ease: "easeOut" }}
              className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-110 transition-all duration-[2s]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-solar-brown/20 mix-blend-overlay" />
            
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%]" />
          </div>
        </div>
        
        {/* Floating Year Label */}
        <div className={`absolute -top-8 ${isEven ? '-right-8' : '-left-8'} z-20`}>
          <div className="bg-solar-gold px-6 py-2 rotate-[-5deg] shadow-[0_0_20px_rgba(197,160,89,0.4)]">
            <span className="text-solar-brown font-serif text-2xl italic font-bold">
              {item.year}
            </span>
          </div>
        </div>
      </div>

      {/* Text Side - Genshin UI Style */}
      <div className="flex-1 space-y-10">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 border border-solar-gold rotate-45 flex items-center justify-center bg-solar-gold/10">
            <span className="text-solar-gold text-xl -rotate-45">{item.icon}</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-solar-gold/40 to-transparent" />
        </div>
        
        <div className="space-y-6">
          <h3 className="text-4xl md:text-6xl font-serif text-white tracking-tight leading-tight uppercase drop-shadow-[0_0_15px_rgba(197,160,89,0.2)]">
            {item.title}
          </h3>
          <div className="w-16 h-1 bg-solar-gold/60" />
        </div>

        <p className="text-solar-gold/80 text-2xl leading-relaxed font-light italic font-serif">
          "{item.text}"
        </p>

        {/* Action Button - Genshin Style */}
        <motion.button
          whileHover={{ x: 10 }}
          className="flex items-center gap-4 text-solar-gold group"
        >
          <span className="text-[10px] uppercase tracking-[0.4em] font-light group-hover:text-white transition-colors">Explorer la mémoire</span>
          <div className="w-8 h-px bg-solar-gold/40 group-hover:w-16 group-hover:bg-solar-gold transition-all duration-500" />
        </motion.button>
      </div>
    </motion.div>
  );
}
