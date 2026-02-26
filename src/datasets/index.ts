import { NAMES_RAW } from "../engine/data";
import { prenomsSimple } from "./prenoms-simple";
import { prenoms } from "./prenoms";
import { prenomsInsee } from "./prenoms-insee";
import { pokemonFr } from "./pokemon-fr";
import { dinosaures } from "./dinosaures";

export interface Dataset {
  id: string;
  label: string;
  description: string;
  words: string[];
}

export const DATASETS: Dataset[] = [
  {
    id: "prenoms-simple",
    label: "Prénoms FR (50)",
    description: "50 prénoms français classiques (INSEE)",
    words: prenomsSimple,
  },
  {
    id: "prenoms",
    label: "Prénoms FR (1000)",
    description: "1000 prénoms français (INSEE 2024)",
    words: prenoms,
  },
  {
    id: "prenoms-insee",
    label: "Prénoms FR (33k)",
    description: "33 235 prénoms français (INSEE, data.gouv.fr)",
    words: prenomsInsee,
  },
  {
    id: "pokemon-fr",
    label: "Pokémon FR (1022)",
    description: "1022 noms de Pokémon en français",
    words: pokemonFr,
  },
  {
    id: "dinosaures",
    label: "Dinosaures (1530)",
    description: "1530 noms de dinosaures",
    words: dinosaures,
  },
  {
    id: "names-en",
    label: "Prénoms EN (8000)",
    description: "8000 prénoms anglais (Karpathy/makemore)",
    words: NAMES_RAW.split(",").map((s) => s.trim()).filter(Boolean),
  },
];

export const DEFAULT_DATASET_ID = "prenoms-simple";

export function getDataset(id: string): Dataset {
  return DATASETS.find((d) => d.id === id) ?? DATASETS[0];
}
