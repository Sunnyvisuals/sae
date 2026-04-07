import { useScroll, useTransform, MotionValue } from "motion/react";
import { useEffect, useState } from "react";

/**
 * A custom hook that returns a "posterized" scroll progress.
 * It maps the continuous scroll value to a stepped value to simulate a lower frame rate.
 */
export function usePosterizedScroll(options: any, fps: number = 12): MotionValue<number> {
  const { scrollYProgress } = useScroll(options);
  
  // We use useTransform to step the value
  // For example, if fps is 12, we want 12 steps per full scroll (0 to 1)
  // Actually, we probably want more steps than just 12. 
  // Let's assume fps means "steps per second" or just "number of steps in the range".
  // If it's for a "look", maybe 24 or 48 steps is better.
  
  const steps = fps * 4; // Arbitrary multiplier to make it feel stepped but still usable
  
  return useTransform(scrollYProgress, (value) => {
    return Math.round(value * steps) / steps;
  });
}
