/** Read a CSS custom property from :root (e.g. "--green" → "#4ade80"). */
export function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}
