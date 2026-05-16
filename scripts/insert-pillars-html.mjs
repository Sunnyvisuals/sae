import fs from "node:fs";
import path from "node:path";

const htmlPath = path.resolve("public/parchemin-senac.html");
let html = fs.readFileSync(htmlPath, "utf8");

const d = "di" + "v";
const pillars = `
    <${d} class="senac-scroll-pillars" aria-hidden="true">
      <span class="senac-scroll-pillar-glow senac-scroll-pillar-glow--left"></span>
      <span class="senac-scroll-pillar-glow senac-scroll-pillar-glow--right"></span>
      <span class="senac-scroll-pillar senac-scroll-pillar--left"></span>
      <span class="senac-scroll-pillar senac-scroll-pillar--right"></span>
      <span class="senac-scroll-pillar senac-scroll-pillar--left-inner"></span>
      <span class="senac-scroll-pillar senac-scroll-pillar--right-inner"></span>
      <span class="senac-scroll-pillar-wave senac-scroll-pillar-wave--left"></span>
      <span class="senac-scroll-pillar-wave senac-scroll-pillar-wave--right"></span>
    </${d}>
`;

if (!html.includes("senac-scroll-pillars")) {
  html = html.replace(
    `${d} class="depth-lines" aria-hidden="true"></${d}>`,
    `${d} class="depth-lines" aria-hidden="true"></${d}>${pillars}`,
  );
}

if (!html.includes("parchemin-senac-pillars.css")) {
  html = html.replace(
    "/parchemin-senac-nav-pictos.css",
    "/parchemin-senac-pillars.css?v=1\" />\n    <link rel=\"stylesheet\" href=\"/parchemin-senac-nav-pictos.css",
  );
}

fs.writeFileSync(htmlPath, html, "utf8");
console.log("ok", html.includes("senac-scroll-pillars"));
