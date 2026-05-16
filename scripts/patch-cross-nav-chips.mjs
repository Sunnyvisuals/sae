import fs from "node:fs";
import path from "node:path";

const htmlPath = path.resolve("public/parchemin-senac.html");
let html = fs.readFileSync(htmlPath, "utf8");

const re =
  /          <p\r?\n            class="senac-cross-nav__links"[\s\S]*?          <\/p>/;

const d = "di" + "v";
const replacement = `          <p class="senac-cross-nav__lede" data-i18n="cross_nav_lede">La frise commence ici.</p>
          <${d} class="senac-cross-nav-chips" role="group" data-i18n-aria="cross_nav_group_aria" aria-label="Raccourcis vers le prologue et la carte-mémoire">
            <button type="button" class="senac-cross-nav__link" data-senac-navigate="intro-video" data-nav-picto="video">
              <span data-i18n="cross_nav_chip_video">Vidéo d&apos;intro</span>
            </button>
            <button type="button" class="senac-cross-nav__link" data-senac-navigate="act1-map" data-nav-picto="map">
              <span data-i18n="cross_nav_chip_map">Carte-mémoire</span>
            </button>
          </${d}>
          <p class="senac-cross-nav__hint" data-i18n="cross_nav_hint">Acte I déjà parcouru.</p>`;

if (!re.test(html)) {
  console.error("regex miss");
  process.exit(1);
}
html = html.replace(re, replacement);
fs.writeFileSync(htmlPath, html, "utf8");
console.log("ok");
