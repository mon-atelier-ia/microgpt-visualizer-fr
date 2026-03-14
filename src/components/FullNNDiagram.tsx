import { memo } from "react";
import type { FullNNDiagramProps } from "./fullNNDiagram.types";
import { useFullNNDraw, makeTouchHandlers } from "./fullNNDiagram.hooks";
import "./FullNNDiagram.css";

const FullNNDiagram = memo(function FullNNDiagram(props: FullNNDiagramProps) {
  const {
    canvasRef,
    startAnimation,
    handleMouseMove,
    handleMouseLeave,
    handleToggleBackward,
    showBackward,
  } = useFullNNDraw(props);

  return (
    <>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Diagramme du réseau de neurones complet — 16 couches avec connexions résiduelles"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...makeTouchHandlers(handleMouseMove, handleMouseLeave)}
      />
      <div className="full-nn-controls">
        <button
          type="button"
          className="btn btn-secondary nn-replay"
          onClick={startAnimation}
        >
          ▶ Rejouer
        </button>
        <button
          type="button"
          className="btn btn-secondary nn-replay"
          onClick={handleToggleBackward}
        >
          {showBackward ? "Masquer le backward" : "Voir le backward"}
        </button>
      </div>
    </>
  );
});

export default FullNNDiagram;
