import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const didyou = path.join(root, "public", "parchemin-senac-didyouknow.css");
let css = fs.readFileSync(didyou, "utf8");

css = css.replace(
  `body.senac-reading-flow #timeline-start.timeline.senac-constellation-track > .senac-scene.quote-break--one-line {
  align-items: center;
  justify-content: center;
  justify-items: center;
  text-align: center;
}`,
  `body.senac-reading-flow #timeline-start.timeline.senac-constellation-track > .senac-scene.quote-break--one-line {
  align-items: center;
  justify-content: center;
  justify-items: center;
  text-align: center;
  padding-inline: max(var(--senac-fact-pad), env(safe-area-inset-left, 0px))
    max(var(--senac-fact-pad), env(safe-area-inset-right, 0px));
}`,
);

css = css.replace(
  `body.senac-reading-flow .quote-break--one-line .senac-quote-stack {
  position: relative;
  left: 50%;
  transform: translateX(-50%);
  width: fit-content;
  max-width: min(92vw, 42rem);
  margin: 0;
  justify-self: center;
  align-self: center;
  text-align: center;
}`,
  `body.senac-reading-flow .quote-break--one-line .senac-quote-stack {
  position: relative;
  left: auto;
  right: auto;
  transform: none;
  width: fit-content;
  max-width: min(92vw, 42rem);
  margin-inline: auto;
  justify-self: center;
  align-self: center;
  text-align: center;
}`,
);

fs.writeFileSync(didyou, css);

const reading = path.join(root, "public", "parchemin-senac-reading-flow.css");
let rf = fs.readFileSync(reading, "utf8");
const anchor = `body.senac-reading-flow #timeline-start.timeline.senac-constellation-track > .senac-scene {
  align-items: stretch;
  justify-content: center;
  text-align: start;
  padding-inline: 0;
}`;

const extra = `

body.senac-reading-flow #timeline-start.timeline.senac-constellation-track > .senac-scene.quote-break--one-line {
  align-items: center;
  justify-items: center;
  text-align: center;
}`;

if (!rf.includes("> .senac-scene.quote-break--one-line")) {
  if (!rf.includes(anchor)) throw new Error("reading-flow anchor missing");
  rf = rf.replace(anchor, anchor + extra);
  fs.writeFileSync(reading, rf);
}

const htmlPath = path.join(root, "public", "parchemin-senac.html");
let html = fs.readFileSync(htmlPath, "utf8");
html = html.replace(
  "parchemin-senac-didyouknow.css?v=34",
  "parchemin-senac-didyouknow.css?v=35",
);
html = html.replace(
  "parchemin-senac-reading-flow.css?v=32",
  "parchemin-senac-reading-flow.css?v=33",
);
fs.writeFileSync(htmlPath, html);

const verPath = path.join(root, "src", "lib", "parcheminAssetVersion.ts");
let ver = fs.readFileSync(verPath, "utf8");
ver = ver.replace("v=176", "v=177");
fs.writeFileSync(verPath, ver);

console.log("quote center fix applied");
