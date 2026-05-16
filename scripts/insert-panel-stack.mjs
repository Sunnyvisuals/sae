import fs from "node:fs";
import path from "node:path";

const root = path.resolve("public");
const htmlPath = path.join(root, "parchemin-senac.html");
const snippetPath = path.join(root, "_panel-stack-snippet.html");

let html = fs.readFileSync(htmlPath, "utf8");
const snippet = fs.readFileSync(snippetPath, "utf8").trimStart();

if (html.includes('id="senac-panel-stack"')) {
  console.log("panel stack already present");
  process.exit(0);
}

const tag = "di" + "v";
const marker =
  "</section>\n\n\n        <article class=\"story-card story-card--right\" data-reveal>\n          <" +
  tag +
  ' class="date-ghost date-ghost--word" data-i18n="ghost_corps">Corps</' +
  tag +
  ">";

const idx = html.indexOf(marker);
if (idx === -1) {
  const idxCrlf = html.indexOf(marker.replace(/\n/g, "\r\n"));
  if (idxCrlf === -1) {
    console.error("anchor not found");
    process.exit(1);
  }
  const replacement =
    "</section>\r\n\r\n" +
    snippet.replace(/\n/g, "\r\n") +
    "\r\n        <article class=\"story-card story-card--right\" data-reveal>\n          <" +
    tag +
    ' class="date-ghost date-ghost--word" data-i18n="ghost_corps">Corps</' +
    tag +
    ">";
  html =
    html.slice(0, idxCrlf) +
    replacement +
    html.slice(idxCrlf + marker.replace(/\n/g, "\r\n").length);
} else {
  const replacement =
    "</section>\n\n" +
    snippet +
    "\n        <article class=\"story-card story-card--right\" data-reveal>\n          <" +
    tag +
    ' class="date-ghost date-ghost--word" data-i18n="ghost_corps">Corps</' +
    tag +
    ">";
  html = html.slice(0, idx) + replacement + html.slice(idx + marker.length);
}

if (!html.includes('href="/parchemin-senac-panel-stack.css')) {
  html = html.replace(
    '<link rel="stylesheet" href="/parchemin-senac-observatory.css?v=5" />',
    '<link rel="stylesheet" href="/parchemin-senac-observatory.css?v=5" />\r\n    <link rel="stylesheet" href="/parchemin-senac-panel-stack.css?v=1" />',
  );
}

html = html.replace("/parchemin-senac.js?v=74", "/parchemin-senac.js?v=75");

fs.writeFileSync(htmlPath, html, "utf8");
console.log("inserted panel stack");
