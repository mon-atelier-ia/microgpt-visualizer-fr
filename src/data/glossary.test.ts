import { describe, expect, it } from "vitest";
import { GLOSSARY, type TermDef } from "./glossary";

/** Clés attendues (plan Tier 1 + Tier 2 + ajouts). */
const EXPECTED_KEYS = [
  // Tier 1
  "token", "bos", "vocabulaire", "identifiant", "vecteur", "dimension",
  "parametre", "logits", "neurone", "taux-apprentissage", "moyenne-mobile",
  "distribution", "tokeniseur", "wte", "wpe",
  // Tier 2
  "plongement", "attention", "softmax", "relu", "mlp", "rmsnorm", "loss",
  "gradient", "retropropagation", "adam", "temperature", "echantillonnage",
  "generation-autoregressive",
];

const TIER2_KEYS = [
  "plongement", "attention", "softmax", "relu", "mlp", "rmsnorm", "loss",
  "gradient", "retropropagation", "adam", "temperature", "echantillonnage",
  "generation-autoregressive",
];

describe("GLOSSARY — intégrité des données", () => {
  it("contient exactement les clés attendues", () => {
    const keys = Object.keys(GLOSSARY).sort();
    expect(keys).toEqual([...EXPECTED_KEYS].sort());
  });

  it("chaque entrée a un label non vide", () => {
    for (const [key, def] of Object.entries(GLOSSARY)) {
      expect(def.label, `${key}.label`).toBeTruthy();
      expect(typeof def.label).toBe("string");
    }
  });

  it("chaque entrée a un short non vide (1-2 phrases)", () => {
    for (const [key, def] of Object.entries(GLOSSARY)) {
      expect(def.short, `${key}.short`).toBeTruthy();
      expect(def.short.length, `${key}.short trop court`).toBeGreaterThan(20);
    }
  });

  it("les labels sont uniques", () => {
    const labels = Object.values(GLOSSARY).map((d) => d.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("les termes Tier 2 ont tous un long non vide", () => {
    for (const key of TIER2_KEYS) {
      const def = GLOSSARY[key] as TermDef;
      expect(def, `clé manquante : ${key}`).toBeDefined();
      expect(def.long, `${key}.long manquant`).toBeTruthy();
      expect(typeof def.long).toBe("string");
    }
  });

  it("les contenus long ont au moins 2 paragraphes", () => {
    for (const key of TIER2_KEYS) {
      const def = GLOSSARY[key];
      const paragraphs = def.long!.split("\n\n");
      expect(
        paragraphs.length,
        `${key}.long n'a que ${paragraphs.length} paragraphe(s)`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it("les termes Tier 1 n'ont pas de long", () => {
    const tier1Keys = EXPECTED_KEYS.filter((k) => !TIER2_KEYS.includes(k));
    for (const key of tier1Keys) {
      expect(GLOSSARY[key].long, `${key} ne devrait pas avoir de long`).toBeUndefined();
    }
  });

  it("les labels contiennent les accents français requis", () => {
    expect(GLOSSARY.parametre.label).toBe("paramètre");
    expect(GLOSSARY.retropropagation.label).toBe("rétropropagation");
    expect(GLOSSARY.temperature.label).toBe("température");
    expect(GLOSSARY.echantillonnage.label).toBe("échantillonnage");
    expect(GLOSSARY["generation-autoregressive"].label).toBe("génération autorégressive");
    expect(GLOSSARY["taux-apprentissage"].label).toBe("taux d'apprentissage");
  });
});
