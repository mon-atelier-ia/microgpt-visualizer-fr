import { useState, useRef, Suspense } from "react";
import { DATASETS } from "./datasets";
import { PAGES } from "./app.config";
import { useTheme, type Theme } from "./hooks/useTheme";
import { useDatasetManager } from "./hooks/useDatasetManager";
import { useVisitedPages } from "./hooks/useVisitedPages";
import NavItem from "./components/NavItem";
import ThemePicker from "./components/ThemePicker";
import ConfirmDialog from "./components/ConfirmDialog";
import ShareDialog from "./components/ShareDialog";
import TermProvider from "./components/TermProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import "./components/ConfirmDialog.css";
import "./components/ShareDialog.css";

function renderPage(pageId: string, onStart: () => void) {
  const def = PAGES.find((p) => p.id === pageId);
  if (!def) return null;
  const Page = def.component;
  return pageId === "home" ? <Page onStart={onStart} /> : <Page />;
}

function PageContent({ page, onStart }: { page: string; onStart: () => void }) {
  return (
    <main className="main">
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="panel loading-fallback" role="status">
              Chargement…
            </div>
          }
        >
          {renderPage(page, onStart)}
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shareRef = useRef<HTMLDialogElement>(null);
  const { theme, toggle } = useTheme();
  const {
    datasetId,
    confirmRef,
    handleDatasetChange,
    confirmChange,
    cancelChange,
  } = useDatasetManager();
  const { visited, markVisited } = useVisitedPages();
  const handlePageChange = (id: string) => {
    setPage(id);
    setMobileMenuOpen(false);
    markVisited(id);
  };

  return (
    <TermProvider>
      <div className={`app ${mobileMenuOpen ? "menu-open" : ""}`}>
        <MobileMenuBtn onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        {/* prettier-ignore */}
        <Sidebar page={page} visited={visited} datasetId={datasetId} theme={theme}
          mobileOpen={mobileMenuOpen} shareRef={shareRef} onPageChange={handlePageChange}
          onDatasetChange={handleDatasetChange} onToggleTheme={toggle} />
        {mobileMenuOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <PageContent
          page={page}
          onStart={() => handlePageChange("tokenizer")}
        />
      </div>
      <ConfirmDialog
        dialogRef={confirmRef}
        onConfirm={confirmChange}
        onCancel={cancelChange}
      />
      <ShareDialog dialogRef={shareRef} />
    </TermProvider>
  );
}

function MobileMenuBtn(props: { onClick: () => void }) {
  return (
    <button
      className="mobile-menu-btn"
      onClick={props.onClick}
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
  );
}

interface SidebarProps {
  page: string;
  visited: Set<string>;
  datasetId: string;
  theme: Theme;
  mobileOpen: boolean;
  shareRef: React.RefObject<HTMLDialogElement | null>;
  onPageChange: (id: string) => void;
  onDatasetChange: (id: string) => void;
  onToggleTheme: () => void;
}

function Sidebar(props: SidebarProps) {
  const {
    page,
    visited,
    datasetId,
    theme,
    mobileOpen,
    shareRef,
    onPageChange,
    onDatasetChange,
    onToggleTheme,
  } = props;
  return (
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <header>
        <h1>MicroGPT</h1>
        <div className="subtitle">Explorateur visuel</div>
      </header>
      <nav>
        {PAGES.map((p) => (
          <NavItem
            key={p.id}
            id={p.id}
            num={p.num}
            label={p.label}
            sep={p.sep}
            active={page === p.id}
            visited={visited.has(p.id)}
            onClick={() => onPageChange(p.id)}
          />
        ))}
      </nav>
      <div className="dataset-picker">
        <div className="dataset-picker-label">Jeu de données</div>
        {DATASETS.map((d) => (
          <button
            key={d.id}
            className={`dataset-btn ${datasetId === d.id ? "active" : ""}`}
            onClick={() => onDatasetChange(d.id)}
            title={d.description}
          >
            {d.label}
          </button>
        ))}
      </div>
      <ThemePicker theme={theme} onToggle={onToggleTheme} />
      <SidebarFooter shareRef={shareRef} />
    </aside>
  );
}

function SidebarFooter(props: {
  shareRef: React.RefObject<HTMLDialogElement | null>;
}) {
  return (
    <div className="community-note">
      <span>
        Basé sur{" "}
        <a
          href="https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95"
          target="_blank"
          rel="noopener noreferrer"
        >
          microgpt.py d&apos;Andrej Karpathy
        </a>
        .
      </span>
      <button
        className="share-btn"
        onClick={() => props.shareRef.current?.showModal()}
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
  );
}
