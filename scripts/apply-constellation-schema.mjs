/**
 * Applique supabase/constellation_stars.sql sur la base liée (POSTGRES_URL_NON_POOLING).
 * Usage : node scripts/apply-constellation-schema.mjs
 * Charge .env.production.local ou .env.local si présent.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(name) {
  const path = resolve(root, name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env.production.local");
loadEnvFile(".env.local");

const url =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL;

if (!url) {
  console.error("[constellation] POSTGRES_URL_NON_POOLING manquant (.env.production.local)");
  process.exit(1);
}

const sqlPath = resolve(root, "supabase/constellation_stars.sql");
const ddl = readFileSync(sqlPath, "utf8");

const { default: postgres } = await import("postgres");

const db = postgres(url, { max: 1, ssl: "require" });

try {
  await db.unsafe(ddl);
  console.log("[constellation] Schéma appliqué : table public.constellation + RLS");
} catch (err) {
  console.error("[constellation] Échec SQL:", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await db.end({ timeout: 5 });
}
