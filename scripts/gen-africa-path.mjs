/**
 * Génère le path SVG du continent africain (union pays Natural Earth 110m).
 * Turf v7 : union(FeatureCollection) avec au moins 2 géométries.
 */
import * as turf from '@turf/turf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const url =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';

const gj = await fetch(url).then((r) => r.json());
const african = gj.features
  .filter((f) => f.properties?.REGION_UN === 'Africa' && f.geometry)
  .map((f) => turf.feature(f.geometry));

function unionPair(a, b) {
  if (!a) return b;
  if (!b) return a;
  const u = turf.union(turf.featureCollection([turf.clone(a), turf.clone(b)]));
  return u || a;
}

function unionAll(features) {
  if (features.length === 0) return null;
  if (features.length === 1) return features[0];
  const mid = Math.floor(features.length / 2);
  return unionPair(unionAll(features.slice(0, mid)), unionAll(features.slice(mid)));
}

const merged = unionAll(african);
if (!merged?.geometry) throw new Error('Union Afrique vide');

const simplified = turf.simplify(merged, { tolerance: 0.045, highQuality: true });

const g = simplified.geometry;
let outer = null;
if (g.type === 'Polygon') outer = g.coordinates[0];
else if (g.type === 'MultiPolygon') {
  let best = null;
  let bestA = 0;
  for (const poly of g.coordinates) {
    const ring = poly[0];
    const a = Math.abs(turf.area(turf.polygon([ring], { properties: {} })));
    if (a > bestA) {
      bestA = a;
      best = ring;
    }
  }
  outer = best;
}
if (!outer) throw new Error('Pas de contour extérieur');

const lonMin = -20;
const lonMax = 52;
const latMin = -38;
const latMax = 40;

function project([lon, lat]) {
  const x = ((lon - lonMin) / (lonMax - lonMin)) * 400;
  const y = ((latMax - lat) / (latMax - latMin)) * 400;
  return [x, y];
}

const algLon = 3;
const algLat = 28.2;
const cAfrica = project([algLon, algLat]);
const cDza = [200, 200];
const off = { x: cDza[0] - cAfrica[0], y: cDza[1] - cAfrica[1] };

let d = '';
for (let i = 0; i < outer.length; i++) {
  const [x, y] = project(outer[i]);
  const px = x + off.x;
  const py = y + off.y;
  d += (i === 0 ? 'M ' : ' L ') + px.toFixed(2) + ' ' + py.toFixed(2);
}
d += ' Z';

const out = `/**
 * Contour du continent africain — union des 52 pays (Natural Earth 110m, REGION_UN Africa),
 * simplifié (Turf), projeté dans le repère 0–400 (aligné sur la carte Algérie).
 * Généré par scripts/gen-africa-path.mjs (sortie scripts/africa-continent-path.generated.ts).
 */
export const AFRICA_CONTINENT_PATH =
  '${d.replace(/'/g, "\\'")}';

export const AFRICA_ALIGN_OFFSET = { x: 0, y: 0 } as const;
`;

const target = path.join(root, 'scripts/africa-continent-path.generated.ts');
fs.writeFileSync(target, out, 'utf8');
console.log('Pays:', african.length, 'sommets anneau:', outer.length, 'caractères path:', d.length);
