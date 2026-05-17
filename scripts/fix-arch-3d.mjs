import fs from "node:fs";
import path from "node:path";
const root = path.resolve(".");
const jsPath = path.join(root, "public", "parchemin-senac.js");
let js = fs.readFileSync(jsPath, "utf8");

if (!js.includes("function senacArchModelUrl()")) {
  js = js.replace(
    "  let senacArchInitScheduled = false;",
    `  let senacArchInitScheduled = false;

  function senacArchModelUrl() {
    const pathSeg = window.location.pathname.replace(/[^/]+$/, "");
    const base = pathSeg.endsWith("/") ? pathSeg : pathSeg + "/";
    return new URL("models/model.glb", window.location.origin + base).href;
  }`,
  );
  js = js.replace(
    'modelUrl: new URL("models/model.glb", window.location.href).href,',
    "modelUrl: senacArchModelUrl(),",
  );
}

const bootAnchor = `  initAtmosphereCanvas();
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => scheduleSenacArchScene(), { timeout: 2400 });
  } else {
    setTimeout(() => scheduleSenacArchScene(), 500);
  }
  initSenacGlyphDust();`;

const bootNew = `  initAtmosphereCanvas();
  void scheduleSenacArchScene();
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => scheduleSenacArchScene(), { timeout: 1200 });
  } else {
    setTimeout(() => scheduleSenacArchScene(), 300);
  }
  initSenacGlyphDust();`;

if (js.includes(bootAnchor)) {
  js = js.replace(bootAnchor, bootNew);
}

js = js.replace(
  "import(\"./parchemin-arch-scene.mjs?v=42\")",
  "import(\"./parchemin-arch-scene.mjs?v=43\")",
);

fs.writeFileSync(jsPath, js, "utf8");

for (const f of ["public/parchemin-senac.css", "public/parchemin-senac-stellar.css"]) {
  let css = fs.readFileSync(path.join(root, f), "utf8");
  const re = /#senac-arch-canvas \{[^}]*z-index: 7;/;
  if (re.test(css)) {
    css = css.replace(/#senac-arch-canvas \{([^}]*?)z-index: 7;/, "#senac-arch-canvas {$1z-index: 8;");
    fs.writeFileSync(path.join(root, f), css, "utf8");
    console.log("z-index bump in", f);
  }
}

let html = fs.readFileSync(path.join(root, "public/parchemin-senac.html"), "utf8");
html = html.replace("parchemin-senac.js?v=126", "parchemin-senac.js?v=127");
fs.writeFileSync(path.join(root, "public/parchemin-senac.html"), html, "utf8");

let ver = fs.readFileSync(path.join(root, "src/lib/parcheminAssetVersion.ts"), "utf8");
if (!ver.includes("v=175")) ver = ver.replace("v=174", "v=175");
fs.writeFileSync(path.join(root, "src/lib/parcheminAssetVersion.ts"), ver, "utf8");

console.log("ok", js.includes("senacArchModelUrl"), js.includes("void scheduleSenacArchScene()"));
