'use client';

import { IconChevronLeft, IconChevronRight } from './icons';

/** Aligné sur `OrientationPanel` : bande repliée ~40px — la flèche droite évite le rail. */
const PARCOURS_COLLAPSED_OFFSET_PX = 42;

type Props = {
  midnight: boolean;
  mdUp: boolean;
  parcoursOpen: boolean;
  onOpenParcours: () => void;
  onOpenMenu: () => void;
  menuAriaLabel: string;
  parcoursAriaLabel: string;
};

export default function UxEdgeOpenControls({
  midnight,
  mdUp,
  parcoursOpen,
  onOpenParcours,
  onOpenMenu,
  menuAriaLabel,
  parcoursAriaLabel,
}: Props) {
  const shell =
    'pointer-events-auto fixed top-1/2 z-[38] flex -translate-y-1/2 items-center justify-center rounded-[2px] border px-2 py-10 backdrop-blur-[4px] transition-[border-color,background-color,box-shadow,color] duration-300 focus-visible:outline-none focus-visible:ring-1';

  const night =
    'border-[rgba(139,213,255,0.28)] bg-[rgba(3,12,34,0.42)] text-[rgba(198,226,252,0.82)] shadow-[inset_0_1px_0_rgba(180,218,255,0.06)] hover:border-[rgba(155,226,255,0.42)] hover:bg-[rgba(5,18,42,0.55)] focus-visible:ring-[rgba(148,206,255,0.45)]';
  const day =
    'border-[rgba(197,160,89,0.38)] bg-black/42 text-[rgba(229,206,154,0.88)] shadow-[inset_0_1px_0_rgba(253,248,238,0.05)] hover:border-[rgba(197,160,89,0.52)] hover:bg-black/55 focus-visible:ring-[color:rgba(197,160,89,0.42)]';

  const palette = midnight ? night : day;

  return (
    <>
      <button
        type="button"
        className={`${shell} left-[max(2px,env(safe-area-inset-left))] rounded-l-none border-l-0 pr-2.5 ${palette}`}
        aria-label={menuAriaLabel}
        onClick={onOpenMenu}
      >
        <IconChevronRight strokeWidth={1.35} className="h-5 w-5 shrink-0" aria-hidden />
      </button>

      {mdUp && !parcoursOpen ? (
        <button
          type="button"
          style={{ right: `max(${PARCOURS_COLLAPSED_OFFSET_PX}px, env(safe-area-inset-right))` }}
          className={`${shell} rounded-r-none border-r-0 pl-2.5 ${palette}`}
          aria-label={parcoursAriaLabel}
          onClick={onOpenParcours}
        >
          <IconChevronLeft strokeWidth={1.35} className="h-5 w-5 shrink-0" aria-hidden />
        </button>
      ) : null}
    </>
  );
}
