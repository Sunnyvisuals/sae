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
  return getClient() !== null;
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

export async function fetchConstellationStars(): Promise<ConstellationStarRow[]> {
  const sb = getClient();
  if (!sb) return [...DEMO_SEED];
  const primary = await fetchFromTable(TABLE);
  if (primary !== null) return primary.length > 0 ? primary : [...DEMO_SEED];
  const legacy = await fetchFromTable(LEGACY_TABLE);
  if (legacy !== null) return legacy.length > 0 ? legacy : [...DEMO_SEED];
  return [...DEMO_SEED];
}

export type SubmitStarInput = {
  mot: Act3ConstellationWord;
  prenom_ville?: string;
};

export async function submitConstellationStar(
  input: SubmitStarInput,
): Promise<{ ok: true; row: ConstellationStarRow } | { ok: false; error: string }> {
  if (!isAct3ConstellationWord(input.mot)) {
    return { ok: false, error: "invalid_mot" };
  }
  const prenom_ville = input.prenom_ville?.trim().slice(0, 80) || null;

  const sb = getClient();
  if (!sb) {
    const row: ConstellationStarRow = {
      id: `local-${Date.now()}`,
      mot: input.mot,
      prenom_ville,
      created_at: new Date().toISOString(),
    };
    DEMO_SEED.push(row);
    return { ok: true, row };
  }

  const payload = { mot: input.mot, prenom_ville };
  let { data, error } = await sb.from(TABLE).insert(payload).select("*").single();

  if (error) {
    ({ data, error } = await sb
      .from(LEGACY_TABLE)
      .insert({ mot: input.mot, prenom: prenom_ville, ville: null })
      .select("*")
      .single());
  }

  if (error || !data) {
    console.warn("[constellation] insert failed:", error?.message);
    return { ok: false, error: error?.message ?? "insert_failed" };
  }
  const row = normalizeRow(data as Record<string, unknown>);
  if (!row) return { ok: false, error: "invalid_row" };
  return { ok: true, row };
}

export function countByMot(stars: ConstellationStarRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of stars) {
    m.set(s.mot, (m.get(s.mot) ?? 0) + 1);
  }
  return m;
}
