import fs from "node:fs";
import path from "node:path";

const d = "di" + "v";
const o = "<" + d;
const c = "</" + d;
const htmlPath = path.resolve("public/parchemin-senac.html");

const block = `
      ${o} class="senac-scroll-glyphs" aria-hidden="true">
        ${o} class="senac-scroll-glyphs__layer senac-scroll-glyphs__layer--veils">${c}
        ${o} class="senac-scroll-glyphs__layer senac-scroll-glyphs__layer--threads">${c}
        ${o} class="senac-scroll-glyphs__layer senac-scroll-glyphs__layer--marks">${c}
        ${o} class="senac-scroll-glyphs__layer senac-scroll-glyphs__layer--arcs">${c}
        <span class="senac-scroll-glyphs__spark senac-scroll-glyphs__spark--1"></span>
        <span class="senac-scroll-glyphs__spark senac-scroll-glyphs__spark--2"></span>
        <span class="senac-scroll-glyphs__spark senac-scroll-glyphs__spark--3"></span>
        <span class="senac-scroll-glyphs__spark senac-scroll-glyphs__spark--4"></span>
        <span class="senac-scroll-glyphs__spark senac-scroll-glyphs__spark--5"></span>
        <span class="senac-scroll-glyphs__spark senac-scroll-glyphs__spark--6"></span>
      ${c}
`;

let html = fs.readFileSync(htmlPath, "utf8");
if (html.includes("senac-scroll-glyphs")) {
  html = html.replace(/<div class="senac-scroll-glyphs"[\s\S]*?<\/main class="chapter chapter-two">/m, "");
  html = html.replace(
    /<main class="chapter chapter-two">\s*<header class="hero"/,
    `<main class="chapter chapter-two">${block}\n      <header class="hero"`,
  );
} else {
  html = html.replace(
    /<main class="chapter chapter-two">\s*<header class="hero"/,
    `<main class="chapter chapter-two">${block}\n      <header class="hero"`,
  );
}
if (!html.includes("parchemin-senac-glyphs.css")) {
  html = html.replace(
    "parchemin-senac-panel-stack.css",
    'parchemin-senac-glyphs.css?v=1" />\n    <link rel="stylesheet" href="/parchemin-senac-panel-stack.css',
  );
  html = html.replace(
    '<link rel="stylesheet" href="/parchemin-senac-panel-stack.css',
    '<link rel="stylesheet" href="/parchemin-senac-glyphs.css?v=1" />\n    <link rel="stylesheet" href="/parchemin-senac-panel-stack.css',
  );
}
fs.writeFileSync(htmlPath, html, "utf8");
console.log("glyphs html ok", html.includes("senac-scroll-glyphs"));
