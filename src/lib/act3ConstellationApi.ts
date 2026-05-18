import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Act3ConstellationWord } from "./act3ConstellationWords";
import { isAct3ConstellationWord } from "./act3ConstellationWords";

export type ConstellationStarRow = {
  id: string;
  mot: string;
  prenom_ville: string | null;
  created_at: string;
};

const TABLE = "constellation";
const LEGACY_TABLE = "constellation_stars";
const API_PATH = "/api/constellation";

let client: SupabaseClient | null | undefined;

function getClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url?.trim() || !key?.trim()) {
    client = null;
    return null;
  }
  client = createClient(url.trim(), key.trim());
  return client;
}

export function isConstellationApiConfigured(): boolean {
  return true;
}

export function isConstellationPersistenceLive(): boolean {
  if (getClient() !== null) return true;
  if (typeof window === "undefined") return false;
  return window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
}

function normalizeRow(raw: Record<string, unknown>): ConstellationStarRow | null {
  const id = String(raw.id ?? "");
  const mot = String(raw.mot ?? "");
  if (!id || !mot) return null;
  let prenom_ville: string | null = null;
  if (typeof raw.prenom_ville === "string" && raw.prenom_ville.trim()) {
    prenom_ville = raw.prenom_ville.trim().slice(0, 80);
  } else {
    const parts = [raw.prenom, raw.ville].filter(
      (p) => typeof p === "string" && p.trim(),
    ) as string[];
    if (parts.length) prenom_ville = parts.join(" · ").slice(0, 80);
  }
  return {
    id,
    mot,
    prenom_ville,
    created_at: String(raw.created_at ?? new Date().toISOString()),
  };
}

const DEMO_SEED: ConstellationStarRow[] = [
  { id: "demo-1", mot: "désert", prenom_ville: "Alger", created_at: "2020-01-01T00:00:00Z" },
  { id: "demo-2", mot: "lumière", prenom_ville: "A.", created_at: "2020-01-02T00:00:00Z" },
  { id: "demo-3", mot: "nuit", prenom_ville: null, created_at: "2020-01-03T00:00:00Z" },
  { id: "demo-4", mot: "étoile", prenom_ville: "Oran", created_at: "2020-01-04T00:00:00Z" },
  { id: "demo-5", mot: "vent", prenom_ville: "Samir", created_at: "2020-01-05T00:00:00Z" },
];

async function fetchFromTable(table: string): Promise<ConstellationStarRow[] | null> {
  const sb = getClient();
  if (!sb) return null;
  const { data, error } = await sb.from(table).select("*").order("created_at", { ascending: true });
  if (error) return null;
  return (data ?? [])
    .map((row) => normalizeRow(row as Record<string, unknown>))
    .filter((r): r is ConstellationStarRow => r !== null);
}

async function fetchViaHttpApi(): Promise<ConstellationStarRow[] | null> {
  if (typeof fetch === "undefined") return null;
  try {
    const res = await fetch(API_PATH, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { stars?: unknown[] };
    if (!Array.isArray(body.stars)) return null;
    return body.stars
      .map((row) => normalizeRow(row as Record<string, unknown>))
      .filter((r): r is ConstellationStarRow => r !== null);
  } catch {
    return null;
  }
}

export async function fetchConstellationStars(): Promise<ConstellationStarRow[]> {
  const sb = getClient();
  if (sb) {
    const primary = await fetchFromTable(TABLE);
    if (primary !== null) return primary;
    const legacy = await fetchFromTable(LEGACY_TABLE);
    if (legacy !== null) return legacy;
  }

  const fromApi = await fetchViaHttpApi();
  if (fromApi !== null) return fromApi;

  if (import.meta.env.DEV) return [...DEMO_SEED];
  return [];
}

export type SubmitStarInput = {
  mot: Act3ConstellationWord;
  prenom_ville?: string;
};

async function submitViaHttpApi(
  input: SubmitStarInput,
): Promise<{ ok: true; row: ConstellationStarRow } | { ok: false; error: string }> {
  try {
    const res = await fetch(API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        mot: input.mot,
        prenom_ville: input.prenom_ville?.trim().slice(0, 80) || null,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return { ok: false, error: String(body.error ?? `http_${res.status}`) };
    }
    const row = normalizeRow((body.row ?? body) as Record<string, unknown>);
    if (!row) return { ok: false, error: "invalid_row" };
    return { ok: true, row };
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function submitConstellationStar(
  input: SubmitStarInput,
): Promise<{ ok: true; row: ConstellationStarRow } | { ok: false; error: string }> {
  if (!isAct3ConstellationWord(input.mot)) {
    return { ok: false, error: "invalid_mot" };
  }
  const prenom_ville = input.prenom_ville?.trim().slice(0, 80) || null;

  const sb = getClient();
  if (sb) {
    const payload = { mot: input.mot, prenom_ville };
    let { data, error } = await sb.from(TABLE).insert(payload).select("*").single();

    if (error) {
      ({ data, error } = await sb
        .from(LEGACY_TABLE)
        .insert({ mot: input.mot, prenom: prenom_ville, ville: null })
        .select("*")
        .single());
    }

    if (!error && data) {
      const row = normalizeRow(data as Record<string, unknown>);
      if (row) return { ok: true, row };
    }
  }

  const viaApi = await submitViaHttpApi(input);
  if (viaApi.ok) return viaApi;

  if (import.meta.env.DEV) {
    const row: ConstellationStarRow = {
      id: `local-${Date.now()}`,
      mot: input.mot,
      prenom_ville,
      created_at: new Date().toISOString(),
    };
    DEMO_SEED.push(row);
    return { ok: true, row };
  }

  return { ok: false, error: "not_configured" };
}

export function countByMot(stars: ConstellationStarRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of stars) {
    m.set(s.mot, (m.get(s.mot) ?? 0) + 1);
  }
  return m;
}

/** Vide le seed local (dev sans Supabase). */
export function clearLocalConstellationDemo(): void {
  if (!import.meta.env.DEV) return;
  DEMO_SEED.splice(0, DEMO_SEED.length);
}

const RESET_TIMEOUT_MS = 8_000;

/**
 * Reset BDD constellation (tables `constellation` + legacy).
 * Nécessite `SUPABASE_SERVICE_ROLE_KEY` sur Vercel / `vercel dev`.
 * En dev sans API : vide seulement le seed local.
 */
export async function resetConstellationDatabase(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  clearLocalConstellationDemo();

  if (typeof fetch === "undefined") {
    return import.meta.env.DEV ? { ok: true } : { ok: false, error: "no_fetch" };
  }

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), RESET_TIMEOUT_MS);
    const res = await fetch(API_PATH, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    window.clearTimeout(timer);

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (res.ok) return { ok: true };

    if (res.status === 403) {
      return import.meta.env.DEV
        ? { ok: true }
        : { ok: false, error: String(body.error ?? "forbidden") };
    }

    if (res.status === 503) {
      const err = String(body.error ?? "not_configured");
      if (import.meta.env.DEV && (err.includes("service_role") || err.includes("supabase"))) {
        return { ok: true };
      }
      return { ok: false, error: err };
    }

    return { ok: false, error: String(body.error ?? `http_${res.status}`) };
  } catch (e) {
    if (import.meta.env.DEV && getClient() === null) return { ok: true };
    const msg = e instanceof Error ? e.message : "network";
    return { ok: false, error: msg };
  }
}
