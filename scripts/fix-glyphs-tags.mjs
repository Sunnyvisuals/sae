import fs from "node:fs";
import path from "node:path";

const htmlPath = path.resolve("public/parchemin-senac.html");
let html = fs.readFileSync(htmlPath, "utf8");

html = html.replace(/<\/?motion\b/gi, (m) => m.replace(/motion/i, "div"));

html = html.replace(
  /(<link rel="stylesheet" href="\/parchemin-senac-glyphs\.css\?v=1" \/>\s*)+/,
  '<link rel="stylesheet" href="/parchemin-senac-glyphs.css?v=1" />\n    ',
);

fs.writeFileSync(htmlPath, html, "utf8");
const bad = html.match(/<\/?motion\b/i);
console.log(bad ? "still broken" : "fixed", bad);
