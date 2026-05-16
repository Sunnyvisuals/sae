import fs from "node:fs";
import path from "node:path";

const tag = "di" + "v";
const o = "<" + tag;
const c = "</" + tag;

const html = `
        <section id="senac-panel-stack" class="senac-panel-stack" data-i18n-aria="panel_stack_aria" aria-label="Traversée en plein écran">
          ${o} class="senac-panel-stack__pin">
            ${o} class="senac-panel-stack__stage">
              <article class="senac-panel senac-panel--1">
                ${o} class="senac-panel__outer">${o} class="senac-panel__inner">
                  ${o} class="senac-panel__bg">
                    <h2 class="senac-panel__heading" data-i18n="panel_stack_1">Les dates deviennent constellations</h2>
                  ${c}>
                ${c}>${c}>
              </article>
              <article class="senac-panel senac-panel--2">
                ${o} class="senac-panel__outer">${o} class="senac-panel__inner">
                  ${o} class="senac-panel__bg">
                    <h2 class="senac-panel__heading" data-i18n="panel_stack_2">Alger, la mer, les langues</h2>
                  ${c}>
                ${c}>${c}>
              </article>
              <article class="senac-panel senac-panel--3">
                ${o} class="senac-panel__outer">${o} class="senac-panel__inner">
                  ${o} class="senac-panel__bg">
                    <h2 class="senac-panel__heading" data-i18n="panel_stack_3">La jeunesse allume la nuit</h2>
                  ${c}>
                ${c}>${c}>
              </article>
              <article class="senac-panel senac-panel--4">
                ${o} class="senac-panel__outer">${o} class="senac-panel__inner">
                  ${o} class="senac-panel__bg">
                    <h2 class="senac-panel__heading" data-i18n="panel_stack_4">Écrire contre l'ombre</h2>
                  ${c}>
                ${c}>${c}>
              </article>
              <article class="senac-panel senac-panel--5">
                ${o} class="senac-panel__outer">${o} class="senac-panel__inner">
                  ${o} class="senac-panel__bg">
                    <h2 class="senac-panel__heading" data-i18n="panel_stack_5">Poursuis la traversée</h2>
                  ${c}>
                ${c}>${c}>
              </article>
            ${c}>
          ${c}>
        </section>
`;

const out = path.resolve("public/_panel-stack-snippet.html");
fs.writeFileSync(out, html, "utf8");
console.log("ok", html.includes("<div"));
