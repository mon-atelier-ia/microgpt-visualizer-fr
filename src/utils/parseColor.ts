/** Parse a CSS color string (#hex or rgb()) into [r, g, b]. */
export function parseColor(c: string): [number, number, number] {
  if (c.startsWith("#")) {
    const hex = c.slice(1);
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  const m = c.match(/(\d+)/g);
  return m
    ? ([Number(m[0]), Number(m[1]), Number(m[2])] as [number, number, number])
    : [128, 128, 128];
}
