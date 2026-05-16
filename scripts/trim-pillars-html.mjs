import fs from "node:fs";
import path from "node:path";

const htmlPath = path.resolve("public/parchemin-senac.html");
let html = fs.readFileSync(htmlPath, "utf8");

const d = "di" + "v";
const re = new RegExp(
  `<${d} class="senac-scroll-pillars" aria-hidden="true">[\\s\\S]*?<\\/${d}>`,
);
const replacement = `<${d} class="senac-scroll-pillars" aria-hidden="true">
      <span class="senac-scroll-pillar senac-scroll-pillar--left"></span>
      <span class="senac-scroll-pillar senac-scroll-pillar--right"></span>
    </${d}>`;

html = html.replace(re, replacement);
fs.writeFileSync(htmlPath, html, "utf8");
console.log("ok", !html.includes("pillar-glow"));
