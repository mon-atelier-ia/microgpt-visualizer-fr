import { lazy } from "react";

export interface PageDef {
  id: string;
  num: number;
  label: string;
  sep: boolean;
  component: React.LazyExoticComponent<React.ComponentType<any>>; // heterogeneous page props
}

export const PAGES: PageDef[] = [
  {
    id: "home",
    num: 0,
    label: "Accueil",
    sep: false,
    component: lazy(() => import("./pages/HomePage")),
  },
  {
    id: "tokenizer",
    num: 1,
    label: "Tokenisation",
    sep: true,
    component: lazy(() => import("./pages/TokenizerPage")),
  },
  {
    id: "embeddings",
    num: 2,
    label: "Plongements (wte/wpe)",
    sep: false,
    component: lazy(() => import("./pages/EmbeddingsPage")),
  },
  {
    id: "forward",
    num: 3,
    label: "Propagation",
    sep: false,
    component: lazy(() => import("./pages/ForwardPassPage")),
  },
  {
    id: "attention",
    num: 4,
    label: "Attention",
    sep: false,
    component: lazy(() => import("./pages/AttentionPage")),
  },
  {
    id: "training",
    num: 5,
    label: "Entraînement",
    sep: false,
    component: lazy(() => import("./pages/TrainingPage")),
  },
  {
    id: "inference",
    num: 6,
    label: "Inférence",
    sep: false,
    component: lazy(() => import("./pages/InferencePage")),
  },
  {
    id: "fullmodel",
    num: 7,
    label: "Modèle complet",
    sep: true,
    component: lazy(() => import("./pages/FullModelPage")),
  },
  {
    id: "conclusion",
    num: 8,
    label: "Conclusion",
    sep: false,
    component: lazy(() => import("./pages/ConclusionPage")),
  },
];
