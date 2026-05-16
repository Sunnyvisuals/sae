import fs from "node:fs";
import path from "node:path";

const htmlPath = path.resolve("public/parchemin-senac.html");
let html = fs.readFileSync(htmlPath, "utf8");

html = html.replace(/\s*<section id="senac-panel-stack"[\s\S]*?<\/section>\s*/m, "\n\n        ");

html = html.replace(
  /\s*<link rel="stylesheet" href="\/parchemin-senac-panel-stack\.css\?v=\d+" \/>\s*/,
  "\n    ",
);

fs.writeFileSync(htmlPath, html, "utf8");
console.log("panel stack removed", !html.includes("senac-panel-stack"));
