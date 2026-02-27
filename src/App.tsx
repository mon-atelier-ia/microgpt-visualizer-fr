import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { createModel, type ModelState } from "./engine/model";
import { DATASETS, DEFAULT_DATASET_ID, getDataset } from "./datasets";
import TermProvider from "./components/TermProvider";
import ErrorBoundary from "./components/ErrorBoundary";

const TokenizerPage = lazy(() => import("./pages/TokenizerPage"));
const EmbeddingsPage = lazy(() => import("./pages/EmbeddingsPage"));
const ForwardPassPage = lazy(() => import("./pages/ForwardPassPage"));
const TrainingPage = lazy(() => import("./pages/TrainingPage"));
const InferencePage = lazy(() => import("./pages/InferencePage"));

const PAGES = [
  { id: "tokenizer", num: 1, label: "Tokenisation" },
  { id: "embeddings", num: 2, label: "Plongements (wte/wpe)" },
  { id: "forward", num: 3, label: "Propagation avant" },
  { id: "training", num: 4, label: "Entraînement" },
  { id: "inference", num: 5, label: "Inférence" },
];

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("microgpt-theme");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("microgpt-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}

export default function App() {
  const [page, setPage] = useState("tokenizer");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [datasetId, setDatasetId] = useState(DEFAULT_DATASET_ID);
  const modelRef = useRef<ModelState>(
    createModel(getDataset(DEFAULT_DATASET_ID).words),
  );
  const [, forceUpdate] = useState(0);
  const { theme, toggle: toggleTheme } = useTheme();

  const rerender = () => forceUpdate((n) => n + 1);
  const resetModel = (id?: string) => {
    const ds = getDataset(id ?? datasetId);
    modelRef.current = createModel(ds.words);
    rerender();
  };

  const handleDatasetChange = (id: string) => {
    setDatasetId(id);
    resetModel(id);
  };

  const handlePageChange = (pageId: string) => {
    setPage(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <TermProvider>
      <div className={`app ${mobileMenuOpen ? "menu-open" : ""}`}>
        {/* Bouton menu mobile */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Ouvrir le menu"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>

        <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <header>
            <h1>MicroGPT</h1>
            <div className="subtitle">Explorateur visuel &mdash; @karpathy</div>
          </header>
          <nav>
            {PAGES.map((p) => (
              <button
                key={p.id}
                className={page === p.id ? "active" : ""}
                onClick={() => handlePageChange(p.id)}
              >
                <span className="num">{p.num}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </nav>
          <div className="dataset-picker">
            <div className="dataset-picker-label">Jeu de données</div>
            {DATASETS.map((d) => (
              <button
                key={d.id}
                className={`dataset-btn ${datasetId === d.id ? "active" : ""}`}
                onClick={() => handleDatasetChange(d.id)}
                title={d.description}
              >
                {d.label}
              </button>
            ))}
          </div>
          <a
            href="https://karpathy.github.io/2026/02/12/microgpt/"
            target="_blank"
            rel="noopener noreferrer"
            className="guide-link"
          >
            📖 Lire le guide officiel
          </a>
          <div className="theme-picker">
            <button
              className={`theme-btn ${theme === "dark" ? "active" : ""}`}
              onClick={() => theme !== "dark" && toggleTheme()}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              Sombre
            </button>
            <button
              className={`theme-btn ${theme === "light" ? "active" : ""}`}
              onClick={() => theme !== "light" && toggleTheme()}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              Clair
            </button>
          </div>
          <div className="community-note">
            Construit avec l'aide de l'IA. Peut contenir des erreurs. Basé sur{" "}
            <a
              href="https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95"
              target="_blank"
              rel="noopener noreferrer"
            >
              microgpt.py de Karpathy
            </a>
            .
          </div>
        </aside>

        {/* Overlay mobile — ferme le menu au clic */}
        {mobileMenuOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="main">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div
                  className="panel"
                  style={{
                    margin: 32,
                    textAlign: "center",
                    color: "var(--text-dim)",
                  }}
                >
                  Chargement…
                </div>
              }
            >
              {page === "tokenizer" && <TokenizerPage />}
              {page === "embeddings" && (
                <EmbeddingsPage model={modelRef.current} />
              )}
              {page === "forward" && (
                <ForwardPassPage model={modelRef.current} />
              )}
              {page === "training" && (
                <TrainingPage
                  model={modelRef.current}
                  onUpdate={rerender}
                  onReset={resetModel}
                />
              )}
              {page === "inference" && (
                <InferencePage model={modelRef.current} />
              )}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </TermProvider>
  );
}
