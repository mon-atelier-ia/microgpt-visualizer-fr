import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { DATASETS, DEFAULT_DATASET_ID } from "./datasets";
import { resetModel, getModelTotalStep } from "./modelStore";
import TermProvider from "./components/TermProvider";
import ErrorBoundary from "./components/ErrorBoundary";

const HomePage = lazy(() => import("./pages/HomePage"));
const TokenizerPage = lazy(() => import("./pages/TokenizerPage"));
const EmbeddingsPage = lazy(() => import("./pages/EmbeddingsPage"));
const ForwardPassPage = lazy(() => import("./pages/ForwardPassPage"));
const AttentionPage = lazy(() => import("./pages/AttentionPage"));
const TrainingPage = lazy(() => import("./pages/TrainingPage"));
const InferencePage = lazy(() => import("./pages/InferencePage"));
const FullModelPage = lazy(() => import("./pages/FullModelPage"));
const ConclusionPage = lazy(() => import("./pages/ConclusionPage"));

const PAGES = [
  { id: "home", num: 0, label: "Accueil", sep: false },
  { id: "tokenizer", num: 1, label: "Tokenisation", sep: true },
  { id: "embeddings", num: 2, label: "Plongements (wte/wpe)", sep: false },
  { id: "forward", num: 3, label: "Propagation", sep: false },
  { id: "attention", num: 4, label: "Attention", sep: false },
  { id: "training", num: 5, label: "Entraînement", sep: false },
  { id: "inference", num: 6, label: "Inférence", sep: false },
  { id: "fullmodel", num: 7, label: "Modèle complet", sep: true },
  { id: "conclusion", num: 8, label: "Conclusion", sep: false },
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
  const [page, setPage] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // datasetId is UI-only state (sidebar active button). The store tracks
  // its own currentDatasetId for resetModel(). Both are set together in
  // handleDatasetChange to keep them in sync.
  const [datasetId, setDatasetId] = useState(DEFAULT_DATASET_ID);
  const [pendingDatasetId, setPendingDatasetId] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("microgpt-visited");
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const confirmRef = useRef<HTMLDialogElement>(null);
  const shareRef = useRef<HTMLDialogElement>(null);
  const { theme, toggle: toggleTheme } = useTheme();

  const handleDatasetChange = (id: string) => {
    if (id === datasetId) return;
    if (getModelTotalStep() > 0) {
      setPendingDatasetId(id);
      confirmRef.current?.showModal();
      return;
    }
    setDatasetId(id);
    resetModel(id);
  };

  const confirmDatasetChange = () => {
    if (pendingDatasetId) {
      setDatasetId(pendingDatasetId);
      resetModel(pendingDatasetId);
    }
    setPendingDatasetId(null);
    confirmRef.current?.close();
  };

  const cancelDatasetChange = () => {
    setPendingDatasetId(null);
    confirmRef.current?.close();
  };

  const handlePageChange = (pageId: string) => {
    setPage(pageId);
    setMobileMenuOpen(false);
    setVisited((prev) => {
      if (prev.has(pageId)) return prev;
      const next = new Set(prev);
      next.add(pageId);
      localStorage.setItem("microgpt-visited", JSON.stringify([...next]));
      return next;
    });
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
            aria-hidden="true"
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
            <div className="subtitle">Explorateur visuel</div>
          </header>
          <nav>
            {PAGES.map((p) => (
              <button
                key={p.id}
                className={`${page === p.id ? "active" : ""} ${p.sep ? "nav-sep" : ""}`}
                onClick={() => handlePageChange(p.id)}
              >
                <span className="num">{p.num}</span>
                <span>{p.label}</span>
                {visited.has(p.id) && page !== p.id && (
                  <span className="visited-dot" aria-label="déjà visitée" />
                )}
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
          <div className="theme-picker">
            <button
              className={`theme-btn ${theme === "dark" ? "active" : ""}`}
              onClick={() => theme !== "dark" && toggleTheme()}
            >
              <svg
                aria-hidden="true"
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
                aria-hidden="true"
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
            <span>
              Basé sur{" "}
              <a
                href="https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95"
                target="_blank"
                rel="noopener noreferrer"
              >
                microgpt.py d'Andrej Karpathy
              </a>
              .
            </span>
            <button
              className="share-btn"
              onClick={() => shareRef.current?.showModal()}
              aria-label="Partager"
              title="Partager via QR code"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
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
                <div className="panel loading-fallback" role="status">
                  Chargement…
                </div>
              }
            >
              {page === "home" && (
                <HomePage onStart={() => handlePageChange("tokenizer")} />
              )}
              {page === "tokenizer" && <TokenizerPage />}
              {page === "embeddings" && <EmbeddingsPage />}
              {page === "forward" && <ForwardPassPage />}
              {page === "attention" && <AttentionPage />}
              {page === "training" && <TrainingPage />}
              {page === "inference" && <InferencePage />}
              {page === "fullmodel" && <FullModelPage />}
              {page === "conclusion" && <ConclusionPage />}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <dialog
        ref={confirmRef}
        className="confirm-dialog"
        onCancel={cancelDatasetChange}
      >
        <div className="confirm-dialog__content">
          <p className="confirm-dialog__title">Changer de jeu de données ?</p>
          <p className="confirm-dialog__message">
            L'entraînement sera réinitialisé. Les poids appris seront perdus.
          </p>
          <div className="confirm-dialog__actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cancelDatasetChange}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={confirmDatasetChange}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </dialog>
      <dialog
        ref={shareRef}
        className="share-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) shareRef.current?.close();
        }}
        onCancel={() => shareRef.current?.close()}
      >
        <div className="share-dialog__content">
          <p className="share-dialog__title">Partager</p>
          <svg
            className="share-dialog__qr"
            role="img"
            aria-label="QR code vers microgpt-visualizer-fr.vercel.app"
            viewBox="0 0 29 29"
            fill="currentColor"
          >
            <path d="M0 0h7v1h-7zM11 0h3v1h-3zM16 0h5v1h-5zM22 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM9 1h4v1h-4zM14 1h3v1h-3zM20 1h1v1h-1zM22 1h1v1h-1zM28 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h2v1h-2zM11 2h1v1h-1zM15 2h2v1h-2zM18 2h1v1h-1zM22 2h1v1h-1zM24 2h3v1h-3zM28 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h1v1h-1zM11 3h3v1h-3zM15 3h1v1h-1zM17 3h1v1h-1zM22 3h1v1h-1zM24 3h3v1h-3zM28 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h2v1h-2zM13 4h1v1h-1zM16 4h5v1h-5zM22 4h1v1h-1zM24 4h3v1h-3zM28 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM8 5h1v1h-1zM11 5h6v1h-6zM18 5h1v1h-1zM20 5h1v1h-1zM22 5h1v1h-1zM28 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h7v1h-7zM8 7h1v1h-1zM10 7h1v1h-1zM20 7h1v1h-1zM0 8h1v1h-1zM2 8h5v1h-5zM9 8h1v1h-1zM12 8h4v1h-4zM17 8h1v1h-1zM20 8h1v1h-1zM22 8h5v1h-5zM2 9h4v1h-4zM7 9h1v1h-1zM12 9h1v1h-1zM16 9h2v1h-2zM19 9h6v1h-6zM28 9h1v1h-1zM1 10h1v1h-1zM5 10h2v1h-2zM8 10h1v1h-1zM10 10h1v1h-1zM12 10h1v1h-1zM15 10h1v1h-1zM17 10h2v1h-2zM20 10h1v1h-1zM22 10h1v1h-1zM1 11h2v1h-2zM4 11h1v1h-1zM7 11h1v1h-1zM10 11h3v1h-3zM14 11h1v1h-1zM18 11h2v1h-2zM22 11h1v1h-1zM24 11h2v1h-2zM27 11h1v1h-1zM0 12h1v1h-1zM3 12h1v1h-1zM5 12h2v1h-2zM9 12h1v1h-1zM13 12h5v1h-5zM20 12h1v1h-1zM23 12h1v1h-1zM25 12h2v1h-2zM2 13h1v1h-1zM5 13h1v1h-1zM7 13h1v1h-1zM14 13h1v1h-1zM16 13h1v1h-1zM18 13h7v1h-7zM28 13h1v1h-1zM0 14h2v1h-2zM3 14h2v1h-2zM6 14h2v1h-2zM9 14h4v1h-4zM15 14h2v1h-2zM20 14h1v1h-1zM23 14h1v1h-1zM25 14h2v1h-2zM7 15h1v1h-1zM12 15h1v1h-1zM15 15h2v1h-2zM22 15h1v1h-1zM24 15h1v1h-1zM27 15h1v1h-1zM2 16h1v1h-1zM5 16h2v1h-2zM9 16h2v1h-2zM13 16h3v1h-3zM17 16h1v1h-1zM19 16h1v1h-1zM25 16h2v1h-2zM0 17h1v1h-1zM2 17h2v1h-2zM5 17h1v1h-1zM12 17h1v1h-1zM14 17h1v1h-1zM16 17h1v1h-1zM19 17h2v1h-2zM22 17h3v1h-3zM26 17h1v1h-1zM28 17h1v1h-1zM0 18h1v1h-1zM2 18h2v1h-2zM5 18h4v1h-4zM11 18h2v1h-2zM15 18h1v1h-1zM17 18h2v1h-2zM21 18h1v1h-1zM23 18h2v1h-2zM26 18h1v1h-1zM0 19h1v1h-1zM2 19h1v1h-1zM4 19h2v1h-2zM7 19h1v1h-1zM9 19h3v1h-3zM16 19h1v1h-1zM18 19h4v1h-4zM27 19h1v1h-1zM0 20h1v1h-1zM2 20h1v1h-1zM4 20h1v1h-1zM6 20h4v1h-4zM11 20h1v1h-1zM15 20h4v1h-4zM20 20h5v1h-5zM26 20h3v1h-3zM8 21h1v1h-1zM10 21h2v1h-2zM13 21h1v1h-1zM16 21h5v1h-5zM24 21h5v1h-5zM0 22h7v1h-7zM12 22h4v1h-4zM19 22h2v1h-2zM22 22h1v1h-1zM24 22h3v1h-3zM0 23h1v1h-1zM6 23h1v1h-1zM8 23h1v1h-1zM10 23h1v1h-1zM13 23h1v1h-1zM16 23h1v1h-1zM19 23h2v1h-2zM24 23h1v1h-1zM0 24h1v1h-1zM2 24h3v1h-3zM6 24h1v1h-1zM8 24h3v1h-3zM12 24h1v1h-1zM14 24h1v1h-1zM17 24h1v1h-1zM20 24h5v1h-5zM26 24h3v1h-3zM0 25h1v1h-1zM2 25h3v1h-3zM6 25h1v1h-1zM8 25h2v1h-2zM11 25h1v1h-1zM18 25h2v1h-2zM25 25h4v1h-4zM0 26h1v1h-1zM2 26h3v1h-3zM6 26h1v1h-1zM8 26h2v1h-2zM11 26h1v1h-1zM14 26h2v1h-2zM17 26h1v1h-1zM19 26h2v1h-2zM22 26h6v1h-6zM0 27h1v1h-1zM6 27h1v1h-1zM9 27h2v1h-2zM12 27h2v1h-2zM18 27h1v1h-1zM20 27h1v1h-1zM23 27h3v1h-3zM27 27h1v1h-1zM0 28h7v1h-7zM8 28h1v1h-1zM10 28h3v1h-3zM14 28h4v1h-4zM21 28h1v1h-1zM23 28h1v1h-1zM26 28h1v1h-1z" />
          </svg>
          <p className="share-dialog__url">microgpt-visualizer-fr.vercel.app</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => shareRef.current?.close()}
          >
            Fermer
          </button>
        </div>
      </dialog>
    </TermProvider>
  );
}
