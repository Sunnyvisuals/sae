import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const appPath = path.join(root, "src/App.tsx");
let app = fs.readFileSync(appPath, "utf8");

if (!app.includes("act2ScrollUiLastAt")) {
  app = app.replace(
    "  const act2ScrollPersistRatioRef = useRef<number | null>(null);",
    `  const act2ScrollPersistRatioRef = useRef<number | null>(null);
  const act2ScrollUiLastAt = useRef(0);
  const act2ScrollUiLastRatio = useRef(-1);`,
  );

  app = app.replace(
    `      if (d?.type === "senac-scroll-progress") {
        const ratio = d.ratio as number;
        if (typeof ratio === "number" && Number.isFinite(ratio)) {
          const clamped = Math.min(1, Math.max(0, ratio));
          setAct2ScrollFillRatio(clamped);
          act2ScrollPersistRatioRef.current = clamped;
          window.clearTimeout(act2ScrollPersistTimerRef.current);
          act2ScrollPersistTimerRef.current = window.setTimeout(() => {
            const r = act2ScrollPersistRatioRef.current;
            if (r == null || !Number.isFinite(r)) return;
            patchActSave((s) => ({
              ...s,
              act2: { ...s.act2, answers: { ...s.act2.answers, scrollRatio: r } },
            }));
          }, 400);
        }
        return;
      }`,
    `      if (d?.type === "senac-scroll-progress") {
        const ratio = d.ratio as number;
        if (typeof ratio === "number" && Number.isFinite(ratio)) {
          const clamped = Math.min(1, Math.max(0, ratio));
          const now = performance.now();
          const delta = Math.abs(clamped - act2ScrollUiLastRatio.current);
          if (delta > 0.0025) {
            if (delta >= 0.02 || now - act2ScrollUiLastAt.current >= 120) {
              act2ScrollUiLastRatio.current = clamped;
              act2ScrollUiLastAt.current = now;
              setAct2ScrollFillRatio(clamped);
            }
          }
          act2ScrollPersistRatioRef.current = clamped;
          window.clearTimeout(act2ScrollPersistTimerRef.current);
          act2ScrollPersistTimerRef.current = window.setTimeout(() => {
            const r = act2ScrollPersistRatioRef.current;
            if (r == null || !Number.isFinite(r)) return;
            patchActSave((s) => ({
              ...s,
              act2: { ...s.act2, answers: { ...s.act2.answers, scrollRatio: r } },
            }));
          }, 400);
        }
        return;
      }`,
  );
  fs.writeFileSync(appPath, app);
  console.log("App.tsx throttled");
}

const splashPath = path.join(root, "src/components/SplashCursor.tsx");
let splash = fs.readFileSync(splashPath, "utf8");
if (!splash.includes("effectivePressureIterations")) {
  splash = splash.replace(
    "    let config = {\n      SIM_RESOLUTION,",
    `    const effectivePressureIterations =
      typeof window !== "undefined" && window.innerWidth < 900 ? Math.min(PRESSURE_ITERATIONS, 14) : PRESSURE_ITERATIONS;

    let config = {\n      SIM_RESOLUTION,`,
  );
  splash = splash.replace(
    "      PRESSURE_ITERATIONS,",
    "      PRESSURE_ITERATIONS: effectivePressureIterations,",
  );
  fs.writeFileSync(splashPath, splash);
  console.log("SplashCursor pressure capped on narrow viewports");
}

const verPath = path.join(root, "src/lib/parcheminAssetVersion.ts");
fs.writeFileSync(verPath, 'export const PARCHEMIN_STATIC_QUERY = "v=173";\n');

const htmlPath = path.join(root, "public/parchemin-senac.html");
let html = fs.readFileSync(htmlPath, "utf8");
html = html.replace(/parchemin-senac\.js\?v=\d+/, "parchemin-senac.js?v=125");
fs.writeFileSync(htmlPath, html);

console.log("versions bumped");
