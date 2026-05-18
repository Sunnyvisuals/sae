import type { ConstellationStarRow } from "./act3ConstellationApi";
import {
  ACT3_CONSTELLATION_WORDS,
  act3WordFloatLayout,
  type Act3ConstellationWord,
} from "./act3ConstellationWords";

/** Centre de chaque constellation = zone du mot flottant (acte I / sélection). */
export function clusterCenterForMot(mot: string): { x: number; y: number } {
  const idx = (ACT3_CONSTELLATION_WORDS as readonly string[]).indexOf(mot);
  if (idx >= 0) {
    const { x, y } = act3WordFloatLayout(idx);
    return { x: x / 100, y: y / 100 };
  }
  return starPositionFromId(mot);
}

/** Position stable d’une étoile (repli si pas de liste complète). */
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

/** Une position par étoile : groupe par mot Sénac → vraie constellation. */
export function layoutConstellationPositions(
  stars: ConstellationStarRow[],
): Map<string, { x: number; y: number }> {
  const out = new Map<string, { x: number; y: number }>();
  const byMot = new Map<string, ConstellationStarRow[]>();

  for (const s of stars) {
    const list = byMot.get(s.mot) ?? [];
    list.push(s);
    byMot.set(s.mot, list);
  }

  for (const [mot, group] of byMot) {
    const center = clusterCenterForMot(mot);
    const sorted = [...group].sort((a, b) => {
      const t = a.created_at.localeCompare(b.created_at);
      return t !== 0 ? t : a.id.localeCompare(b.id);
    });
    const n = sorted.length;

    sorted.forEach((star, i) => {
      if (n === 1) {
        out.set(star.id, center);
        return;
      }
      const spread = Math.min(0.18, 0.05 + n * 0.016);
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      out.set(star.id, {
        x: center.x + Math.cos(angle) * spread,
        y: center.y + Math.sin(angle) * spread * 0.72,
      });
    });
  }

  return centerConstellationPositions(out);
}

/** Recentre l’ensemble des comètes au milieu du ciel (0.5, 0.5). */
function centerConstellationPositions(
  positions: Map<string, { x: number; y: number }>,
): Map<string, { x: number; y: number }> {
  if (positions.size === 0) return positions;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of positions.values()) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const dx = 0.5 - cx;
  const dy = 0.5 - cy;

  const centered = new Map<string, { x: number; y: number }>();
  for (const [id, p] of positions) {
    centered.set(id, {
      x: clamp01(p.x + dx),
      y: clamp01(p.y + dy),
    });
  }
  return centered;
}

export function starPositionForRow(
  star: ConstellationStarRow,
  allStars: ConstellationStarRow[],
): { x: number; y: number } {
  return layoutConstellationPositions(allStars).get(star.id) ?? clusterCenterForMot(star.mot);
}

function clamp01(v: number): number {
  return Math.max(0.05, Math.min(0.95, v));
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

/** Arêtes de constellation : étoiles reliées au sein du même mot. */
export function constellationEdgesForMot(
  stars: ConstellationStarRow[],
  mot: string,
): [string, string][] {
  const same = stars
    .filter((s) => s.mot === mot)
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  if (same.length < 2) return [];
  const edges: [string, string][] = [];
  for (let i = 0; i < same.length - 1; i++) {
    edges.push([same[i]!.id, same[i + 1]!.id]);
  }
  if (same.length >= 3) {
    edges.push([same[same.length - 1]!.id, same[0]!.id]);
  }
  return edges;
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Relie les amas de mots voisins (une comète par mot → lignes visibles quand même). */
export function constellationBridgeEdges(
  stars: ConstellationStarRow[],
  positions: Map<string, { x: number; y: number }>,
): [string, string][] {
  if (stars.length < 2) return [];

  const byMot = new Map<string, ConstellationStarRow[]>();
  for (const s of stars) {
    const g = byMot.get(s.mot) ?? [];
    g.push(s);
    byMot.set(s.mot, g);
  }

  const reps: { mot: string; id: string; x: number; y: number }[] = [];
  for (const [mot, group] of byMot) {
    const sorted = [...group].sort(
      (a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
    );
    const id = sorted[0]!.id;
    const p = positions.get(id) ?? clusterCenterForMot(mot);
    reps.push({ mot, id, x: p.x, y: p.y });
  }

  if (reps.length < 2) return [];

  const seen = new Set<string>();
  const edges: [string, string][] = [];
  const connected = new Set<string>([reps[0]!.mot]);

  while (connected.size < reps.length) {
    let best: { from: string; to: string; d: number } | null = null;
    for (const a of reps) {
      if (!connected.has(a.mot)) continue;
      for (const b of reps) {
        if (connected.has(b.mot)) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (!best || d < best.d) best = { from: a.id, to: b.id, d };
      }
    }
    if (!best) break;
    const k = edgeKey(best.from, best.to);
    if (!seen.has(k)) {
      seen.add(k);
      edges.push([best.from, best.to]);
    }
    const toMot = reps.find((r) => r.id === best.to)?.mot;
    if (toMot) connected.add(toMot);
  }

  return edges;
}

export type ConstellationEdge = {
  a: string;
  b: string;
  kind: "mot" | "bridge";
};

/** Toutes les lignes à dessiner : même mot (fort) + ponts entre amas (léger). */
export function constellationAllEdges(stars: ConstellationStarRow[]): ConstellationEdge[] {
  if (stars.length < 2) return [];

  const positions = layoutConstellationPositions(stars);
  const seen = new Set<string>();
  const out: ConstellationEdge[] = [];

  const push = (a: string, b: string, kind: ConstellationEdge["kind"]) => {
    const k = edgeKey(a, b);
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ a, b, kind });
  };

  for (const mot of uniqueMots(stars)) {
    for (const [a, b] of constellationEdgesForMot(stars, mot)) {
      push(a, b, "mot");
    }
  }

  for (const [a, b] of constellationBridgeEdges(stars, positions)) {
    push(a, b, "bridge");
  }

  return out;
}

export function uniqueMots(stars: ConstellationStarRow[]): string[] {
  return [...new Set(stars.map((s) => s.mot))];
}

export function isKnownConstellationMot(mot: string): mot is Act3ConstellationWord {
  return (ACT3_CONSTELLATION_WORDS as readonly string[]).includes(mot);
}
