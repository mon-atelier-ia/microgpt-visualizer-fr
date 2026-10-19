/// <reference types="node" />
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { transform } from "lightningcss";
import { parseColor } from "./parseColor";

// Read from disk: Vitest does not process CSS, so `?raw` yields ""
const stylesCss = readFileSync(
  new URL("../styles.css", import.meta.url),
  "utf-8",
);

/**
 * Canvas and inline-style colors are read at runtime from CSS custom
 * properties (getCssVar -> parseColor). In production those values are the
 * *minified* CSS, whose syntax differs from the source (Vite 8 / Lightning
 * CSS writes `oklch(50.2% .128 22.9)`). This test runs the same minifier,
 * with Vite 8's default targets, and checks every color token still parses
 * to the same color.
 */

// Vite 8 build.target "baseline-widely-available"
// (vite/dist/node: ESBUILD_BASELINE_WIDELY_AVAILABLE_TARGET)
const version = (major: number, minor = 0) => (major << 16) | (minor << 8);
const VITE_TARGETS = {
  chrome: version(111),
  edge: version(111),
  firefox: version(114),
  safari: version(16, 4),
  ios_saf: version(16, 4),
};

function minify(css: string): string {
  return transform({
    filename: "styles.css",
    code: new TextEncoder().encode(css),
    minify: true,
    targets: VITE_TARGETS,
  }).code.toString();
}

/** `selector -> { --var: value }` for the theme blocks (:root / [data-theme]). */
function themeTokens(css: string): Map<string, Map<string, string>> {
  const blocks = new Map<string, Map<string, string>>();
  const blockRe = /([^{}]*\[data-theme[^{}]*)\{([^{}]*)\}/g;
  // Comments first: the file header contains braces (--sp-{2,4,…})
  const uncommented = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [, selector, body] of uncommented.matchAll(blockRe)) {
    const key = selector.replace(/\s+/g, "").replace(/"/g, "");
    const decls = new Map<string, string>();
    for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) {
      decls.set(name, value.trim());
    }
    blocks.set(key, decls);
  }
  return blocks;
}

describe("color tokens survive CSS minification", () => {
  const source = themeTokens(stylesCss);
  const built = themeTokens(minify(stylesCss));
  const oklchTokens = [...source].flatMap(([block, decls]) =>
    [...decls]
      .filter(([, value]) => value.startsWith("oklch("))
      .map(([name, value]) => ({ block, name, value })),
  );

  it("finds the theme blocks and their oklch tokens", () => {
    expect(source.size).toBeGreaterThanOrEqual(2); // dark + light
    expect(oklchTokens.length).toBeGreaterThan(20);
  });

  it("the minifier really rewrites the syntax (else this test proves nothing)", () => {
    const changed = oklchTokens.filter(
      ({ block, name, value }) => built.get(block)?.get(name) !== value,
    );
    expect(changed.length).toBeGreaterThan(0);
  });

  it.each(oklchTokens)("$block $name parses to the same color", (t) => {
    const minified = built.get(t.block)?.get(t.name);
    expect(minified, "token missing after minification").toBeDefined();
    expect(parseColor(minified!)).toEqual(parseColor(t.value));
  });
});
