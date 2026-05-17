/**
 * Favicons Yaya (l1.grphx)
 * - Mode clair : favicon-yaya-white.svg → fond transparent
 * - Mode nuit : favicon-yaya-dark.svg → fond #35363a
 */
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const srcLight = join(root, "favicon-yaya-white.svg");
const srcDark = join(root, "favicon-yaya-dark.svg");
const BG_DARK = "#35363a";
const DENSITY = 400;

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

/** Rogne le viewBox portrait puis centre dans un carré (plus de bandes latérales). */
async function rasterIcon(svgPath, size, background) {
  const trimmed = await sharp(svgPath, { density: DENSITY }).trim({ threshold: 8 }).png().toBuffer();
  return sharp(trimmed)
    .resize(size, size, { fit: "contain", background })
    .png()
    .toBuffer();
}

const buf48Light = await rasterIcon(srcLight, 48, transparent);
const buf192Light = await rasterIcon(srcLight, 192, transparent);
const buf32Light = await rasterIcon(srcLight, 32, transparent);
const buf48Dark = await rasterIcon(srcDark, 48, BG_DARK);
const buf192Dark = await rasterIcon(srcDark, 192, BG_DARK);
const buf180Dark = await rasterIcon(srcDark, 180, BG_DARK);

await writeFile(join(root, "favicon-48.png"), buf48Light);
await writeFile(join(root, "favicon-48-night.png"), buf48Dark);
await writeFile(join(root, "favicon-192.png"), buf192Light);
await writeFile(join(root, "favicon-192-night.png"), buf192Dark);
await writeFile(join(root, "favicon-32.png"), buf32Light);
await writeFile(join(root, "apple-touch-icon.png"), buf180Dark);

const ico = await pngToIco([buf48Light, buf32Light]);
await writeFile(join(root, "favicon.ico"), ico);

console.log("OK: light=transparent, dark=#35363a, ico=light, apple-touch=dark");
