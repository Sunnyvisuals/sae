import fs from "node:fs";
import path from "node:path";

const htmlPath = path.resolve("public/parchemin-senac.html");
const d = "di" + "v";
const o = "<" + d;
const c = "</" + d;

const axis = `
            ${o} class="senac-panel-stack__axis" aria-hidden="true">
              ${o} class="senac-panel-stack__line">${c}>
              <ol class="senac-panel-stack__chrono">
                <li class="senac-panel-stack__node is-active" data-panel-index="0">
                  <span class="senac-panel-stack__node-pin"></span>
                  <span class="senac-panel-stack__node-date" data-i18n="panel_stack_date_1">1949</span>
                </li>
                <li class="senac-panel-stack__node" data-panel-index="1">
                  <span class="senac-panel-stack__node-pin"></span>
                  <span class="senac-panel-stack__node-date" data-i18n="panel_stack_date_2">1950</span>
                </li>
                <li class="senac-panel-stack__node" data-panel-index="2">
                  <span class="senac-panel-stack__node-pin"></span>
                  <span class="senac-panel-stack__node-date" data-i18n="panel_stack_date_3">1955</span>
                </li>
                <li class="senac-panel-stack__node" data-panel-index="3">
                  <span class="senac-panel-stack__node-pin"></span>
                  <span class="senac-panel-stack__node-date" data-i18n="panel_stack_date_4">1960</span>
                </li>
                <li class="senac-panel-stack__node" data-panel-index="4">
                  <span class="senac-panel-stack__node-pin"></span>
                  <span class="senac-panel-stack__node-date" data-i18n="panel_stack_date_5">Suite</span>
                </li>
              </ol>
            ${c}>
`;

let html = fs.readFileSync(htmlPath, "utf8");
const needle = `${o} class="senac-panel-stack__pin">\r\n            ${o} class="senac-panel-stack__stage">`;
const needleLf = needle.replace(/\r\n/g, "\n");
if (!html.includes(needle) && !html.includes(needleLf)) {
  console.error("needle not found");
  process.exit(1);
}
html = html.replace(needle, `${o} class="senac-panel-stack__pin">${axis}\n            ${o} class="senac-panel-stack__stage">`);
html = html.replace(needleLf, `${o} class="senac-panel-stack__pin">${axis}\n            ${o} class="senac-panel-stack__stage">`);
fs.writeFileSync(htmlPath, html, "utf8");
console.log("axis inserted");
