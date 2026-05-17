/** Position stable d’une étoile dans le ciel (0–1). */
export function starPositionFromId(id: string): { x: number; y: number } {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = (h >>> 0) / 4294967295;
  const v = ((h >>> 8) >>> 0) / 4294967295;
  return {
    x: 0.08 + u * 0.84,
    y: 0.1 + v * 0.78,
  };
}

export function starVisualFromPopularity(
  motCount: number,
  maxCount: number,
): { radius: number; opacity: number; glow: number } {
  const t = maxCount > 0 ? motCount / maxCount : 0.35;
  return {
    radius: 2.8 + t * 5.4,
    opacity: 0.58 + t * 0.42,
    glow: 0.4 + t * 0.85,
  };
}
