import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const TABLE = "constellation";
const LEGACY_TABLE = "constellation_stars";

type VercelReq = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
};

type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
};

function env(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function getSupabase(serviceRole = false): SupabaseClient | null {
  const url = env("SUPABASE_URL") ?? env("VITE_SUPABASE_URL");
  const key = serviceRole
    ? env("SUPABASE_SERVICE_ROLE_KEY")
    : env("SUPABASE_ANON_KEY") ?? env("VITE_SUPABASE_ANON_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function normalizeRow(raw: Record<string, unknown>) {
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

async function fetchAll(sb: SupabaseClient) {
  const { data, error } = await sb.from(TABLE).select("*").order("created_at", { ascending: true });
  if (!error) {
    return (data ?? [])
      .map((row) => normalizeRow(row as Record<string, unknown>))
      .filter(Boolean);
  }
  const legacy = await sb.from(LEGACY_TABLE).select("*").order("created_at", { ascending: true });
  if (legacy.error) return null;
  return (legacy.data ?? [])
    .map((row) => normalizeRow(row as Record<string, unknown>))
    .filter(Boolean);
}

function isDevResetAllowed(req: VercelReq): boolean {
  if (env("ALLOW_DEV_CONSTELLATION_RESET") === "true") return true;
  const host = String(req.headers?.host ?? "");
  if (host.includes("localhost") || host.includes("127.0.0.1")) return true;
  const vercelEnv = env("VERCEL_ENV");
  return vercelEnv === "development" || vercelEnv === "preview";
}

export default async function handler(req: VercelReq, res: VercelRes) {
  res.setHeader("Cache-Control", "no-store");

  const method = (req.method ?? "GET").toUpperCase();

  if (method === "GET") {
    const sb = getSupabase(false);
    if (!sb) {
      res.status(503).json({ error: "not_configured", stars: [] });
      return;
    }
    const stars = await fetchAll(sb);
    if (stars === null) {
      res.status(500).json({ error: "fetch_failed", stars: [] });
      return;
    }
    res.status(200).json({ stars });
    return;
  }

  if (method === "POST") {
    const sb = getSupabase(false);
    if (!sb) {
      res.status(503).json({ error: "not_configured" });
      return;
    }
    const body = (req.body ?? {}) as Record<string, unknown>;
    const mot = String(body.mot ?? "").trim();
    if (mot.length < 2 || mot.length > 32) {
      res.status(400).json({ error: "invalid_mot" });
      return;
    }
    const prenom_ville =
      typeof body.prenom_ville === "string" && body.prenom_ville.trim()
        ? body.prenom_ville.trim().slice(0, 80)
        : null;

    let { data, error } = await sb
      .from(TABLE)
      .insert({ mot, prenom_ville })
      .select("*")
      .single();

    if (error) {
      ({ data, error } = await sb
        .from(LEGACY_TABLE)
        .insert({ mot, prenom: prenom_ville, ville: null })
        .select("*")
        .single());
    }

    if (error || !data) {
      res.status(500).json({ error: String(error?.message ?? "insert_failed") });
      return;
    }
    const row = normalizeRow(data as Record<string, unknown>);
    if (!row) {
      res.status(500).json({ error: "invalid_row" });
      return;
    }
    res.status(200).json({ row });
    return;
  }

  if (method === "DELETE") {
    if (!isDevResetAllowed(req)) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    const sb = getSupabase(true);
    if (!sb) {
      res.status(503).json({ error: "service_role_required" });
      return;
    }
    const { error: e1 } = await sb.from(TABLE).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const { error: e2 } = await sb
      .from(LEGACY_TABLE)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (e1 && e2) {
      res.status(500).json({ error: String(e1.message ?? e2.message) });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
