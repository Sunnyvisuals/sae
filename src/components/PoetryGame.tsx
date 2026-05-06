import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IconRefreshCw, IconSparkles, IconX } from "./ui/icons";
import { useAppCopy } from "../hooks/useAppCopy";

interface PoetryGameProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PoetryGame({ isOpen, onClose }: PoetryGameProps) {
  const copy = useAppCopy();
  const poems = copy.poetryLevels;
  const [currentLevel, setCurrentLevel] = useState(0);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const poem = poems[currentLevel]!;

  useEffect(() => {
    if (isOpen) {
      setSlots(new Array(poem.missing.length).fill(null));
      setShowSuccess(false);
    }
  }, [isOpen, currentLevel, poem]);

  const handleDrop = (word: string, index: number) => {
    const newSlots = [...slots];
    newSlots[index] = word;
    setSlots(newSlots);

    if (newSlots.every((s, i) => s === poem.missing[i])) {
      setTimeout(() => setShowSuccess(true), 500);
    }
  };

  const resetLevel = () => {
    setSlots(new Array(poem.missing.length).fill(null));
    setShowSuccess(false);
  };

  const nextLevel = () => {
    if (currentLevel < poems.length - 1) {
      setCurrentLevel((prev) => prev + 1);
    } else {
      setCurrentLevel(0);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#06040a]/92 backdrop-blur-xl p-4"
      >
        <motion.div
          initial={{ scale: 0.96, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.96, y: 24, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 140 }}
          className="relative w-full max-w-2xl overflow-hidden border border-solar-gold/25 bg-black/55 p-8 shadow-[0_0_60px_rgba(0,0,0,0.6)] md:p-14"
          style={{ borderRadius: "1.25rem" }}
        >
          {/* Cadre type cinéma / Al-Rihla */}
          <div className="pointer-events-none absolute inset-3 border border-solar-gold/10" />
          <div className="pointer-events-none absolute left-5 top-5 h-4 w-4 border-l border-t border-solar-gold/30" />
          <div className="pointer-events-none absolute right-5 top-5 h-4 w-4 border-r border-t border-solar-gold/30" />
          <div className="pointer-events-none absolute bottom-5 left-5 h-4 w-4 border-b border-l border-solar-gold/30" />
          <div className="pointer-events-none absolute bottom-5 right-5 h-4 w-4 border-b border-r border-solar-gold/30" />
          <div className="pointer-events-none absolute -inset-px bg-gradient-to-b from-solar-gold/[0.03] via-transparent to-transparent" />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="absolute right-5 top-5 z-10 text-solar-gold/50 transition-colors hover:text-solar-gold"
            aria-label={copy.poetry.ariaClose}
          >
            <IconX width={20} height={20} />
          </motion.button>

          <div className="relative mb-12 text-center">
            <span className="mb-3 block text-[9px] font-light uppercase tracking-[0.55em] text-solar-gold/45">
              {copy.poetry.fragment(currentLevel + 1, poems.length)}
            </span>
            <h3 className="font-bahlull text-3xl italic text-white drop-shadow-[0_0_20px_rgba(197,160,89,0.15)] md:text-4xl">
              {copy.poetry.rebuildVerse}
            </h3>
            <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-solar-gold/40 to-transparent" />
          </div>

          <div className="relative mb-14 flex min-h-[100px] flex-wrap items-center justify-center gap-x-3 gap-y-6">
            {poem.text.split(" ").map((word, i) => {
              const cleanWord = word.replace(/[.,]/g, "");
              const missingIndex = poem.missing.indexOf(cleanWord);

              if (missingIndex !== -1) {
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.04 }}
                    className={`relative flex h-12 min-w-[100px] items-center justify-center border-b-2 px-4 transition-all duration-500 ${
                      slots[missingIndex]
                        ? "border-solar-gold/80 text-solar-gold"
                        : "border-solar-gold/15 text-transparent"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {slots[missingIndex] ? (
                        <motion.span
                          key="word"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-lg font-medium tracking-tight"
                        >
                          {slots[missingIndex]}
                        </motion.span>
                      ) : (
                        <motion.span
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.35 }}
                          className="text-[9px] uppercase tracking-[0.35em] text-solar-gold/30"
                        >
                          {' - '}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              }
              return (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.85 }}
                  transition={{ delay: 0.25 + i * 0.04 }}
                  className="font-serif text-xl font-light text-white/85 md:text-2xl"
                >
                  {word}
                </motion.span>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4"
          >
            {poem.options.map((option, i) => {
              const isUsed = slots.includes(option);
              return (
                <motion.button
                  key={i}
                  whileHover={!isUsed ? { y: -2 } : {}}
                  whileTap={!isUsed ? { scale: 0.98 } : {}}
                  disabled={isUsed}
                  onClick={() => {
                    const firstEmpty = slots.indexOf(null);
                    if (firstEmpty !== -1) handleDrop(option, firstEmpty);
                  }}
                  className={`py-3.5 px-4 text-center text-[10px] uppercase tracking-[0.28em] transition-all duration-500 ${
                    isUsed
                      ? "cursor-default border border-transparent text-solar-gold/20 opacity-35"
                      : "border border-solar-gold/25 bg-black/30 text-solar-gold hover:border-solar-gold/55 hover:bg-solar-gold/5"
                  }`}
                  style={{ borderRadius: "2px" }}
                >
                  {option}
                </motion.button>
              );
            })}
          </motion.div>

          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetLevel}
              className="flex items-center gap-2 text-[9px] uppercase tracking-[0.35em] text-solar-gold/35 transition-colors hover:text-solar-gold"
            >
              <IconRefreshCw width={12} height={12} /> {copy.poetry.reset}
            </motion.button>
          </div>

          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#06040a]/96 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 16 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 22, stiffness: 120 }}
                  className="flex max-w-sm flex-col items-center px-8 text-center"
                >
                  <div className="relative mb-8 flex h-16 w-16 rotate-45 items-center justify-center border border-solar-gold/40 bg-solar-gold/10 shadow-[0_0_28px_rgba(197,160,89,0.2)]">
                    <div className="-rotate-45">
                      <IconSparkles className="h-7 w-7 text-solar-gold" />
                    </div>
                  </div>

                  <h4 className="font-bahlull text-4xl italic text-white md:text-5xl">
                    {copy.poetry.successTitle}
                  </h4>
                  <p className="mb-10 mt-4 text-[10px] leading-relaxed tracking-[0.35em] text-solar-gold/55">
                    {copy.poetry.successBody}
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextLevel}
                    className="w-full border border-solar-gold/50 bg-solar-gold/90 py-4 text-[9px] font-semibold uppercase tracking-[0.4em] text-solar-brown shadow-[0_0_24px_rgba(197,160,89,0.25)] transition-colors hover:bg-solar-gold"
                    style={{ borderRadius: "2px" }}
                  >
                    {currentLevel < poems.length - 1 ? copy.poetry.nextFragment : copy.poetry.backToJourney}
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
