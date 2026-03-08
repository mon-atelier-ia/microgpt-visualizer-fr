/**
 * <Term id="token" /> — terme technique inline avec :
 *  - souligné pointillé + cursor help
 *  - tooltip accessible au hover/focus (WAI-ARIA, WCAG 1.4.13)
 *  - lien optionnel « En savoir plus » → modal unique (via TermProvider)
 *  - retournement automatique si proche du haut du viewport
 */
import { useId, useRef, useState, useEffect, useCallback } from "react";
import { GLOSSARY } from "../data/glossary";
import { useTermModal } from "./TermProvider";
import "./Term.css";

interface TermProps {
  id: string;
}

export default function Term({ id }: TermProps) {
  const def = GLOSSARY[id];
  const { openModal } = useTermModal();
  const [showTooltip, setShowTooltip] = useState(false);
  const [flipBelow, setFlipBelow] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const uniqueId = useId();
  const tooltipId = `${uniqueId}-tip`;
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const termRef = useRef<HTMLSpanElement>(null);

  useEffect(() => () => clearTimeout(hideTimeout.current), []);

  const show = useCallback(() => {
    clearTimeout(hideTimeout.current);
    if (termRef.current) {
      const rect = termRef.current.getBoundingClientRect();
      setFlipBelow(rect.top < 140);
      // Clamp tooltip to viewport on desktop only.
      // On mobile (≤768px), CSS switches to position:fixed full-width —
      // an inline transform would override transform:none and break layout.
      if (window.innerWidth > 768) {
        const tooltipW = 300; // max-width from CSS
        const center = rect.left + rect.width / 2;
        const margin = 8;
        if (center - tooltipW / 2 < margin) {
          setOffsetX(margin - (center - tooltipW / 2));
        } else if (center + tooltipW / 2 > window.innerWidth - margin) {
          setOffsetX(window.innerWidth - margin - (center + tooltipW / 2));
        } else {
          setOffsetX(0);
        }
      } else {
        setOffsetX(0);
      }
    }
    setShowTooltip(true);
  }, []);

  const hide = useCallback(() => {
    hideTimeout.current = setTimeout(() => setShowTooltip(false), 150);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setShowTooltip(false);
  }, []);

  const handleModalClick = useCallback(() => {
    setShowTooltip(false);
    openModal(id);
  }, [openModal, id]);

  if (!def) return <span>{id}</span>;

  return (
    <span
      className="term"
      ref={termRef}
      tabIndex={0}
      aria-describedby={showTooltip ? tooltipId : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={show}
      onKeyDown={handleKeyDown}
    >
      {def.label}

      {showTooltip && (
        <span
          className={`term-tooltip${flipBelow ? " term-tooltip--below" : ""}`}
          id={tooltipId}
          role="tooltip"
          style={
            offsetX
              ? { transform: `translateX(calc(-50% + ${offsetX}px))` }
              : undefined
          }
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <span className="term-tooltip-text">{def.short}</span>
          {def.long && (
            <button
              className="term-tooltip-link"
              onClick={handleModalClick}
              type="button"
            >
              En savoir plus
            </button>
          )}
        </span>
      )}
    </span>
  );
}
