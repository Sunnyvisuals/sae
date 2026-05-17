/**
 * Répare le fallback UTF-8 de parchemin-senac.html depuis static-i18n.js (FR).
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const i18nPath = path.join(root, "public/static-i18n.js");
const htmlPath = path.join(root, "public/parchemin-senac.html");

const code = fs.readFileSync(i18nPath, "utf8");
const frBlock = code.match(/fr:\s*\{([\s\S]*?)\n    \},\n    ar:\s*\{/);
if (!frBlock) {
  console.error("FR block not found");
  process.exit(1);
}

const fr = {};
const re = /^\s+([a-z0-9_]+):\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)')/gm;
let m;
const body = frBlock[1];
while ((m = re.exec(body)) !== null) {
  const val = (m[2] ?? m[3] ?? "").replace(/\\n/g, "\n").replace(/\\'/g, "'");
  fr[m[1]] = val;
}

let html = fs.readFileSync(htmlPath, "utf8");

html = html.replace(
  /<title>[^<]*<\/title>/,
  `<title>${fr.doc_title} - Frise Jean Sénac</title>`,
);

for (const [key, value] of Object.entries(fr)) {
  if (!value || key.startsWith("js_")) continue;
  const esc = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  html = html.replace(
    new RegExp(`(data-i18n="${key}"[^>]*>)[\\s\\S]*?(</)`, "g"),
    `$1${value}$2`,
  );
  html = html.replace(
    new RegExp(`(data-i18n-html="${key}"[^>]*>)[\\s\\S]*?(</)`, "g"),
    `$1${value}$2`,
  );
  const attr = value.replace(/"/g, "&quot;");
  html = html.replace(
    new RegExp(`(data-i18n-alt="${key}"[^>]*alt=")[^"]*(")`, "g"),
    `$1${attr}$2`,
  );
  html = html.replace(
    new RegExp(`(data-i18n-aria="${key}"[^>]*aria-label=")[^"]*(")`, "g"),
    `$1${attr}$2`,
  );
}

html = html.replace(/pilote[^\s<]*/g, "piloté par JS");
html = html.replace(/\uFFFD/g, "");

const remaining = (html.match(/\uFFFD/g) || []).length;
fs.writeFileSync(htmlPath, html, "utf8");
console.log(`Keys: ${Object.keys(fr).length}, remaining U+FFFD: ${remaining}`);
