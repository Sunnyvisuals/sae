import { useCallback, useEffect, useState, type ReactNode } from "react";

export type DevChapterJumps = {
  goChapter1: () => void;
  goChapter2: () => void;
  goChapter3: () => void;
  previewCredits: () => void;
  devAct12AddPrefaceMs?: (deltaMs: number) => void;
  devAct12ResetPrefaceExtra?: () => void;
  devAct12ExtraPrefaceMs?: number;
  devAct12BasePrefaceDelayMs?: number;
  launchAct12Bridge?: () => void;
  act1BridgePrefacePending?: boolean;
  /** Efface le vote constellation (localStorage) et remonte l’acte III pour retester le parcours participatif. */
  resetParticipativeMode?: () => void;
};

const DEV_PANEL_OPEN_KEY = "al-rihla-dev-jumps-open";

const panelPos = {
  left: "max(0.75rem, env(safe-area-inset-left))",
  bottom: "max(6.5rem, calc(env(safe-area-inset-bottom) + 5.75rem))",
} as const;

const btnBase =
  "rounded-sm border px-2.5 py-1.5 text-[9px] uppercase tracking-[0.18em] transition-colors ";
const btnGhost =
  btnBase +
  "border-solar-gold/30 bg-black/40 text-solar-gold/90 hover:border-solar-gold/50 hover:bg-solar-gold/10";
const btnAccent =
  btnBase +
  "border-solar-gold/45 bg-solar-gold/12 text-solar-gold hover:border-solar-gold/60 hover:bg-solar-gold/20";

function readDevPanelOpen(): boolean {
  try {
    const raw = sessionStorage.getItem(DEV_PANEL_OPEN_KEY);
    if (raw === "0") return false;
    if (raw === "1") return true;
  } catch {
    /* ignore */
  }
  return true;
}

type Props = {
  jumps: DevChapterJumps;
  shortcutsLabel?: string;
  children?: ReactNode;
};

export default function DevChapterJumpsPanel({
  jumps,
  shortcutsLabel = "Raccourcis",
  children,
}: Props) {
  const [open, setOpen] = useState(readDevPanelOpen);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(DEV_PANEL_OPEN_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "`" && e.key !== "²" && e.code !== "Backquote") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        t.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={toggle}
        title="Ouvrir le panneau dev (`)"
        aria-label="Ouvrir le panneau développeur"
        className={
          "pointer-events-auto fixed z-[100] rounded-sm border border-solar-gold/30 " +
          "bg-black/50 px-2 py-1.5 text-[8px] font-medium uppercase tracking-[0.28em] " +
          "text-solar-gold/70 shadow-[0_4px_20px_rgba(0,0,0,0.45)] backdrop-blur-sm " +
          "transition-colors hover:border-solar-gold/50 hover:bg-solar-gold/10 hover:text-solar-gold"
        }
        style={panelPos}
      >
        Dev · `
      </button>
    );
  }

  return (
    <div
      className="pointer-events-auto fixed z-[100] flex flex-col gap-2 rounded-sm border border-solar-gold/25 bg-black/55 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-sm"
      style={panelPos}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="m-0 text-[8px] font-medium uppercase tracking-[0.35em] text-solar-gold/50">
          {shortcutsLabel}
        </p>
        <button
          type="button"
          onClick={toggle}
          title="Masquer pour enregistrer (`)"
          aria-label="Masquer le panneau développeur"
          className={
            "shrink-0 rounded-sm border border-solar-gold/25 px-1.5 py-0.5 text-[8px] uppercase " +
            "tracking-[0.12em] text-solar-gold/55 transition-colors hover:border-solar-gold/45 hover:text-solar-gold"
          }
        >
          ×
        </button>
      </div>
      {children}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={jumps.goChapter1} className={btnGhost}>
          Ch. I
        </button>
        <button type="button" onClick={jumps.goChapter2} className={btnGhost}>
          Ch. II
        </button>
        <button type="button" onClick={jumps.goChapter3} className={btnGhost}>
          Ch. III
        </button>
        <button type="button" onClick={jumps.previewCredits} className={btnGhost}>
          Crédits
        </button>
      </div>
      {jumps.resetParticipativeMode ? (
        <>
          <p className="m-0 mt-1.5 text-[8px] font-medium uppercase tracking-[0.35em] text-solar-gold/50">
            Acte III participatif
          </p>
          <button
            type="button"
            onClick={jumps.resetParticipativeMode}
            className={btnAccent + " w-full"}
          >
            Reset participatif
          </button>
        </>
      ) : null}
      {jumps.act1BridgePrefacePending && jumps.launchAct12Bridge ? (
        <>
          <p className="m-0 mt-1.5 text-[8px] font-medium uppercase tracking-[0.35em] text-solar-gold/50">
            Acte I terminé
          </p>
          <button type="button" onClick={jumps.launchAct12Bridge} className={btnAccent + " w-full"}>
            Transi I → II
          </button>
        </>
      ) : null}
      {jumps.devAct12AddPrefaceMs != null ? (
        <>
          <p className="m-0 mt-1.5 text-[8px] font-medium uppercase tracking-[0.35em] text-solar-gold/50">
            Pont I→II
          </p>
          <p className="m-0 text-[9px] tabular-nums text-solar-gold/75">
            +{((jumps.devAct12ExtraPrefaceMs ?? 0) / 1000).toFixed(1)}s - total{" "}
            {(
              ((jumps.devAct12BasePrefaceDelayMs ?? 0) + (jumps.devAct12ExtraPrefaceMs ?? 0)) /
              1000
            ).toFixed(1)}
            s avant transi
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => jumps.devAct12AddPrefaceMs?.(1_000)} className={btnGhost}>
              +1 s
            </button>
            <button type="button" onClick={() => jumps.devAct12AddPrefaceMs?.(2_000)} className={btnGhost}>
              +2 s
            </button>
            <button type="button" onClick={() => jumps.devAct12ResetPrefaceExtra?.()} className={btnGhost}>
              Reset
            </button>
          </div>
        </>
      ) : null}
      <p className="m-0 text-[7px] uppercase tracking-[0.22em] text-solar-gold/35">` masquer</p>
    </div>
  );
}
