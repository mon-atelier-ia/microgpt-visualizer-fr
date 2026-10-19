import { expect, test, type Page } from "@playwright/test";

const PAGES = [
  "Accueil",
  "Tokenisation",
  "Plongements",
  "Propagation",
  "Attention",
  "Entraînement",
  "Inférence",
  "Modèle complet",
  "Conclusion",
];
const WIDTHS = [375, 1038, 1440]; // phone, mid laptop (PLAN #8), desktop

/** Sidebar buttons are off-screen on phones: dispatch the click directly. */
async function openPage(page: Page, label: string) {
  await page.locator("nav button", { hasText: label }).dispatchEvent("click");
  await expect(page.locator("main h1")).toContainText(
    label === "Accueil" ? "Bienvenue" : label,
  );
}

for (const width of WIDTHS) {
  test(`no horizontal page overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const label of PAGES) {
      await openPage(page, label);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, `${label} overflows by ${overflow}px`).toBe(0);
    }
  });
}

test("heatmap colors match production (minified CSS is parsed)", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("microgpt-theme", "light"),
  );
  await page.goto("/");
  await openPage(page, "Plongements");
  const firstCell = page
    .locator("table.heatmap tbody td:not(.row-label)")
    .first();
  // Measured on https://microgpt-visualizer-fr.vercel.app on 2026-10-19
  // (deterministic untrained model, light theme). A broken oklch parse
  // turned it into rgb(88, 0, 53) — PLAN #12.
  await expect(firstCell).toHaveCSS("background-color", "rgb(190, 186, 151)");
});
