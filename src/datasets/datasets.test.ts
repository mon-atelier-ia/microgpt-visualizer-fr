import { describe, expect, it } from "vitest";
import { DATASETS, DEFAULT_DATASET_ID, getDataset } from "./index";
import { createModel } from "../engine/model";

describe("DATASETS", () => {
  it("contains exactly 5 datasets", () => {
    expect(DATASETS).toHaveLength(5);
  });

  it("has unique ids", () => {
    const ids = DATASETS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each dataset has all required fields", () => {
    for (const d of DATASETS) {
      expect(d.id).toBeTruthy();
      expect(d.label).toBeTruthy();
      expect(d.description).toBeTruthy();
      expect(d.words.length).toBeGreaterThan(0);
    }
  });

  it("words contain only lowercase a-z", () => {
    for (const d of DATASETS) {
      for (const word of d.words) {
        expect(word).toMatch(/^[a-z]+$/);
      }
    }
  });

  it("words are at least 2 characters long", () => {
    for (const d of DATASETS) {
      for (const word of d.words) {
        expect(word.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("has no duplicate words within each dataset", () => {
    for (const d of DATASETS) {
      expect(new Set(d.words).size).toBe(d.words.length);
    }
  });

  it.each([
    ["prenoms-simple", 50],
    ["prenoms", 1000],
    ["pokemon-fr", 1022],
    ["dinosaures", 1530],
  ] as const)("dataset %s has %d words", (id, count) => {
    const ds = DATASETS.find((d) => d.id === id);
    expect(ds).toBeDefined();
    expect(ds!.words).toHaveLength(count);
  });

  it("names-en has exactly 8000 words", () => {
    const ds = DATASETS.find((d) => d.id === "names-en");
    expect(ds).toBeDefined();
    expect(ds!.words).toHaveLength(8000);
  });
});

describe("DEFAULT_DATASET_ID", () => {
  it("refers to an existing dataset", () => {
    const ds = DATASETS.find((d) => d.id === DEFAULT_DATASET_ID);
    expect(ds).toBeDefined();
  });

  it("defaults to prenoms-simple", () => {
    expect(DEFAULT_DATASET_ID).toBe("prenoms-simple");
  });
});

describe("getDataset", () => {
  it("returns the correct dataset by id", () => {
    const ds = getDataset("pokemon-fr");
    expect(ds.id).toBe("pokemon-fr");
    expect(ds.words.length).toBe(1022);
  });

  it("falls back to first dataset for unknown id", () => {
    const ds = getDataset("nonexistent");
    expect(ds.id).toBe(DATASETS[0].id);
  });
});

describe("createModel integration", () => {
  it("creates a model with custom dataset", () => {
    const ds = getDataset("prenoms-simple");
    const model = createModel(ds.words);
    expect(model.docs).toHaveLength(ds.words.length);
    expect(model.totalStep).toBe(0);
    expect(model.lossHistory).toHaveLength(0);
  });

  it("model docs contain the same words as the dataset (shuffled)", () => {
    const ds = getDataset("prenoms-simple");
    const model = createModel(ds.words);
    expect(new Set(model.docs)).toEqual(new Set(ds.words));
  });

  it("creates a model with default dataset when no args", () => {
    const model = createModel();
    expect(model.docs.length).toBe(8000);
  });
});
