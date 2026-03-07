import {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import qrcode from "qrcode-generator";
import { DATASETS, DEFAULT_DATASET_ID } from "./datasets";
import { resetModel, getModelTotalStep } from "./modelStore";
import { getCssVar } from "./utils/getCssVar";
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
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, toggle: toggleTheme } = useTheme();

  const openShare = useCallback(() => {
    shareRef.current?.showModal();
    // Draw QR code after dialog is visible
    requestAnimationFrame(() => {
      const canvas = qrCanvasRef.current;
      if (!canvas) return;
      const qr = qrcode(0, "M");
      qr.addData("https://microgpt-visualizer-fr.vercel.app");
      qr.make();
      const moduleCount = qr.getModuleCount();
      const size = 180;
      const cellSize = size / moduleCount;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const fg = getCssVar("--text");
      const bg = getCssVar("--surface");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = fg;
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(
              c * cellSize,
              r * cellSize,
              cellSize + 0.5,
              cellSize + 0.5,
            );
          }
        }
      }
    });
  }, []);

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
              onClick={openShare}
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
          <canvas
            ref={qrCanvasRef}
            className="share-dialog__qr"
            role="img"
            aria-label="QR code vers microgpt-visualizer-fr.vercel.app"
          />
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
