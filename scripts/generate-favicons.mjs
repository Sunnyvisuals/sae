/**
 * Génère les tailles attendues par Google Search (≥48px) et favicon.ico à la racine.
 * Source : public/favicon-camel-solar.png
 */
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const src = join(root, "favicon-camel-solar.png");
const bg = "#05080f";

const buf48 = await sharp(src).resize(48, 48, { fit: "contain", background: bg }).png().toBuffer();
const buf192 = await sharp(src).resize(192, 192, { fit: "contain", background: bg }).png().toBuffer();
const buf180 = await sharp(src).resize(180, 180, { fit: "contain", background: bg }).png().toBuffer();
const buf32 = await sharp(src).resize(32, 32, { fit: "contain", background: bg }).png().toBuffer();

const srcNight = join(root, "favicon-camel.png");
const buf48Night = await sharp(srcNight).resize(48, 48, { fit: "contain", background: bg }).png().toBuffer();

await writeFile(join(root, "favicon-48.png"), buf48);
await writeFile(join(root, "favicon-48-night.png"), buf48Night);
await writeFile(join(root, "favicon-192.png"), buf192);
await writeFile(join(root, "apple-touch-icon.png"), buf180);
await writeFile(join(root, "favicon-32.png"), buf32);

const ico = await pngToIco([buf48, buf32]);
await writeFile(join(root, "favicon.ico"), ico);

console.log("OK: favicon.ico, favicon-48.png, favicon-48-night.png, favicon-192.png, apple-touch-icon.png");
