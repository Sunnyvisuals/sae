"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Overlays centrés Acte III — portal body (évite décalage `fixed` avec Lenis / Safari). */
export default function Act3FixedCenterPortal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setPortalRoot(document.body);
  }, []);

  if (!portalRoot) return null;

  return createPortal(<div className={className}>{children}</div>, portalRoot);
}
