/**
 * TermProvider — contexte global pour le modal unique du glossaire.
 *
 * Un seul <dialog> est rendu dans le DOM, à la racine de l'application.
 * Les composants <Term /> appellent `openModal(id)` via le contexte.
 */
import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { GLOSSARY } from "../data/glossary";

interface TermModalContext {
  openModal: (id: string) => void;
}

const TermModalCtx = createContext<TermModalContext>({
  openModal: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export function useTermModal() {
  return useContext(TermModalCtx);
}

export default function TermProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openModal = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  /* Ouvrir le dialog après que React a rendu le nouveau contenu */
  useEffect(() => {
    if (activeId && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [activeId]);

  const closeModal = useCallback(() => {
    dialogRef.current?.close();
    setActiveId(null);
  }, []);

  const def = activeId ? GLOSSARY[activeId] : null;

  return (
    <TermModalCtx.Provider value={{ openModal }}>
      {children}
      <dialog
        ref={dialogRef}
        className="term-modal"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}
        onClose={() => setActiveId(null)}
      >
        {def && (
          <div className="term-modal-content">
            <div className="term-modal-header">
              <h2 className="term-modal-title">{def.label}</h2>
              <button
                className="term-modal-close"
                onClick={closeModal}
                aria-label="Fermer"
                type="button"
              >
                &times;
              </button>
            </div>
            <p className="term-modal-short">{def.short}</p>
            <div className="term-modal-body">
              {def.long!.split("\n\n").map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}
      </dialog>
    </TermModalCtx.Provider>
  );
}
