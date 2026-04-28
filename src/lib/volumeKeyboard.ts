/** Pas d’ajustement au clavier (aligné sur le slider, ~5 % par frappe). */
export const VOLUME_KEY_STEP = 0.05;

export type VolumeKeyDirection = 'up' | 'down';

/**
 * Pavé numérique : NumpadAdd / NumpadSubtract.
 * Clavier principal (TKL, etc.) : Minus ; « + » souvent Shift+Equal (US) ou touche produisant key '+' (AZERTY…).
 */
export function getVolumeKeyDirection(e: KeyboardEvent): VolumeKeyDirection | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;

  if (
    e.code === 'NumpadAdd' ||
    e.key === '+' ||
    (e.code === 'Equal' && e.shiftKey)
  ) {
    return 'up';
  }
  if (e.code === 'NumpadSubtract' || e.code === 'Minus' || e.key === '-') {
    return 'down';
  }
  return null;
}

export function shouldIgnoreVolumeKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) {
    const t = target.type;
    if (t === 'range' || t === 'button' || t === 'checkbox' || t === 'radio' || t === 'file' || t === 'reset' || t === 'submit') {
      return false;
    }
    return true;
  }
  return false;
}

export function applyVolumeKeyStep(
  direction: VolumeKeyDirection,
  volume: number,
  isMuted: boolean,
  step: number = VOLUME_KEY_STEP
): { volume: number; muted: boolean } {
  const effective = isMuted ? 0 : volume;
  const next =
    direction === 'up' ? Math.min(1, effective + step) : Math.max(0, effective - step);
  return { volume: next, muted: next === 0 };
}
