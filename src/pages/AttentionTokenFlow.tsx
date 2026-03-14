import { memo } from "react";
import TokenBox from "../components/TokenBox";

interface TokenFlowProps {
  tokens: number[];
  n: number;
  safePos: number;
  onSelectPos: (i: number) => void;
  onInputChange: (val: string) => void;
  input: string;
  displayLabels: string[];
}

export const TokenFlowPanel = memo(function TokenFlowPanel({
  tokens,
  n,
  safePos,
  onSelectPos,
  onInputChange,
  input,
  displayLabels,
}: TokenFlowProps) {
  return (
    <div className="panel">
      <div className="panel-title">Une séquence complète</div>

      <label htmlFor="attention-name-input" className="sr-only">
        Nom à analyser
      </label>
      <input
        id="attention-name-input"
        className="input--name"
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="Tape un nom..."
        maxLength={14}
      />

      <div className="token-flow token-flow--animated">
        {tokens.map((t, i) => {
          const hasTrace = i < n;
          return (
            <TokenBox
              key={i}
              tokenId={t}
              index={i}
              className={hasTrace && i === safePos ? "token-box--selected" : ""}
              style={{ cursor: hasTrace ? "pointer" : undefined }}
              onClick={hasTrace ? () => onSelectPos(i) : undefined}
            />
          );
        })}
      </div>

      <div className="controls mt-8">
        <span className="label-dim">Position :</span>
        {displayLabels.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`btn btn-toggle btn-toggle--char ${i === safePos ? "" : "btn-secondary"}`}
            onClick={() => onSelectPos(i)}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="label-dim mt-4">
        Position {safePos} — le token « {displayLabels[safePos]} » voit{" "}
        {safePos === 0
          ? "uniquement lui-même"
          : `les ${safePos + 1} tokens de 0 à ${safePos}`}
      </div>

      <div className="explain mt-8">
        Quand le modèle lit un nom, il traite les tokens{" "}
        <b>un par un, de gauche à droite</b>. À chaque nouvelle position, il
        garde en mémoire les tokens déjà vus (leur clé K et leur valeur V) dans
        un <b>cache</b>. Clique un token ou une position pour observer
        l'attention.
      </div>
    </div>
  );
});
