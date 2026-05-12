const MIN_BOOT_MS = 1000;

function waitWindowLoad(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", () => resolve(), { once: true });
  });
}

/** Fonts + window load + minimum visible loader time */
export async function waitForBootReady(): Promise<void> {
  const minDelay = new Promise<void>((r) => setTimeout(r, MIN_BOOT_MS));
  const fontsReady =
    document.fonts?.ready ?? Promise.resolve();
  await Promise.all([fontsReady, waitWindowLoad(), minDelay]);
}
