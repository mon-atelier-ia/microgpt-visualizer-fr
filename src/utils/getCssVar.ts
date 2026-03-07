/** Read a CSS custom property from :root (e.g. "--green" → "oklch(0.698 0.094 130.4)"). */
export function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}
